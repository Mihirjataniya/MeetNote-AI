import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "../hooks/useSocket";
import type { TypedSocket } from "../hooks/useSocket";

interface SocketContextValue {
  socket: TypedSocket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { getSocket, connected, connect, disconnect } = useSocket(token);

  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [token, connect, disconnect]);

  const socket: TypedSocket | null = useMemo(
    () => (connected ? getSocket() : null),
    [connected, getSocket]
  );

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
