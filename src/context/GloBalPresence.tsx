// context/GlobalPresence.tsx
'use client';

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { createContext, useEffect, useState } from "react";

export type PresenceUser = {
  id: string;
  username: string;
};

// tạo context
export const PresenceContext = createContext<PresenceUser[] | undefined>(undefined);

export default function GlobalPresence({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const channel = supabase.channel("global-presence", {
      config: {
        presence: { key: user.id },
      },
    });

    // Khi có sync -> cập nhật danh sách online
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      
      // Tạo Set để tránh duplicate users
      const uniqueUsers = new Map<string, PresenceUser>();
      
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (presences && presences.length > 0) {
          const presence = presences[0] as any;
          
          // Sử dụng user_id từ presence data thay vì key
          const userId = presence.user_id || key;
          uniqueUsers.set(userId, {
            id: userId,
            username: presence.username,
          });
        }
      });
      
      const users = Array.from(uniqueUsers.values());
      setOnlineUsers(users);
    });

    // Đăng ký & báo user này đang online
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const username = user.user_metadata?.username || user.email || "Anonymous";
        await channel.track({
          username: username,
          user_id: user.id,
        });
      }
    });

    // cleanup khi unmount
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  return (
    <PresenceContext.Provider value={onlineUsers}>
      {children}
    </PresenceContext.Provider>
  );
}
