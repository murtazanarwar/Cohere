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

  // Incoming events
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      setState({ type: "confirm", fromUserId: fromUserId as Id<"members"> });

      pc.current?.close(); // Cleanup old PC
      pc.current = new RTCPeerConnection(RTC_CONFIG);

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("secureDrop:candidate", {
            fromUserId: userId.toString(),
            toUserId: fromUserId,
            candidate: e.candidate,
          });
        }
      };

      pc.current.ondatachannel = (ev) => {
        dc.current = ev.channel;
        dc.current.onmessage = (msg) => console.log("Received:", msg.data);
      };

      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      socket.emit("secureDrop:answer", {
        fromUserId: userId.toString(),
        toUserId: fromUserId,
        sdp: answer,
      });

      setState({ type: "chat", peerUserId: fromUserId as Id<"members"> });
    };

    const handleAnswer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      await pc.current?.setRemoteDescription(new RTCSessionDescription(sdp));
      setState({ type: "chat", peerUserId: fromUserId as Id<"members"> });
    };

    const handleCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    };

    const handleEnd = () => {
      pc.current?.close();
      pc.current = null;
      dc.current = null;
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

  const initiate = async (toUserId: Id<"members">) => {
    if (!socket) throw new Error("Socket not ready");

    pc.current?.close();
    pc.current = new RTCPeerConnection(RTC_CONFIG);
    dc.current = pc.current.createDataChannel("chat");

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("secureDrop:candidate", {
          fromUserId: userId.toString(),
          toUserId: toUserId.toString(),
          candidate: e.candidate,
        });
      }
    };

    dc.current.onmessage = (msg) => console.log("Received:", msg.data);

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.emit("secureDrop:offer", {
      fromUserId: userId.toString(),
      toUserId: toUserId.toString(),
      sdp: offer,
    });

    setState({ type: "chat", peerUserId: toUserId });
  };

  const sendMessage = (msg: string) => {
    dc.current?.send(msg);
  };

  const end = (toUserId: Id<"members">) => {
    pc.current?.close();
    dc.current = null;
    socket?.emit("secureDrop:end", { fromUserId: userId.toString(), toUserId: toUserId.toString() });
    setState({ type: "idle" });
  };

  return { state, initiate, sendMessage, end };
};
