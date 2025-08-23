'use client';

import { useContext } from 'react';
import { SimplePresenceContext } from '@/context/SimplePresence';

export function PresenceDebug() {
  const onlineUsers = useContext(SimplePresenceContext);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-2 rounded text-xs z-50 max-w-xs">
      <div className="font-bold">Presence Debug:</div>
      <div>Context value: {onlineUsers ? 'Available' : 'Null'}</div>
      <div>Users count: {onlineUsers?.length || 0}</div>
      {onlineUsers && onlineUsers.length > 0 && (
        <div className="mt-1">
          <div className="font-semibold">Users:</div>
          {onlineUsers.map(user => (
            <div key={user.id} className="text-green-300">
              • {user.username}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
