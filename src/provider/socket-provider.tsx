"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = { socket: Socket | null };
const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ userId, children }: { userId: string; children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId || !process.env.NEXT_PUBLIC_SOCKET_URL) return;

    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      // transports: ["websocket"],
    });

    s.on("connect", () => {
      console.log("Socket connected:", s.id, "for user:", userId);
      s.emit("register", userId);
    });

    s.on("disconnect", () => {
      console.log("Socket disconnected:", s.id);
    });

    setSocket(s);

    return () => {
      s.off("connect");
      s.off("disconnect");
      s.disconnect();
      setSocket(null);
    };
  }, [userId]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  return useContext(SocketContext);
};
