"use client";
import SecureDropConfirmModal from "@/features/secure-drop/components/secure-drop-confirm-modal";
import SecureDropModal from "@/features/secure-drop/components/secure-drop-modal";
import { createContext, useContext, useState, ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

type SecureDropState =
  | { type: "idle" }
  | { type: "confirm"; fromUserId: Id<"members"> }
  | { type: "chat"; peerUserId: Id<"members"> };

type SecureDropContextType = {
  state: SecureDropState;
  setState: (s: SecureDropState) => void;
};

const SecureDropContext = createContext<SecureDropContextType | null>(null);

export const SecureDropProvider = ({ children, currentUserId }: { children: ReactNode; currentUserId: Id<"members"> }) => {
  const [state, setState] = useState<SecureDropState>({ type: "idle" });

  return (
    <SecureDropContext.Provider value={{ state, setState }}>
      {children}

      {state.type === "confirm" && (
        <SecureDropConfirmModal
          fromUserName={state.fromUserId.toString()} // fetch real name if needed
          onAccept={() => setState({ type: "chat", peerUserId: state.fromUserId })}
          onDecline={() => setState({ type: "idle" })}
        />
      )}

      {state.type === "chat" && (
        <SecureDropModal
          currentUserId={currentUserId}
          targetUserId={state.peerUserId}
          onClose={() => setState({ type: "idle" })}
        />
      )}
    </SecureDropContext.Provider>
  );
};


export const useSecureDropContext = () => {
  const ctx = useContext(SecureDropContext);
  if (!ctx) throw new Error("useSecureDropContext must be used within SecureDropProvider");
  return ctx;
};
