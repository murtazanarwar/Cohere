import { useEffect, useRef, useState } from 'react';
import { initSocket, getSocket } from '../../../lib/socket';
import { RTC_CONFIG } from '@/lib/webrtc-config';
import { v4 as uuidv4 } from 'uuid';

type Message = { id: string; text?: string; fromMe?: boolean; time: number; url?: string };
type FileMeta = { fileId: string; name: string; size: number; mime?: string };

export function useSecureDrop({ currentUserId, token }: { currentUserId: string; token?: string }) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const socketRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  // For receiving: map fileId -> chunks (Uint8Array[])
  const receivingStateRef = useRef<{ currentFileId?: string; transfers: Record<string, Uint8Array[]> }>({
    currentFileId: undefined,
    transfers: {},
  });

  // For sending: track current file being sent on this channel
  const currentSendingFileIdRef = useRef<string | null>(null);

  useEffect(() => {
    const s = initSocket(currentUserId, token);
    socketRef.current = s;

    s.on('connect', () => {
      console.log('socket connected', s.id);
    });

    s.on('secure-drop-invite', (payload: { fromUserId: string; meta?: any }) => {
      // application-level: show invite UI to user (handled outside hook)
      console.log('secure-drop-invite from', payload.fromUserId);
    });

    s.on('secure-offer', async (payload: { sdp: any; sessionId: string; fromUserId: string }) => {
      await handleRemoteOffer(payload.sdp, payload.sessionId, payload.fromUserId);
    });

    s.on('secure-answer', async (payload: { sdp: any }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    s.on('secure-ice-candidate', async (payload: { candidate: any }) => {
      try {
        if (pcRef.current && payload.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (e) {
        console.warn('addIceCandidate failed', e);
      }
    });

    s.on('secure-drop-declined', (payload: any) => {
      // handle declined invites if needed
      console.log('secure-drop-declined', payload);
    });

    s.on('secure-drop-ended', (payload: any) => {
      // remote ended the session
      cleanupPeer();
    });

    return () => {
      s.off('connect');
      s.off('secure-drop-invite');
      s.off('secure-offer');
      s.off('secure-answer');
      s.off('secure-ice-candidate');
      s.off('secure-drop-declined');
      s.off('secure-drop-ended');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, token]);

  // Utility to create RTCPeerConnection and wire basic handlers
  function createPeerConnection(toUserId: string, isInitiator: boolean) {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        getSocket().emit('secure-ice-candidate', { toUserId, candidate: ev.candidate, sessionId: sessionIdRef.current });
      }
    };

    if (!isInitiator) {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') setConnected(true);
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setConnected(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }

  // DataChannel setup and message handling (text + file)
  function setupDataChannel(dc: RTCDataChannel) {
    dcRef.current = dc;

    dc.onopen = () => {
      // console.log('DataChannel open');
    };
    dc.onclose = () => {
      // console.log('DataChannel closed');
    };

    dc.onmessage = (ev) => {
      // Textual control frames are JSON strings, binary frames are file chunks
      if (typeof ev.data === 'string') {
        try {
          const obj = JSON.parse(ev.data);
          if (obj.type === 'text') {
            setMessages((prev) => [...prev, { id: obj.id, text: obj.text, fromMe: false, time: Date.now() }]);
          } else if (obj.type === 'file-meta') {
            const meta = obj as FileMeta;
            receivingStateRef.current.transfers[meta.fileId] = [];
            receivingStateRef.current.currentFileId = meta.fileId;
            // Optionally store meta somewhere if you want to show progress
            setMessages((prev) => [...prev, { id: meta.fileId, text: `Receiving ${meta.name}…`, fromMe: false, time: Date.now() }]);
          } else if (obj.type === 'file-end') {
            const meta = obj as FileMeta;
            const buffers = receivingStateRef.current.transfers[meta.fileId] || [];
            // Convert Uint8Array[] -> ArrayBuffer[] safely for Blob constructor
            const arrayBuffers: ArrayBuffer[] = buffers.map((u8) => u8.slice().buffer);
            const blob = new Blob(arrayBuffers, { type: meta.mime ?? 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            setMessages((prev) => [
              ...prev,
              { id: meta.fileId, text: `File received: ${meta.name} (${meta.size} bytes)`, fromMe: false, time: Date.now(), url },
            ]);

            // cleanup
            delete receivingStateRef.current.transfers[meta.fileId];
            if (receivingStateRef.current.currentFileId === meta.fileId) {
              receivingStateRef.current.currentFileId = undefined;
            }
          }
        } catch (err) {
          console.warn('invalid control frame', err);
        }
      } else if (ev.data instanceof ArrayBuffer) {
        // binary chunk for current transfer
        const current = receivingStateRef.current.currentFileId;
        if (!current) {
          console.warn('Received binary chunk but no active file transfer. Dropping chunk.');
          return;
        }
        const u8 = new Uint8Array(ev.data);
        if (!receivingStateRef.current.transfers[current]) receivingStateRef.current.transfers[current] = [];
        receivingStateRef.current.transfers[current].push(u8);
      } else if (ev.data instanceof Blob) {
        // handle browsers that deliver Blobs for binary messages
        ev.data.arrayBuffer().then((buf) => {
          const current = receivingStateRef.current.currentFileId;
          if (!current) return;
          const u8 = new Uint8Array(buf);
          if (!receivingStateRef.current.transfers[current]) receivingStateRef.current.transfers[current] = [];
          receivingStateRef.current.transfers[current].push(u8);
        }).catch((err) => console.warn('blob->arrayBuffer err', err));
      }
    };
  }

  // Initiator: start the secure drop flow
  async function initiateDrop(toUserId: string) {
    if (!socketRef.current) throw new Error('Socket not connected');
    sessionIdRef.current = uuidv4();

    // notify recipient to show invite UI
    socketRef.current.emit('secure-drop-request', { toUserId, fromUserId: currentUserId });

    // create peer connection and data channel
    const pc = createPeerConnection(toUserId, true);
    const dc = pc.createDataChannel('secure-drop', { ordered: true });
    setupDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit('secure-offer', { toUserId, sdp: offer, sessionId: sessionIdRef.current });
  }

  // Callee: handle remote offer, create answer
  async function handleRemoteOffer(sdp: any, sessionId: string, fromUserId: string) {
    sessionIdRef.current = sessionId;
    const pc = createPeerConnection(fromUserId, false);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current.emit('secure-answer', { toUserId: fromUserId, sdp: answer, sessionId });
  }

  // Send a text message over the data channel
  function sendText(text: string) {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return;
    const payload = JSON.stringify({ type: 'text', id: uuidv4(), text });
    dcRef.current.send(payload);
    setMessages((prev) => [...prev, { id: Date.now().toString(), text, fromMe: true, time: Date.now() }]);
  }

  // Send file: send meta JSON then chunks as ArrayBuffer
  async function sendFile(file: File) {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      throw new Error('DataChannel not open');
    }

    const fileId = uuidv4();
    currentSendingFileIdRef.current = fileId;
    const meta = { type: 'file-meta', fileId, name: file.name, size: file.size, mime: file.type };
    dcRef.current.send(JSON.stringify(meta));

    const chunkSize = 16 * 1024; // 16 KB
    let offset = 0;

    while (offset < file.size) {
      const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
      const arrBuffer = await slice.arrayBuffer();
      // send ArrayBuffer (binary)
      dcRef.current.send(arrBuffer);
      offset += arrBuffer.byteLength;
      // optional: yield to event loop to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }

    dcRef.current.send(JSON.stringify({ type: 'file-end', fileId, name: file.name, size: file.size, mime: file.type }));
    setMessages((prev) => [...prev, { id: fileId, text: `Sent file: ${file.name}`, fromMe: true, time: Date.now() }]);
    currentSendingFileIdRef.current = null;
  }

  // End session / cleanup
  function cleanupPeer() {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    dcRef.current = null;
    setConnected(false);
    sessionIdRef.current = null;
    // clear any partial transfers
    receivingStateRef.current.transfers = {};
    receivingStateRef.current.currentFileId = undefined;
    currentSendingFileIdRef.current = null;
    setMessages([]);
  }

  function endDrop(toUserId: string) {
    cleanupPeer();
    if (socketRef.current) {
      socketRef.current.emit('secure-drop-end', { toUserId, sessionId: sessionIdRef.current });
    }
  }

  return {
    initiateDrop,
    sendText,
    sendFile,
    endDrop,
    connected,
    messages,
  };
}
