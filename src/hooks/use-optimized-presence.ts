// hooks/use-optimized-presence.ts
'use client'

import { useContext, useMemo } from 'react'
import { SimplePresenceContext, SimplePresenceUser } from '@/context/SimplePresence'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'

export type PresenceUser = SimplePresenceUser

export function useOptimizedPresence() {
  const onlineUsers = useContext(SimplePresenceContext) || []
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
