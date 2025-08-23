import { supabase } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { TaskFormData } from "@/app/zod/task";
import { useDebounce } from "./use-debounce";

interface TaskCache {
  data: TaskFormData[];
  timestamp: number;
  userId: string;
}

// Cache duration: 2 minutes
const CACHE_DURATION = 2 * 60 * 1000;

export const useTask = () => {
    const [tasks, setTasks] = useState<TaskFormData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const cacheRef = useRef<TaskCache | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Debounce tasks to reduce re-renders
    const debouncedTasks = useDebounce(tasks, 100);

    // Memoized task statistics
    const taskStats = useMemo(() => {
        const total = debouncedTasks.length;
        const completed = debouncedTasks.filter(task => task.status === 'completed').length;
        const inProgress = debouncedTasks.filter(task => task.status === 'in-progress').length;
        const todo = debouncedTasks.filter(task => task.status === 'todo').length;
        
        return { total, completed, inProgress, todo };
    }, [debouncedTasks]);

    // Check if cache is valid
    const isCacheValid = useCallback((cache: TaskCache | null, userId: string): boolean => {
        if (!cache) return false;
        if (cache.userId !== userId) return false;
        if (Date.now() - cache.timestamp > CACHE_DURATION) return false;
        return true;
    }, []);

    const fetchAllTasks = useCallback(async (forceRefresh = false) => {
        if (!user?.id) {
            setTasks([]);
            setError(null);
            return;
        }

        // Check cache first (unless force refresh)
        if (!forceRefresh && isCacheValid(cacheRef.current, user.id)) {
            console.log("📋 Using cached tasks");
            setTasks(cacheRef.current!.data);
            return cacheRef.current!.data;
        }

        // Cancel previous request if ongoing
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
            setIsLoading(true);
            setError(null);
            
            console.log("🔄 Fetching tasks for user:", user.id);
            
            const { data, error: fetchError } = await supabase
                .from("tasks")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .abortSignal(abortControllerRef.current.signal);

            if (fetchError) throw new Error(fetchError.message);

            const tasksData = data || [];
            
            // Update cache
            cacheRef.current = {
                data: tasksData,
                timestamp: Date.now(),
                userId: user.id
            };

            setTasks(tasksData);
            console.log("✅ Tasks loaded:", tasksData.length);
            
            return tasksData;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("🚫 Task fetch aborted");
                return;
            }
            
            console.error("❌ Error fetching tasks:", error);
            setError(error.message);
            
            // If cache exists, use it as fallback
            if (cacheRef.current && cacheRef.current.userId === user.id) {
                console.log("📋 Using cached tasks as fallback");
                setTasks(cacheRef.current.data);
            } else {
                setTasks([]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [user?.id, isCacheValid]);

    const refreshTasks = useCallback(async () => {
        console.log("🔄 Manually refreshing tasks...");
        await fetchAllTasks(true); // Force refresh
        console.log("✅ Manual refresh completed");
    }, [fetchAllTasks]);

    // Clear cache when user changes
    useEffect(() => {
        if (cacheRef.current && cacheRef.current.userId !== user?.id) {
            cacheRef.current = null;
        }
    }, [user?.id]);

    // Initial fetch when user is available
    useEffect(() => {
        if (user?.id) {
            console.log("🚀 useTask: User available, fetching tasks");
            fetchAllTasks();
        } else {
            console.log("❌ useTask: No user, clearing tasks");
            setTasks([]);
            setError(null);
            cacheRef.current = null;
        }

        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [user?.id, fetchAllTasks]);

    // Smart auto-refresh on visibility/focus changes
    // useEffect(() => {
        // let refreshTimeout: NodeJS.Timeout;
        
        // const handleVisibilityChange = () => {
        //     if (!document.hidden && user?.id) {
        //         // Check if cache is stale when page becomes visible
        //         if (!isCacheValid(cacheRef.current, user.id)) {
        //             console.log("👁️ Page visible with stale cache, refreshing tasks");
        //             refreshTimeout = setTimeout(() => fetchAllTasks(true), 500);
        //         }
        //     }
        // };

        // const handleFocus = () => {
        //     if (user?.id && !isCacheValid(cacheRef.current, user.id)) {
        //         console.log("🎯 Window focused with stale cache, refreshing tasks");
        //         refreshTimeout = setTimeout(() => fetchAllTasks(true), 500);
        //     }
        // };

        // document.addEventListener('visibilitychange', handleVisibilityChange);
        // window.addEventListener('focus', handleFocus);

        // return () => {
        //     clearTimeout(refreshTimeout);
        //     // document.removeEventListener('visibilitychange', handleVisibilityChange);
        //     window.removeEventListener('focus', handleFocus);
        // };
    // }, [user?.id, fetchAllTasks, isCacheValid]);
    
    return {
        tasks: debouncedTasks,
        taskStats,
        refreshTasks,
        isLoading,
        error,
        // Utility functions
        addOptimisticTask: useCallback((task: TaskFormData) => {
            setTasks(prev => [task, ...prev]);
        }, []),
        removeOptimisticTask: useCallback((taskId: string) => {
            setTasks(prev => prev.filter(t => t.id !== taskId));
        }, []),
        updateOptimisticTask: useCallback((taskId: string, updates: Partial<TaskFormData>) => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        }, [])
    };
}