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
      {/* Fixed position button ở góc dưới phải */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            console.log('Button clicked, toggling user list visibility');
            setShowUsersList(!showUsersList);}}
          className={cn(
            "h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
            "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            showUsersList && "scale-110 shadow-xl"
          )}
          size="lg"
        >
          <div className="relative">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
            {filteredUsers.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
              >
                {filteredUsers.length}
              </Badge>
            )}
          </div>
        </Button>

        {/* Popup hiển thị danh sách users */}
        {showUsersList && (
          <Card 
            ref={popupRef}
            className={cn(
              "absolute bottom-16 right-0 w-72 md:w-80 max-h-80 md:max-h-96 overflow-hidden shadow-2xl border-0",
              "bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl",
              "animate-in fade-in slide-in-from-bottom-4 duration-300"
            )}
          >
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-900 dark:text-gray-100">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                Online Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="p-4 md:p-6 text-center">
                  <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
                    No other users online
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1">
                    You'll see users here when they're active
                  </p>
                </div>
              ) : (
                <div className="max-h-64 md:max-h-80 overflow-y-auto">
                  {filteredUsers.map((presenceUser, index) => (
                    <div
                      key={presenceUser.id}
                      className={cn(
                        "flex items-center gap-3 p-3 md:p-4 transition-all duration-200",
                        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50",
                        "dark:hover:from-blue-950/50 dark:hover:to-purple-950/50",
                        "border-b border-gray-100 dark:border-slate-700 last:border-b-0",
                        "animate-in fade-in slide-in-from-left-4 duration-300"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-green-200 dark:ring-green-800">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                          {presenceUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                          {presenceUser.username}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-xs md:text-sm text-green-600 dark:text-green-400 font-medium">
                            Online
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => startChat(presenceUser)}
                        className={cn(
                          "bg-gradient-to-r from-blue-500 to-purple-500",
                          "hover:from-blue-600 hover:to-purple-600",
                          "text-white shadow-md hover:shadow-lg",
                          "transition-all duration-200 hover:scale-105",
                          "h-8 w-8 md:h-9 md:w-9 p-0"
                        )}
                      >
                        <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat windows */}
      <div className="fixed bottom-6 right-20 z-40 flex flex-row-reverse gap-2 md:gap-4">
        {activeChatSessions.map((session, index) => (
          <div
            key={session.roomName}
            className={cn(
              "w-72 h-80 md:w-80 md:h-96 animate-in fade-in slide-in-from-bottom-4 duration-300",
              "transform transition-all duration-300"
            )}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <Card className="h-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border-0 flex flex-col overflow-hidden">
              <CardHeader className="pb-2 md:pb-3 flex-shrink-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 md:h-8 md:w-8 ring-2 ring-green-200 dark:ring-green-800">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-xs md:text-sm font-semibold">
                        {session.targetUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xs md:text-sm text-gray-900 dark:text-gray-100">
                        {session.targetUser.username}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Online</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => closeChatSession(session.roomName)}
                    className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3 md:h-4 md:w-4 text-gray-500 hover:text-red-500" />
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
