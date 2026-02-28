'use client'

import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useChatNotifications } from '@/context/ChatNotificationsContext'

interface UseRealtimeChatProps {
  roomName: string
  username: string
  onIncoming?: (message: ChatMessage) => void
}

export type MessageStatus = 'sending' | 'sent' | 'seen';

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  status?: MessageStatus;
}

const EVENT_MESSAGE = 'message';
const EVENT_TYPING = 'typing';
const EVENT_STATUS = 'message_status';

// Ephemeral in-session storage
const sessionMessages: Record<string, ChatMessage[]> = {}

export function useRealtimeChat({ roomName, username, onIncoming }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => sessionMessages[roomName] || [])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const { increment } = useChatNotifications()

  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE }, (payload: any) => {
        const incoming = payload.payload as ChatMessage
        if (incoming.user.name !== username) {
          setMessages((current) => {
            const next = [...current, { ...incoming, status: 'sent' as MessageStatus }]; // Assume sent if received
            sessionMessages[roomName] = next;

            // Immediately send back "seen" status if window is focused (simplified)
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
              newChannel.send({
                type: 'broadcast',
                event: EVENT_STATUS,
                payload: { id: incoming.id, status: 'seen' }
              });
            }

            return next;
          })
          increment(roomName)
          onIncoming?.(incoming)
        }
      })
      .on('broadcast', { event: EVENT_TYPING }, (payload: any) => {
        const { user, isTyping } = payload.payload;
        if (user !== username) {
          setTypingUsers(prev => {
            const next = new Set(prev);
            if (isTyping) next.add(user);
            else next.delete(user);
            return next;
          });
        }
      })
      .on('broadcast', { event: EVENT_STATUS }, (payload: any) => {
        const { id, status } = payload.payload;
        setMessages(current => current.map(msg =>
          msg.id === id ? { ...msg, status: status as MessageStatus } : msg
        ));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true)
      })

    setChannel(newChannel)
    return () => { supabase.removeChannel(newChannel) }
  }, [roomName, username, increment, onIncoming])

  const sendMessage = useCallback(async (content: string) => {
    if (!channel || !isConnected) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: { name: username },
      createdAt: new Date().toISOString(),
      status: 'sending'
    }

    setMessages((current) => {
      const next = [...current, message]
      sessionMessages[roomName] = next
      return next
    })

    await channel.send({
      type: 'broadcast',
      event: EVENT_MESSAGE,
      payload: message,
    })

    // Update locally to sent
    setMessages(current => current.map(m => m.id === message.id ? { ...m, status: 'sent' } : m));

  }, [channel, isConnected, username, roomName])

  // Broadcast typing status
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!channel || !isConnected) return;
    channel.send({
      type: 'broadcast',
      event: EVENT_TYPING,
      payload: { user: username, isTyping }
    });
  }, [channel, isConnected, username]);

  return { messages, sendMessage, isConnected, typingUsers, sendTyping }
}
