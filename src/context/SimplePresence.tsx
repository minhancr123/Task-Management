// Simple backup presence without complex logic
'use client';

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { createContext, useEffect, useState, useRef } from "react";

export type SimplePresenceUser = {
  id: string;
  username: string;
};

export const SimplePresenceContext = createContext<SimplePresenceUser[]>([]);

// Global map to prevent multiple tabs from creating redundant heavy logic
let hasActivePresence = false;

export default function SimplePresence({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<SimplePresenceUser[]>([]);
  const channelRef = useRef<any>(null);
  // Avoid touching document during SSR
  const visibilityRef = useRef<'visible' | 'hidden'>('visible');

  useEffect(() => {
    // Safe initialize on client only
    if (typeof document !== 'undefined') {
      visibilityRef.current = document.visibilityState === 'hidden' ? 'hidden' : 'visible';
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setOnlineUsers([]);
      return;
    }

    // Avoid duplicate presence connection in same tab lifecycle
    if (channelRef.current) return;

    console.log('[Presence] setup for user:', user.id);

    const channel = supabase.channel('simple-presence', {
      config: { presence: { key: user.id } }
    });
    channelRef.current = channel;

    const handlePresenceSync = () => {
      const state = channel.presenceState();
      const users: SimplePresenceUser[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (presences && presences.length > 0) {
          const presence = presences[0] as any;
          if (presence.username && presence.user_id) {
            users.push({ id: presence.user_id, username: presence.username });
          }
        }
      });
      setOnlineUsers(users);
    };

    channel.on('presence', { event: 'sync' }, handlePresenceSync);
    channel.on('presence', { event: 'join' }, handlePresenceSync);
    channel.on('presence', { event: 'leave' }, handlePresenceSync);

    const trackSelf = async () => {
      const username = user.user_metadata?.username || user.email || 'Anonymous';
      try {
        await channel.track({ username, user_id: user.id });
        hasActivePresence = true;
      } catch (e) {
        console.warn('[Presence] track error', e);
      }
    };

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        trackSelf();
      }
    });

    const handleVisibility = () => {
      if (typeof document === 'undefined') return;
      const state = document.visibilityState as 'visible' | 'hidden';
      visibilityRef.current = state;
      if (state === 'visible' && channelRef.current) {
        // Re-track to refresh metadata
        trackSelf();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
        hasActivePresence = false;
      }
    };
  }, [user?.id]);

  return (
    <SimplePresenceContext.Provider value={onlineUsers}>
      {children}
    </SimplePresenceContext.Provider>
  );
}
