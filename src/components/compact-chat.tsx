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
import { useCallback, useState } from 'react'

interface CompactChatProps {
  roomName: string
  username: string
}

/**
 * Compact chat component for small windows
 */
export const CompactChat = ({
  roomName,
  username,
}: CompactChatProps) => {
  const { containerRef } = useChatScroll()

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

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  return (
    <div className="flex flex-col h-full w-full">
      {/* Connection status */}
      <div className="px-3 py-2 bg-gradient-to-r from-muted/50 to-muted/30 text-xs text-center border-b border-border/50">
        <span className={cn(
          "inline-block w-2 h-2 rounded-full mr-2 transition-colors",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        {isConnected ? "Connected" : "Connecting..."}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-gradient-to-b from-background to-muted/10"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-3">
              <Send className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Start chatting!</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Send your first message</p>
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
        className="flex gap-2 border-t border-border p-3 bg-gradient-to-r from-background to-muted/10"
      >
        <Input
          className="text-sm flex-1 border-muted-foreground/20 focus:border-blue-500 transition-colors"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!isConnected || !newMessage.trim()}
          className={cn(
            "px-3 transition-all duration-200",
            !isConnected || !newMessage.trim() 
              ? "bg-muted text-muted-foreground" 
              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-105"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
