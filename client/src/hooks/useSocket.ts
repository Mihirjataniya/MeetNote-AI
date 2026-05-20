import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/index";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_API_URL || "";

export function useSocket(token: string | null) {
  const socketRef = useRef<TypedSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);

  const getSocket = useCallback((): TypedSocket => {
    if (socketRef.current && tokenRef.current !== token) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!socketRef.current) {
      tokenRef.current = token;
      socketRef.current = io(SERVER_URL, {
        autoConnect: false,
        transports: ["websocket"],
        auth: token ? { token } : undefined,
      }) as TypedSocket;

      socketRef.current.on("connect", () => setConnected(true));
      socketRef.current.on("disconnect", () => setConnected(false));
    }
    return socketRef.current;
  }, [token]);

  const connect = useCallback(() => {
    if (!token) return;
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }, [getSocket, token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    getSocket,
    connected,
    connect,
    disconnect,
  };
}
