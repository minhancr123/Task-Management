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

  // Tab visibility management
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);
      
      // Disconnect when tab becomes hidden to save resources
      if (!isVisible && channelRef.current) {
        console.log('Tab hidden, disconnecting presence');
        channelRef.current.unsubscribe();
        channelRef.current = null;
        setIsConnected(false);
      } else if (isVisible && user?.id && !channelRef.current) {
        // Reconnect when tab becomes active again
        console.log('Tab visible, reconnecting presence');
        connectToPresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle page unload
    const handleBeforeUnload = () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  // Debounced update function with error handling
  const debouncedSetUsers = useCallback((users: PresenceUser[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setOnlineUsers(prev => {
        // Only update if users actually changed
        if (JSON.stringify(prev) !== JSON.stringify(users)) {
          return users;
        }
        return prev;
      });
    }, 200); // Increased debounce time
  }, []);

  // Connection function with retry logic
  const connectToPresence = useCallback(async () => {
    if (!user?.id || !isTabActive) return;

    try {
      // Cleanup previous channel if exists
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      const channel = supabase.channel(`global-presence-${user.id}-${Date.now()}`, {
        config: {
          presence: { key: user.id },
          broadcast: { self: false },
          private: false
        },
      });

      channelRef.current = channel;

      // Presence sync handler with error handling
      const handlePresenceSync = () => {
        try {
          if (!isTabActive) return; // Skip if tab is not active
          
          const state = channel.presenceState();
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
          debouncedSetUsers(users);
          retryCountRef.current = 0; // Reset retry count on success
        } catch (error) {
          console.error('Error processing presence state:', error);
        }
      };

      // Setup event listeners
      channel.on("presence", { event: "sync" }, handlePresenceSync);
      channel.on("presence", { event: "join" }, handlePresenceSync);
      channel.on("presence", { event: "leave" }, handlePresenceSync);

      // Subscribe to channel with retry logic
      channel.subscribe(async (status) => {
        console.log('Presence channel status:', status);
        
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          const username = user.user_metadata?.username || user.email || "Anonymous";
          
          try {
            await channel.track({
              username: username,
              user_id: user.id,
              timestamp: Date.now()
            });
          } catch (error) {
            console.error('Error tracking presence:', error);
          }
        } else if (status === "CHANNEL_ERROR" && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying connection... Attempt ${retryCountRef.current}`);
          
          // Retry with exponential backoff
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isTabActive) {
              connectToPresence();
            }
          }, Math.pow(2, retryCountRef.current) * 1000);
        } else {
          setIsConnected(false);
        }
      });

    } catch (error) {
      console.error('Error setting up presence channel:', error);
      setIsConnected(false);
    }
  }, [user?.id, isTabActive, debouncedSetUsers]);

  useEffect(() => {
    if (!user?.id) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    // Only connect if tab is active
    if (isTabActive) {
      connectToPresence();
    }

    // Cleanup function
    return () => {
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
  }, [connectToPresence]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => onlineUsers, [onlineUsers]);

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
}
