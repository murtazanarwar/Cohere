// secure-drop-provider.tsx
"use client";
import React, { createContext, useContext, useState } from "react";
import { useSecureDrop, FileMeta, SecureDropEvents } from "@/features/secure-drop/api/use-secure-drop";
import SecureDropConfirmModal from "@/features/secure-drop/components/secure-drop-confirm-modal";
import SecureDropModal from "@/features/secure-drop/components/secure-drop-modal";
import { RTC_CONFIG } from "@/lib/webrtc-config";

type State =
  | { type: "idle" }
  | { type: "waiting"; targetId: string }
  | { type: "confirm"; fromId: string; sdp: RTCSessionDescriptionInit }
  | { type: "chat"; peerId: string };

export type ChatMessage =
  | { id: string; from: string; text: string; ts: number; direction: "out" | "in" }
  | { id: string; from: string; file: File; ts: number; direction: "out" | "in"; status?: "sending" | "sent" | "received" };

interface SecureDropContextType {
  initiate: (to: string) => void;
  end: () => void;
  sendMessage: (text: string) => void;
  sendFile: (file: File) => Promise<string>;
  state: State;
  messages: ChatMessage[];
}

const SecureDropContext = createContext<SecureDropContextType | null>(null);
export function useSecureDropContext() {
  const ctx = useContext(SecureDropContext);
  if (!ctx) throw new Error("SecureDropProvider missing");
  return ctx;
}

/**
 * Provider requires currentUserId so emitted payloads include fromUserId.
 */
export function SecureDropProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode;
  currentUserId: string;
}) {
  const [state, setState] = useState<State>({ type: "idle" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // helper to push message into history
  const pushMessage = (msg: ChatMessage) => setMessages((s) => [...s, msg]);

  const events: SecureDropEvents = {
    onIncomingOffer: (fromUserId, sdp) => {
      setState({ type: "confirm", fromId: fromUserId, sdp });
    },
    onIncomingAnswer: (fromUserId, sdp) => {
      handleAnswer(sdp);
      setState((s) =>
        s.type === "waiting" && s.targetId === fromUserId ? { type: "chat", peerId: fromUserId } : s
      );
    },
    onIceCandidate: (fromUserId, candidate) => {
      handleCandidate(candidate);
    },
    onDisconnected: () => {
      setState({ type: "idle" });
    },
    // Data callbacks
    onMessage: (fromUserId, text) => {
      pushMessage({ id: `${Date.now()}-${Math.random()}`, from: fromUserId, text, ts: Date.now(), direction: "in" });
    },
    onFileStart: (fromUserId, meta: FileMeta) => {
      // Optionally show a placeholder — will be replaced on onFileReceived
      pushMessage({
        id: meta.id,
        from: fromUserId,
        file: new File([], meta.name),
        ts: Date.now(),
        direction: "in",
        status: "sending",
      });
    },
    onFileProgress: (fromUserId, fileId, received, total) => {
      // you could update progress state per message if desired
      // find message and update (best-effort)
      setMessages((cur) =>
        cur.map((m) => (m.id === fileId ? { ...m, status: received >= total ? "received" : "sending" } : m))
      );
    },
    onFileReceived: (fromUserId, file) => {
      pushMessage({ id: `${Date.now()}-${Math.random()}`, from: fromUserId, file, ts: Date.now(), direction: "in", status: "received" });
    },
  };

  const {
    initiate: rawInitiate,
    accept: rawAccept,
    handleAnswer,
    handleCandidate,
    decline,
    end: rawEnd,
    sendMessage: rawSendMessage,
    sendFile: rawSendFile,
  } = useSecureDrop(currentUserId, events, RTC_CONFIG);

  function initiate(to: string) {
    rawInitiate(to);
    setState({ type: "waiting", targetId: to });
  }

  function confirmAccept() {
    if (state.type === "confirm") {
      rawAccept(state.fromId, state.sdp);
      setState({ type: "chat", peerId: state.fromId });
    }
  }

  async function confirmDecline() {
    if (state.type === "confirm") {
      decline(state.fromId);
      setState({ type: "idle" });
    }
  }

  async function stop() {
    const peerId =
      state.type === "chat" ? state.peerId : state.type === "waiting" ? state.targetId : undefined;
    rawEnd(peerId);
    setState({ type: "idle" });
  }

  // expose wrapped sendMessage that also stores it locally
  function sendMessage(text: string) {
    try {
      rawSendMessage(text);
      pushMessage({ id: `${Date.now()}-${Math.random()}`, from: currentUserId, text, ts: Date.now(), direction: "out" });
    } catch (err) {
      console.warn("sendMessage error", err);
      throw err;
    }
  }

  // expose wrapped sendFile that also stores and updates the local message
  async function sendFile(file: File) {
    const msgId = `${Date.now()}-${Math.random()}`;
    // optimistic push (status: sending)
    pushMessage({ id: msgId, from: currentUserId, file, ts: Date.now(), direction: "out", status: "sending" });
    try {
      const sentId = await rawSendFile(file, state.type === "chat" ? state.peerId : state.type === "waiting" ? state.targetId! : undefined as any);
      // mark as sent
      setMessages((cur) => cur.map((m) => (m.id === msgId ? { ...(m as any), status: "sent" } : m)));
      return sentId;
    } catch (err) {
      // mark failed (you can add retry UI)
      setMessages((cur) => cur.map((m) => (m.id === msgId ? { ...(m as any), status: "sending" } : m)));
      console.warn("sendFile failed", err);
      throw err;
    }
  }

  return (
    <SecureDropContext.Provider
      value={{
        initiate,
        end: stop,
        sendMessage,
        sendFile,
        state,
        messages,
      }}
    >
      {children}

      {state.type === "waiting" && <SecureDropModal peerId={state.targetId} waiting onClose={stop} />}

      {state.type === "confirm" && (
        <SecureDropConfirmModal
          fromUserName={state.fromId}
          onAccept={confirmAccept}
          onDecline={confirmDecline}
        />
      )}

      {state.type === "chat" && <SecureDropModal peerId={state.peerId} onClose={stop} />}
    </SecureDropContext.Provider>
  );
}
