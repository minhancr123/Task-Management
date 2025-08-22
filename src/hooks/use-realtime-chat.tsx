'use client'

import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useState } from 'react'

interface UseRealtimeChatProps {
  roomName: string
  username: string
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

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    console.log("useRealtimeChat: Setting up channel for room:", roomName);
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload: any) => {
        console.log("useRealtimeChat: Received message:", payload.payload);
        setMessages((current) => [...current, payload.payload as ChatMessage])
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
  }, [roomName, username])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) {
        console.log("useRealtimeChat: Cannot send message - channel:", !!channel, "connected:", isConnected);
        return;
      }

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
        },
        createdAt: new Date().toISOString(),
      }

      console.log("useRealtimeChat: Sending message:", message);

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username]
  )

  return { messages, sendMessage, isConnected }
}
