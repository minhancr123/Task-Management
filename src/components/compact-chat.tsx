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
import { Send, MessageCircle } from 'lucide-react'
import { useCallback, useState, memo } from 'react'

interface CompactChatProps {
  roomName: string
  username: string
}

/**
 * Compact chat component for small windows
 * Optimized with memo to prevent unnecessary re-renders
 */
export const CompactChat = memo(({
  roomName,
  username,
}: CompactChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll<HTMLDivElement>();

  const {
    messages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  })

  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return
      scrollToBottom();
      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  return (
    <div className="flex flex-col h-full w-full">
      {/* Connection status */}
      <div className="px-4 py-2 bg-gradient-to-r from-muted/30 to-muted/10 text-xs text-center border-b border-border/30">
        <span className={cn(
          "inline-block w-2 h-2 rounded-full mr-2 transition-colors",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-muted-foreground">
          {isConnected ? "Connected" : "Connecting..."}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-10 z-auto  bg-gradient-to-b from-background/50 to-muted/5"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Start a conversation
            </h3>
            <p className="text-xs text-muted-foreground">
              Send your first message to get started
            </p>
          </div>
        )}
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null
          const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

          return (
            <div
              key={message.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-200"
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

     {/* Input */}
<form
  onSubmit={handleSendMessage}
  className="flex gap-2 border-t border-border/50 p-4 bg-gradient-to-r from-background/80 to-muted/10"
>
  <textarea
    className="text-sm flex-1 border border-muted-foreground/20 focus:border-blue-500 transition-colors rounded-xl p-2 resize-none max-h-32 overflow-y-auto"
    rows={1}
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    placeholder="Type a message..."
    disabled={!isConnected}
    onKeyDown={(e) => {
      // Cho phép Enter để gửi, Shift+Enter để xuống dòng
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage(e as any)
      }
    }}
  />
  
  <Button
    type="submit"
    size="sm"
    disabled={!isConnected || !newMessage.trim()}
    className={cn(
      "h-9 w-9 p-0 rounded-xl transition-all duration-200",
      !isConnected || !newMessage.trim() 
        ? "bg-muted text-muted-foreground" 
        : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg"
    )}
  >
    <Send className="h-4 w-4" />
  </Button>
</form>

    </div>
  )
})
