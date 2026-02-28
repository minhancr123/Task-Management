'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

/**
 * Realtime chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  // hook xử lý chat realtime
  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    typingUsers,
    sendTyping
  } = useRealtimeChat({
    roomName,
    username,
  })

  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // merge messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    )
    return uniqueMessages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    )
  }, [initialMessages, realtimeMessages])

  // presence handling
  useEffect(() => {
    const channel = supabase.channel(roomName, {
      config: {
        presence: { key: username },
      },
    })

    // lắng nghe state thay đổi
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.keys(state)
      setOnlineUsers(users)
    })

    // subscribe và track user hiện tại
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ username }) // báo online
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [roomName, username])

  // callback nếu có onMessage prop
  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  // scroll mỗi khi có message mới
  useEffect(() => {
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      setNewMessage('')
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(false);
    },
    [newMessage, isConnected, sendMessage, sendTyping]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!typingTimeoutRef.current) {
      sendTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {allMessages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        )}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage =
              index > 0 ? allMessages[index - 1] : null
            const showHeader =
              !prevMessage ||
              prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic animate-pulse">
          {Array.from(typingUsers).join(', ')} is typing...
        </div>
      )}

      {/* Online users */}
      {onlineUsers.length > 0 && (
        <div className="p-4 bg-muted text-muted-foreground text-sm">
          <strong>Online Users:</strong> {onlineUsers.join(', ')}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="flex w-full gap-2 border-t border-border p-4"
      >
        <Input
          className={cn(
            'rounded-full bg-background text-sm transition-all duration-300',
            isConnected && newMessage.trim()
              ? 'w-[calc(100%-36px)]'
              : 'w-full'
          )}
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
