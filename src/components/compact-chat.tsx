'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Send, MessageCircle } from 'lucide-react'
import { useCallback, useState, memo, useEffect, useRef } from 'react'
import { useChatNotifications } from '@/context/ChatNotificationsContext'

interface CompactChatProps {
  roomName: string
  username: string
}

export const CompactChat = memo(({ roomName, username }: CompactChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll<HTMLDivElement>();
  const { reset } = useChatNotifications();
  const {
    messages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
    onIncoming: () => {}
  })

  const [newMessage, setNewMessage] = useState('')
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  // Reset unread when chat window active / new messages viewed
  useEffect(() => {
    reset(roomName)
  }, [messages.length, roomName, reset])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return
      sendMessage(newMessage.trim())
      setNewMessage('')
      scrollToBottom();
      // focus lại
      requestAnimationFrame(() => textAreaRef.current?.focus())
    },
    [newMessage, isConnected, sendMessage, scrollToBottom]
  )

  return (
    <div className="flex flex-col h-full w-full">
      {/* Connection status */}
      <div className="px-4 py-2 bg-gradient-to-r from-muted/30 to-muted/10 text-xs text-center border-b border-border/30">
        <span className={cn(
          'inline-block w-2 h-2 rounded-full mr-2 transition-colors',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        )} />
        <span className="text-muted-foreground">
          {isConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-10 bg-gradient-to-b from-background/50 to-muted/5"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              Start a conversation
            </p>
          </div>
        )}
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null
          const showHeader = !prevMessage || prevMessage.user.name !== message.user.name
          return (
            <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <ChatMessageItem
                message={message}
                isOwnMessage={message.user.name === username}
                showHeader={showHeader}
              />
            </div>
          )
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border/40 p-3 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textAreaRef}
              className="text-xs flex-1 border border-transparent focus:border-blue-500/60 bg-muted/40 dark:bg-muted/30 focus:bg-background/80 transition-colors rounded-lg p-2 resize-none max-h-28 overflow-y-auto leading-relaxed"
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!isConnected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e as any)
                }
              }}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!isConnected || !newMessage.trim()}
            className={cn(
              'h-8 w-8 p-0 rounded-lg flex items-center justify-center',
              !isConnected || !newMessage.trim()
                ? 'bg-muted text-muted-foreground'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow'
            )}
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  )
})
