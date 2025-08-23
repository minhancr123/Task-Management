// context/GlobalPresence.tsx
'use client';

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { createContext, useEffect, useState, useCallback, useMemo, useRef } from "react";

export type PresenceUser = {
  id: string;
  username: string;
};

// tạo context
export const PresenceContext = createContext<PresenceUser[] | undefined>(undefined);

export default function GlobalPresence({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const channelRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryCountRef = useRef(0);

  // Tab visibility management - simplified
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);
      
      if (!isVisible) {
        console.log('Tab hidden, pausing presence updates');
      } else {
        console.log('Tab visible, resuming presence updates');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Simplified debounced update function
  const debouncedSetUsers = useCallback((users: PresenceUser[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      console.log('Setting online users:', users);
      setOnlineUsers(users);
    }, 100);
  }, []);

  // Connection function with simplified logic
  const connectToPresence = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID, skipping presence connection');
      return;
    }

    try {
      // Cleanup previous channel if exists
      if (channelRef.current) {
        console.log('Cleaning up previous channel');
        channelRef.current.unsubscribe();
      }

      console.log('Creating new presence channel for user:', user.id);
      const channel = supabase.channel(`global-presence`, {
        config: {
          presence: { key: user.id },
          broadcast: { self: false }
        },
      });

      channelRef.current = channel;

      // Simplified presence sync handler
      const handlePresenceSync = () => {
        try {          
          const state = channel.presenceState();
          console.log('Presence state updated:', state);
          
          const uniqueUsers = new Map<string, PresenceUser>();
          
          Object.keys(state).forEach((key) => {
            const presences = state[key];
            if (presences && presences.length > 0) {
              const presence = presences[0] as any;
              const userId = presence.user_id || key;
              
              if (userId && presence.username) {
                uniqueUsers.set(userId, {
                  id: userId,
                  username: presence.username,
                });
              }
            }
          });
          
          const users = Array.from(uniqueUsers.values());
          console.log('Online users:', users);
          debouncedSetUsers(users);
        } catch (error) {
          console.error('Error processing presence state:', error);
        }
      };

      // Setup event listeners
      channel.on("presence", { event: "sync" }, handlePresenceSync);
      channel.on("presence", { event: "join" }, handlePresenceSync);
      channel.on("presence", { event: "leave" }, handlePresenceSync);

      // Subscribe to channel
      channel.subscribe(async (status) => {
        console.log('Presence channel status:', status);
        
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          const username = user.user_metadata?.username || user.email || "Anonymous";
          
          console.log('Tracking presence for:', username);
          try {
            await channel.track({
              username: username,
              user_id: user.id,
              timestamp: Date.now()
            });
          } catch (error) {
            console.error('Error tracking presence:', error);
          }
        } else {
          setIsConnected(false);
        }
      });

    } catch (error) {
      console.error('Error setting up presence channel:', error);
      setIsConnected(false);
    }
  }, [user?.id, debouncedSetUsers]);

  useEffect(() => {
    if (!user?.id) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    // Always try to connect when user is available, regardless of tab state
    console.log('Connecting to presence for user:', user.id);
    connectToPresence();

    // Cleanup function
    return () => {
      console.log('Cleaning up presence connection');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id]); // Remove other dependencies that cause unnecessary reconnections

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => onlineUsers, [onlineUsers]);

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
}
