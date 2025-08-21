import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuth } from './use-auth';

export function usePageRefresh() {
  const pathname = usePathname();
  const { triggerRefresh } = useTaskStore();
  const { user } = useAuth();
  const lastPathname = useRef<string>('');

  useEffect(() => {
    // Only trigger refresh when actually navigating TO home page from another page
    if (pathname === '/' && user?.id && lastPathname.current !== '/' && lastPathname.current !== '') {
      console.log('🏠 Navigation to home detected from', lastPathname.current, 'triggering refresh');
      triggerRefresh();
    }
    lastPathname.current = pathname;
  }, [pathname, user?.id, triggerRefresh]);
}
