// use-secure-drop.ts
"use client";
import { useEffect, useRef } from "react";
import { useSocket } from "@/provider/socket-provider";

export type SecureDropEvents = {
  onIncomingOffer?: (fromUserId: string, sdp: RTCSessionDescriptionInit) => void;
  onIncomingAnswer?: (fromUserId: string, sdp: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (fromUserId: string, candidate: RTCIceCandidateInit) => void;
  onDisconnected?: (fromUserId?: string) => void;
};

export function useSecureDrop(currentUserId: string, events: SecureDropEvents) {
  const { socket } = useSocket();
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Incoming offer forwarded by server: { fromUserId, sdp }
    const onOffer = ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      events.onIncomingOffer?.(fromUserId, sdp);
    };

    // Incoming answer forwarded by server: { fromUserId, sdp }
    const onAnswer = ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      events.onIncomingAnswer?.(fromUserId, sdp);
    };

    // Incoming ICE candidate forwarded by server: { fromUserId, candidate }
    const onCandidate = ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      events.onIceCandidate?.(fromUserId, candidate);
    };

    // End session forwarded by server: { fromUserId }
    const onEnd = ({ fromUserId }: { fromUserId?: string }) => {
      events.onDisconnected?.(fromUserId);
    };

    socket.on("secureDrop:offer", onOffer);
    socket.on("secureDrop:answer", onAnswer);
    socket.on("secureDrop:candidate", onCandidate);
    socket.on("secureDrop:end", onEnd);

    return () => {
      socket.off("secureDrop:offer", onOffer);
      socket.off("secureDrop:answer", onAnswer);
      socket.off("secureDrop:candidate", onCandidate);
      socket.off("secureDrop:end", onEnd);
    };
  }, [socket, events, currentUserId]);

  function createPeerConnection(remoteUserId: string) {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        // server expects { fromUserId, toUserId, candidate }
        socket?.emit("secureDrop:candidate", {
          fromUserId: currentUserId,
          toUserId: remoteUserId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        // notify peer via server that we ended (optional)
        socket?.emit("secureDrop:end", { fromUserId: currentUserId, toUserId: remoteUserId });
        events.onDisconnected?.(remoteUserId);
      }
    };

    return pc;
  }

  // Initiate a call: create offer and emit to server with fromUserId + toUserId
  async function initiate(toUserId: string) {
    const pc = createPeerConnection(toUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket?.emit("secureDrop:offer", {
      fromUserId: currentUserId,
      toUserId,
      sdp: offer,
    });
  }

  // Accept an incoming offer: set remote, create answer, emit answer back
  async function accept(toUserId: string, remoteSdp: RTCSessionDescriptionInit) {
    const pc = createPeerConnection(toUserId);
    await pc.setRemoteDescription(remoteSdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket?.emit("secureDrop:answer", {
      fromUserId: currentUserId,
      toUserId,
      sdp: answer,
    });
  }

  // Called when we receive a remote answer (from onIncomingAnswer handler)
  async function handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(sdp);
  }

  // Called when we receive a remote ice candidate (from onIceCandidate handler)
  async function handleCandidate(candidate: RTCIceCandidateInit) {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(candidate as RTCIceCandidateInit);
    } catch (err) {
      // ignore benign addIceCandidate errors
      console.warn("addIceCandidate failed", err);
    }
  }

  // End session with the specific peer (emit end to server)
  function end(toUserId?: string) {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (toUserId) {
      socket?.emit("secureDrop:end", { fromUserId: currentUserId, toUserId });
    }
  }

  return { initiate, accept, handleAnswer, handleCandidate, end };
}
