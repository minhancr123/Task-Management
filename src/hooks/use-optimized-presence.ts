// hooks/use-optimized-presence.ts
'use client'

import { useContext, useMemo } from 'react'
import { PresenceContext, PresenceUser } from '@/context/GloBalPresence'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'

export function useOptimizedPresence() {
  const onlineUsers = useContext(PresenceContext) || []
  const { user } = useAuth()
  
  // Debounce online users to reduce re-renders
  const debouncedUsers = useDebounce(onlineUsers, 200)
  
  // Memoize filtered users
  const filteredUsers = useMemo(() => {
    return debouncedUsers.filter(u => u.id !== user?.id)
  }, [debouncedUsers, user?.id])
  
  const currentUser = useMemo(() => {
    return debouncedUsers.find(u => u.id === user?.id)
  }, [debouncedUsers, user?.id])
  
  return {
    allUsers: debouncedUsers,
    filteredUsers,
    currentUser,
    isOnline: !!currentUser,
    totalOnline: debouncedUsers.length
  }
}
