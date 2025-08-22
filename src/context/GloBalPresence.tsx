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
      console.log("GlobalPresence: No user ID available");
      return;
    }

    console.log("GlobalPresence: Setting up presence for user:", user.id);

    const channel = supabase.channel("global-presence", {
      config: {
        presence: { key: user.id },
      },
    });

    // Khi có sync -> cập nhật danh sách online
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      console.log("GlobalPresence: Presence state updated:", state);
      const users: PresenceUser[] = Object.values(state)
        .flat()
        .map((item: any) => ({
          id: item.key,
          username: item.username,
        }));
      console.log("GlobalPresence: Online users:", users);
      setOnlineUsers(users);
    });

    // Đăng ký & báo user này đang online
    channel.subscribe(async (status) => {
      console.log("GlobalPresence: Channel status:", status);
      if (status === "SUBSCRIBED") {
        const username = user.user_metadata?.username || user.email || "Anonymous";
        console.log("GlobalPresence: Tracking user:", username);
        await channel.track({
          username: username,
        });
      }
    });

    // cleanup khi unmount
    return () => {
      console.log("GlobalPresence: Unsubscribing channel");
      channel.unsubscribe();
    };
  }, [user?.id]);

  return (
    <PresenceContext.Provider value={onlineUsers}>
      {children}
    </PresenceContext.Provider>
  );
}
