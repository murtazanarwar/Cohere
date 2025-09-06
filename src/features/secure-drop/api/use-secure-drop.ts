// use-secure-drop.ts
"use client";
import { useEffect, useRef } from "react";
import { useSocket } from "@/provider/socket-provider";

/**
 * Simple file transfer protocol over DataChannel:
 * - JSON control messages (stringified) with shape { type: "text" | "file-meta" | "file-complete" , ... }
 * - Binary chunks sent as ArrayBuffer for file data
 *
 * Chunking: 64KB per chunk (safe default)
 */

export type FileMeta = {
  id: string;
  name: string;
  size: number;
  mime?: string;
};

export type SecureDropEvents = {
  onIncomingOffer?: (fromUserId: string, sdp: RTCSessionDescriptionInit) => void;
  onIncomingAnswer?: (fromUserId: string, sdp: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (fromUserId: string, candidate: RTCIceCandidateInit) => void;
  onDisconnected?: (fromUserId?: string) => void;

  // DataChannel events
  onMessage?: (fromUserId: string, text: string) => void;
  onFileStart?: (fromUserId: string, meta: FileMeta) => void;
  onFileProgress?: (fromUserId: string, fileId: string, receivedBytes: number, totalBytes: number) => void;
  onFileReceived?: (fromUserId: string, file: File) => void;
};

const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB

export function useSecureDrop(currentUserId: string, events: SecureDropEvents) {
  const { socket } = useSocket();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // receiver-side incomplete file buffers: map fileId -> { meta, chunks: ArrayBuffer[], received }
  const incomingFilesRef = useRef<Record<string, { meta: FileMeta; chunks: ArrayBuffer[]; received: number }>>({});

  useEffect(() => {
    if (!socket) return;

    const onOffer = ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      events.onIncomingOffer?.(fromUserId, sdp);
    };

    const onAnswer = ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      events.onIncomingAnswer?.(fromUserId, sdp);
    };

    const onCandidate = ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      events.onIceCandidate?.(fromUserId, candidate);
    };

    const onEnd = ({ fromUserId }: { fromUserId?: string }) => {
      events.onDisconnected?.(fromUserId);
      clearConnection();
    };

    const onDecline = ({ fromUserId }: { fromUserId: string }) => {
      // treat decline as a disconnect event for initiator
      events.onDisconnected?.(fromUserId);
      clearConnection();
    };

    socket.on("secureDrop:offer", onOffer);
    socket.on("secureDrop:answer", onAnswer);
    socket.on("secureDrop:candidate", onCandidate);
    socket.on("secureDrop:end", onEnd);
    socket.on("secureDrop:decline", onDecline);

    return () => {
      socket.off("secureDrop:offer", onOffer);
      socket.off("secureDrop:answer", onAnswer);
      socket.off("secureDrop:candidate", onCandidate);
      socket.off("secureDrop:end", onEnd);
      socket.off("secureDrop:decline", onDecline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUserId, events]);

  function setupDataChannelHandlers(channel: RTCDataChannel, remoteUserId: string) {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      console.log("[secureDrop] dataChannel open ->", remoteUserId);
    };

    channel.onclose = () => {
      console.log("[secureDrop] dataChannel closed ->", remoteUserId);
    };

    channel.onerror = (err) => {
      console.warn("[secureDrop] dataChannel error", err);
    };

    channel.onmessage = (ev) => {
      const data = ev.data;
      // If it's a string, expect control JSON
      if (typeof data === "string") {
        try {
          const obj = JSON.parse(data);
          if (obj && obj.type === "text" && typeof obj.text === "string") {
            events.onMessage?.(remoteUserId, obj.text);
            return;
          }
          if (obj && obj.type === "file-meta") {
            const meta: FileMeta = obj.meta;
            incomingFilesRef.current[meta.id] = { meta, chunks: [], received: 0 };
            events.onFileStart?.(remoteUserId, meta);
            return;
          }
          if (obj && obj.type === "file-complete") {
            const { id } = obj;
            const entry = incomingFilesRef.current[id];
            if (entry) {
              const blob = new Blob(entry.chunks, { type: entry.meta.mime || "application/octet-stream" });
              const file = new File([blob], entry.meta.name, { type: entry.meta.mime || "application/octet-stream" });
              delete incomingFilesRef.current[id];
              events.onFileReceived?.(remoteUserId, file);
            }
            return;
          }
        } catch (e) {
          console.warn("[secureDrop] failed to parse control message", e);
        }
      } else if (data instanceof ArrayBuffer || data instanceof Blob) {
        // binary chunk for a file
        const bufferPromise = data instanceof Blob ? data.arrayBuffer() : Promise.resolve(data as ArrayBuffer);
        bufferPromise.then((arrBuf) => {
          // We need to determine which file this chunk belongs to.
          // Our simple protocol: sender first sent file-meta with id, then streams raw ArrayBuffers.
          // We'll push chunks into the first active file (most recent).
          // For robustness, you can prefix every chunk with a small JSON header (more complex).
          const ids = Object.keys(incomingFilesRef.current);
          if (ids.length === 0) {
            console.warn("[secureDrop] received binary but no file-meta present");
            return;
          }
          // pick the oldest in map insertion order
          const fileId = ids[0];
          const entry = incomingFilesRef.current[fileId];
          entry.chunks.push(arrBuf);
          entry.received += arrBuf.byteLength;
          events.onFileProgress?.(remoteUserId, fileId, entry.received, entry.meta.size);
        });
      } else {
        console.warn("[secureDrop] unknown data channel payload type", typeof data);
      }
    };
  }

  function clearConnection() {
    try {
      dataChannelRef.current?.close();
    } catch (_) {}
    dataChannelRef.current = null;
    try {
      pcRef.current?.close();
    } catch (_) {}
    pcRef.current = null;
    incomingFilesRef.current = {};
  }

  function createPeerConnection(remoteUserId: string, isInitiator = false) {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // If initiator, create data channel now
    if (isInitiator) {
      const channel = pc.createDataChannel("secureDropChannel");
      setupDataChannelHandlers(channel, remoteUserId);
    }

    pc.ondatachannel = (ev) => {
      // receiver will get this when the remote (initiator) created the channel
      setupDataChannelHandlers(ev.channel, remoteUserId);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit("secureDrop:candidate", {
          fromUserId: currentUserId,
          toUserId: remoteUserId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (!pcRef.current) return;
      if (pcRef.current.connectionState === "disconnected" || pcRef.current.connectionState === "failed") {
        socket?.emit("secureDrop:end", { fromUserId: currentUserId, toUserId: remoteUserId });
        events.onDisconnected?.(remoteUserId);
        clearConnection();
      }
    };

    return pc;
  }

  // Signaling functions
  async function initiate(toUserId: string) {
    const pc = createPeerConnection(toUserId, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket?.emit("secureDrop:offer", {
      fromUserId: currentUserId,
      toUserId,
      sdp: offer,
    });
  }

  async function accept(toUserId: string, remoteSdp: RTCSessionDescriptionInit) {
    const pc = createPeerConnection(toUserId, false);
    await pc.setRemoteDescription(remoteSdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket?.emit("secureDrop:answer", {
      fromUserId: currentUserId,
      toUserId,
      sdp: answer,
    });
  }

  async function handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(sdp);
  }

  async function handleCandidate(candidate: RTCIceCandidateInit) {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(candidate as RTCIceCandidateInit);
    } catch (err) {
      console.warn("addIceCandidate failed", err);
    }
  }

  async function decline(toUserId: string) {
    socket?.emit("secureDrop:decline", {
      fromUserId: currentUserId,
      toUserId,
    });
    clearConnection();
  }

  function end(toUserId?: string) {
    if (toUserId) {
      socket?.emit("secureDrop:end", { fromUserId: currentUserId, toUserId });
    }
    clearConnection();
  }

  // DATA API: send text message
  function sendMessage(text: string) {
    const ch = dataChannelRef.current;
    if (!ch || ch.readyState !== "open") {
      throw new Error("dataChannel not open");
    }
    const payload = JSON.stringify({ type: "text", text });
    ch.send(payload);
  }

  // DATA API: send file (chunked)
  async function sendFile(file: File, toUserId: string, chunkSize = DEFAULT_CHUNK_SIZE) {
    const ch = dataChannelRef.current;
    if (!ch || ch.readyState !== "open") {
      throw new Error("dataChannel not open");
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const meta: FileMeta = { id, name: file.name, size: file.size, mime: file.type };

    // 1. send file-meta
    ch.send(JSON.stringify({ type: "file-meta", meta }));

    // 2. stream chunks
    const stream = file.stream();
    const reader = stream.getReader();
    let readResult = await reader.read();
    let sent = 0;
    while (!readResult.done) {
      const chunk = readResult.value; // Uint8Array
      // send ArrayBuffer directly
      ch.send(chunk.buffer);
      sent += chunk.byteLength;
      // optionally call event to report sender progress — you can add an event later
      readResult = await reader.read();
    }

    // 3. notify completion
    ch.send(JSON.stringify({ type: "file-complete", id }));
    return id;
  }

  return {
    // signaling
    initiate,
    accept,
    handleAnswer,
    handleCandidate,
    decline,
    end,
    // data
    sendMessage,
    sendFile,
  };
}
