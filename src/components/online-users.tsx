    'use client'

import { useState, useContext, useRef, useEffect } from 'react'
import { PresenceContext, PresenceUser } from '@/context/GloBalPresence'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Users, X } from 'lucide-react'
import { CompactChat } from '@/components/compact-chat'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface ChatSession {
  targetUser: PresenceUser
  roomName: string
}

export default function OnlineUsers() {
  const onlineUsers = useContext(PresenceContext) || []
  const { user } = useAuth()
  const [showUsersList, setShowUsersList] = useState(false)
  const [activeChatSessions, setActiveChatSessions] = useState<ChatSession[]>([])
  const popupRef = useRef<HTMLDivElement>(null)

  // Lọc bỏ user hiện tại khỏi danh sách
  const filteredUsers = onlineUsers.filter(u => u.id !== user?.id)

  // Đóng popup khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowUsersList(false)
      }
    }

    if (showUsersList) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUsersList])

  const startChat = (targetUser: PresenceUser) => {
    // Tạo room name duy nhất cho 2 user (sắp xếp theo ID để đảm bảo consistency)
    const sortedIds = [user?.id, targetUser.id].sort()
    const roomName = `chat-${sortedIds.join('-')}`

    // Kiểm tra xem đã có chat session này chưa
    const existingSession = activeChatSessions.find(
      session => session.roomName === roomName
    )

    if (!existingSession) {
      setActiveChatSessions(prev => [
        ...prev,
        { targetUser, roomName }
      ])
    }

    setShowUsersList(false)
  }

  const closeChatSession = (roomName: string) => {
    setActiveChatSessions(prev => 
      prev.filter(session => session.roomName !== roomName)
    )
  }

  const getCurrentUsername = () => {
    return user?.user_metadata?.username || user?.email || 'Anonymous'
  }

  return (
    <>
      {/* Debug info - tạm thời */}
      <div className="fixed top-4 left-4 z-[102] bg-black/80 text-white p-2 text-xs rounded">
        Show: {showUsersList.toString()} | Users: {filteredUsers.length}
      </div>
      
      {/* Fixed position button ở góc dưới phải */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <Button
          onClick={() => {
            console.log('Button clicked, current state:', showUsersList);
            setShowUsersList(!showUsersList);
          }}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
            "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            showUsersList && "scale-110 shadow-xl"
          )}
          size="lg"
        >
          <div className="relative">
            <Users className="h-6 w-6 text-white" />
            {filteredUsers.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
              >
                {filteredUsers.length}
              </Badge>
            )}
          </div>
        </Button>

        {/* Popup hiển thị danh sách users */}
        {showUsersList && (
          <div className="absolute bottom-16 right-0 z-[101]">
            <Card 
              ref={popupRef}
              className={cn(
                "w-80 max-h-96 overflow-hidden",
                "bg-white dark:bg-slate-800 backdrop-blur-xl",
                "border border-gray-200 dark:border-gray-700",
                "shadow-2xl rounded-2xl",
                "animate-in fade-in slide-in-from-bottom-4 duration-300"
              )}
            >
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center gap-3 text-lg text-gray-900 dark:text-gray-100">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span>Online Users</span>
                <Badge variant="secondary" className="ml-auto">
                  {filteredUsers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No other users online
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You'll see other users here when they're active
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {filteredUsers.map((presenceUser, index) => (
                    <div
                      key={presenceUser.id}
                      className={cn(
                        "flex items-center gap-3 p-4 transition-all duration-200",
                        "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50",
                        "dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
                        "border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0",
                        "group"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-green-200 dark:ring-green-800 transition-all duration-200 group-hover:ring-green-300 dark:group-hover:ring-green-700">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {presenceUser.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {presenceUser.username}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Active now
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => startChat(presenceUser)}
                        className={cn(
                          "h-8 w-8 p-0 rounded-full",
                          "bg-gradient-to-r from-blue-500 to-purple-600",
                          "hover:from-blue-600 hover:to-purple-700",
                          "text-white shadow-md hover:shadow-lg",
                          "transition-all duration-200 hover:scale-110",
                          "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Chat windows */}
      <div className="fixed bottom-6 right-20 z-40 flex flex-row-reverse gap-4">
        {activeChatSessions.map((session, index) => (
          <div
            key={session.roomName}
            className="w-80 h-96 animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="h-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
              <CardHeader className="pb-3 flex-shrink-0 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8 ring-2 ring-green-200 dark:ring-green-800">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-sm font-semibold">
                          {session.targetUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                    </div>
                    <div>
                      <CardTitle className="text-sm text-gray-900 dark:text-gray-100">
                        {session.targetUser.username}
                      </CardTitle>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Active now</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => closeChatSession(session.roomName)}
                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-red-500 transition-colors" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <CompactChat
                  roomName={session.roomName}
                  username={getCurrentUsername()}
                />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </>
  )
}
