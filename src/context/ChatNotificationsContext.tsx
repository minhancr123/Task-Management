"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ChatNotificationsValue {
  unread: Record<string, number>; // roomName -> count
  increment: (room: string) => void;
  reset: (room: string) => void;
  totalUnread: number;
}

const ChatNotificationsContext = createContext<ChatNotificationsValue | null>(null);

export const ChatNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [unread, setUnread] = useState<Record<string, number>>({});

  const increment = useCallback((room: string) => {
    setUnread(prev => ({ ...prev, [room]: (prev[room] || 0) + 1 }));
  }, []);

  const reset = useCallback((room: string) => {
    setUnread(prev => {
      if (!prev[room]) return prev;
      const clone = { ...prev };
      delete clone[room];
      return clone;
    });
  }, []);

  const totalUnread = useMemo(() => Object.values(unread).reduce((a,b)=>a+b,0), [unread]);

  const value = useMemo(() => ({ unread, increment, reset, totalUnread }), [unread, increment, reset, totalUnread]);

  return <ChatNotificationsContext.Provider value={value}>{children}</ChatNotificationsContext.Provider>;
};

export function useChatNotifications() {
  const ctx = useContext(ChatNotificationsContext);
  if (!ctx) throw new Error("useChatNotifications must be used within ChatNotificationsProvider");
  return ctx;
}
