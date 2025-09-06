// secure-drop-provider.tsx
"use client";
import React, { createContext, useContext, useState } from "react";
import { useSecureDrop } from "@/features/secure-drop/api/use-secure-drop";
import SecureDropConfirmModal from "@/features/secure-drop/components/secure-drop-confirm-modal";
import SecureDropModal from "@/features/secure-drop/components/secure-drop-modal";

type State =
  | { type: "idle" }
  | { type: "waiting"; targetId: string }
  | { type: "confirm"; fromId: string; sdp: RTCSessionDescriptionInit }
  | { type: "chat"; peerId: string };

interface SecureDropContextType {
  initiate: (to: string) => void;
  end: () => void;
  state: State;
}

const SecureDropContext = createContext<SecureDropContextType | null>(null);
export function useSecureDropContext() {
  const ctx = useContext(SecureDropContext);
  if (!ctx) throw new Error("SecureDropProvider missing");
  return ctx;
}

/**
 * NOTE: provider requires currentUserId so emitted payloads include fromUserId.
 * Pass your logged-in user's id here.
 */
export function SecureDropProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode;
  currentUserId: string;
}) {
  const [state, setState] = useState<State>({ type: "idle" });

  const { initiate, accept, decline, handleAnswer, handleCandidate, end } = useSecureDrop(
    currentUserId,
    {
      onIncomingOffer: (fromUserId, sdp) => {
        // Show confirm modal
        setState({ type: "confirm", fromId: fromUserId, sdp });
      },
      onIncomingAnswer: (fromUserId, sdp) => {
        // Only move to chat if we were waiting for this user
        handleAnswer(sdp);
        setState((s) =>
          s.type === "waiting" && s.targetId === fromUserId ? { type: "chat", peerId: fromUserId } : s
        );
      },
      onIceCandidate: (fromUserId, candidate) => {
        // ensure candidate is forwarded into the current peer connection
        handleCandidate(candidate as RTCIceCandidateInit);
      },
      onDisconnected: (fromUserId) => {
        // remote ended or connection dropped
        setState({ type: "idle" });
      },
    }
  );

  function start(to: string) {
    initiate(to);
    setState({ type: "waiting", targetId: to });
  }

  function confirmAccept() {
    if (state.type === "confirm") {
      // accept the incoming offer, reply to sender
      accept(state.fromId, state.sdp);
      setState({ type: "chat", peerId: state.fromId });
    }
  }

  function confirmDecline() {
    if (state.type === "confirm") {
      decline(state.fromId); // notify the initiator
      setState({ type: "idle" });
    }
  }

  function stop() {
    // figure out peer id to notify
    const peerId =
      state.type === "chat" ? state.peerId : state.type === "waiting" ? state.targetId : undefined;
    end(peerId);
    setState({ type: "idle" });
  }

  return (
    <SecureDropContext.Provider value={{ initiate: start, end: stop, state }}>
      {children}

      {state.type === "waiting" && (
        <SecureDropModal peerId={state.targetId} waiting onClose={stop} />
      )}

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
