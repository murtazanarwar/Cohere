import { useEffect, useRef } from "react";
import { RTC_CONFIG } from "@/lib/webrtc-config";
import { useSecureDropContext } from "@/components/secure-drop-provider";
import { useSocket } from "@/provider/socket-provider";
import { Id } from "../../../../convex/_generated/dataModel";

export const useSecureDrop = (userId: Id<"members">) => {
  const { socket } = useSocket();
  const { state, setState } = useSecureDropContext();
  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);
  const stateRef = useRef(state);
  const endedRef = useRef(false); // 🔹 track if session is ended

  // keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** 🔹 Setup WebRTC handlers */
  const setupPeer = (fromUserId: string) => {
    pc.current?.close();
    pc.current = new RTCPeerConnection(RTC_CONFIG);
    endedRef.current = false; // reset ended flag when new peer created

    // ICE candidates
    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit("secureDrop:candidate", {
          fromUserId: userId.toString(),
          toUserId: fromUserId,
          candidate: e.candidate,
        });
      }
    };

    // Data channel (when remote creates it)
    pc.current.ondatachannel = (ev) => {
      dc.current = ev.channel;
      dc.current.onmessage = (msg) => console.log("Received:", msg.data);
    };

    // Monitor connection state
    pc.current.onconnectionstatechange = () => {
      console.log("PeerConnection state:", pc.current?.connectionState);
      if (
        pc.current?.connectionState === "disconnected" ||
        pc.current?.connectionState === "failed" ||
        pc.current?.connectionState === "closed"
      ) {
        cleanup();
        setState({ type: "idle" });
      }
    };
  };

  /** 🔹 Cleanup */
  const cleanup = () => {
    pc.current?.close();
    pc.current = null;
    dc.current = null;
    endedRef.current = true; // mark session ended
  };

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (endedRef.current) return; // ignore if already ended
      setState({ type: "confirm", fromUserId: fromUserId as Id<"members"> });

      setupPeer(fromUserId);

      await pc.current?.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current?.createAnswer();
      if (!answer) return;
      await pc.current?.setLocalDescription(answer);

      socket.emit("secureDrop:answer", {
        fromUserId: userId.toString(),
        toUserId: fromUserId,
        sdp: { type: answer.type, sdp: answer.sdp },
      });

      if (!endedRef.current) {
        setState({ type: "chat", peerUserId: fromUserId as Id<"members"> });
      }
    };

    const handleAnswer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (endedRef.current) return; // ignore late answers
      await pc.current?.setRemoteDescription(new RTCSessionDescription(sdp));
      setState({ type: "chat", peerUserId: fromUserId as Id<"members"> });
    };

    const handleCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (endedRef.current) return; // ignore late candidates
      try {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    };

    const handleEnd = ({ fromUserId }: { fromUserId: string }) => {
      if (endedRef.current) return; // already ended
      if (stateRef.current.type !== "chat") return;
      if (stateRef.current.peerUserId !== fromUserId) return;

      console.log("Received remote end from:", fromUserId);

      cleanup();
      setState({ type: "idle" });
    };

    socket.on("secureDrop:offer", handleOffer);
    socket.on("secureDrop:answer", handleAnswer);
    socket.on("secureDrop:candidate", handleCandidate);
    socket.on("secureDrop:end", handleEnd);

    return () => {
      socket.off("secureDrop:offer", handleOffer);
      socket.off("secureDrop:answer", handleAnswer);
      socket.off("secureDrop:candidate", handleCandidate);
      socket.off("secureDrop:end", handleEnd);
    };
  }, [socket, userId, setState]);

  /** 🔹 Debug state changes */
  useEffect(() => {
    console.log("State changed:", state.type);
  }, [state]);

  /** 🔹 Start a new secure drop */
  const initiate = async (toUserId: Id<"members">) => {
    if (!socket) throw new Error("Socket not ready");
    if (endedRef.current) return; // block if session was ended

    setupPeer(toUserId.toString());

    dc.current = pc.current!.createDataChannel("chat");
    dc.current.onmessage = (msg) => console.log("Received:", msg.data);

    const offer = await pc.current!.createOffer();
    await pc.current!.setLocalDescription(offer);

    socket.emit("secureDrop:offer", {
      fromUserId: userId.toString(),
      toUserId: toUserId.toString(),
      sdp: { type: offer.type, sdp: offer.sdp },
    });

    if (!endedRef.current) {
      setState({ type: "chat", peerUserId: toUserId });
    }
  };

  /** 🔹 Send a message */
  const sendMessage = (msg: string) => {
    dc.current?.send(msg);
  };

  /** 🔹 End the session (local only) */
  const end = (toUserId: Id<"members">) => {
    console.log("Local end triggered with", toUserId, new Error().stack);
    // console.log("Local end triggered with", toUserId);

    cleanup();

    socket?.emit("secureDrop:end", {
      fromUserId: userId.toString(),
      toUserId: toUserId.toString(),
    });

    setState({ type: "idle" });
  };

  return { state, initiate, sendMessage, end };
};
