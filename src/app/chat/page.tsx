'use client'

import { useState } from 'react'
import { RealtimeChat } from '@/components/realtime-chat'

export default function ChatPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [input, setInput] = useState("")

  
  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your username..."
          className="border p-2 rounded"
        />
        <button
          onClick={() => setUsername(input)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Join Chat
        </button>
      </div>
    )
  }

  return <RealtimeChat roomName="my-chat-room" username={username} />
}
