'use client'

import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useState } from 'react'
import { useChatNotifications } from '@/context/ChatNotificationsContext'

interface UseRealtimeChatProps {
  roomName: string
  username: string
  onIncoming?: (message: ChatMessage) => void // notify parent for unread if window hidden
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = 'message'

// Ephemeral in-session storage (reset on reload)
const sessionMessages: Record<string, ChatMessage[]> = {}

export function useRealtimeChat({ roomName, username, onIncoming }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => sessionMessages[roomName] || [])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { increment } = useChatNotifications()

  useEffect(() => {
    console.log("useRealtimeChat: Setting up channel for room:", roomName);
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload: any) => {
        const incoming = payload.payload as ChatMessage
        console.log("useRealtimeChat: Received message:", incoming);
        setMessages((current) => {
          const next = [...current, incoming]
          sessionMessages[roomName] = next
          return next
        })
        if (incoming.user.name !== username) {
          increment(roomName)
          onIncoming?.(incoming)
        }
      })
      .subscribe(async (status: string) => {
        console.log("useRealtimeChat: Channel status:", status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          console.log("useRealtimeChat: Connected to room:", roomName);
        }
      })

    setChannel(newChannel)

    return () => {
      console.log("useRealtimeChat: Cleaning up channel for room:", roomName);
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, increment, onIncoming])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) {
        console.log("useRealtimeChat: Cannot send message - channel:", !!channel, "connected:", isConnected);
        return;
      }

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: { name: username },
        createdAt: new Date().toISOString(),
      }

      console.log("useRealtimeChat: Sending message:", message);

      setMessages((current) => {
        const next = [...current, message]
        sessionMessages[roomName] = next
        return next
      })

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username, roomName]
  )

  return { messages, sendMessage, isConnected }
}
