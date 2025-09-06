"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSecureDrop, FileMeta, SecureDropEvents } from "@/features/secure-drop/api/use-secure-drop";
import SecureDropConfirmModal from "@/features/secure-drop/components/secure-drop-confirm-modal";
import SecureDropModal from "@/features/secure-drop/components/secure-drop-modal";
import { fetchDynamicRTCConfig } from "@/lib/webrtc-config";

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

export function SecureDropProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode;
  currentUserId: string;
}) {
  const [state, setState] = useState<State>({ type: "idle" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rtcConfig, setRtcConfig] = useState<RTCConfiguration | null>(null);

  // Load dynamic RTC config (TURN + fallback STUN)
  useEffect(() => {
    fetchDynamicRTCConfig().then(setRtcConfig).catch(console.error);
  }, []);

  const pushMessage = (msg: ChatMessage) => setMessages((s) => [...s, msg]);

  const events: SecureDropEvents = {
    onIncomingOffer: (fromUserId, sdp) => setState({ type: "confirm", fromId: fromUserId, sdp }),
    onIncomingAnswer: (fromUserId, sdp) => {
      handleAnswer(sdp);
      setState((s) =>
        s.type === "waiting" && s.targetId === fromUserId ? { type: "chat", peerId: fromUserId } : s
      );
    },
    onIceCandidate: (fromUserId, candidate) => handleCandidate(candidate),
    onDisconnected: () => setState({ type: "idle" }),
    onMessage: (fromUserId, text) => pushMessage({ id: `${Date.now()}-${Math.random()}`, from: fromUserId, text, ts: Date.now(), direction: "in" }),
    onFileStart: (fromUserId, meta: FileMeta) =>
      pushMessage({ id: meta.id, from: fromUserId, file: new File([], meta.name), ts: Date.now(), direction: "in", status: "sending" }),
    onFileProgress: (fromUserId, fileId, received, total) =>
      setMessages((cur) => cur.map((m) => (m.id === fileId ? { ...m, status: received >= total ? "received" : "sending" } : m))),
    onFileReceived: (fromUserId, file) =>
      pushMessage({ id: `${Date.now()}-${Math.random()}`, from: fromUserId, file, ts: Date.now(), direction: "in", status: "received" }),
  };

  // Wait for rtcConfig before initializing SecureDrop
  const {
    initiate: rawInitiate,
    accept: rawAccept,
    handleAnswer,
    handleCandidate,
    decline,
    end: rawEnd,
    sendMessage: rawSendMessage,
    sendFile: rawSendFile,
  } = useSecureDrop(currentUserId, events, rtcConfig!);

  function initiate(to: string) {
    if (!rtcConfig) return console.warn("RTC config not ready");
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

  function sendMessage(text: string) {
    try {
      rawSendMessage(text);
      pushMessage({ id: `${Date.now()}-${Math.random()}`, from: currentUserId, text, ts: Date.now(), direction: "out" });
    } catch (err) {
      console.warn("sendMessage error", err);
      throw err;
    }
  }

  async function sendFile(file: File) {
    const msgId = `${Date.now()}-${Math.random()}`;
    pushMessage({ id: msgId, from: currentUserId, file, ts: Date.now(), direction: "out", status: "sending" });
    try {
      const sentId = await rawSendFile(file, state.type === "chat" ? state.peerId : state.type === "waiting" ? state.targetId! : undefined as any);
      setMessages((cur) => cur.map((m) => (m.id === msgId ? { ...(m as any), status: "sent" } : m)));
      return sentId;
    } catch (err) {
      setMessages((cur) => cur.map((m) => (m.id === msgId ? { ...(m as any), status: "sending" } : m)));
      console.warn("sendFile failed", err);
      throw err;
    }
  }

  return (
    <SecureDropContext.Provider value={{ initiate, end: stop, sendMessage, sendFile, state, messages }}>
      {children}

      {state.type === "waiting" && <SecureDropModal peerId={state.targetId} waiting onClose={stop} />}
      {state.type === "confirm" && (
        <SecureDropConfirmModal fromUserName={state.fromId} onAccept={confirmAccept} onDecline={confirmDecline} />
      )}
      {state.type === "chat" && <SecureDropModal peerId={state.peerId} onClose={stop} />}
    </SecureDropContext.Provider>
  );
}
