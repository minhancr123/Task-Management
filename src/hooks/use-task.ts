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
    const isFetchingRef = useRef(false); // Prevent concurrent fetches
    const requestIdRef = useRef(0);      // Track latest request để bỏ qua phản hồi cũ

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
            console.log("❌ No user ID, clearing tasks");
            setTasks([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        if (isFetchingRef.current && !forceRefresh) {
            console.log("🔄 Already fetching tasks, skipping...");
            return;
        }

        if (!forceRefresh && isCacheValid(cacheRef.current, user.id)) {
            console.log("📋 Using cached tasks");
            setTasks(cacheRef.current!.data);
            setIsLoading(false);
            return cacheRef.current!.data;
        }

        isFetchingRef.current = true;
        const currentRequestId = ++requestIdRef.current; // gán id mới cho request
        try {
            setIsLoading(true);
            setError(null);
            console.log("🔄 Fetching tasks for user:", user.id, "requestId:", currentRequestId);

            const { data, error: fetchError } = await supabase
                .from("tasks")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            // Nếu có request mới hơn thì bỏ qua phản hồi này
            if (currentRequestId !== requestIdRef.current) {
                console.log("⚠️ Stale response ignored for requestId", currentRequestId);
                return;
            }

            if (fetchError) throw new Error(fetchError.message);

            const tasksData = data || [];
            cacheRef.current = {
                data: tasksData,
                timestamp: Date.now(),
                userId: user.id
            };
            setTasks(tasksData);
            console.log("✅ Tasks loaded:", tasksData.length);
            return tasksData;
        } catch (e: any) {
            if (currentRequestId !== requestIdRef.current) {
                console.log("⚠️ Error from stale request ignored", e?.message);
                return;
            }
            console.error("❌ Error fetching tasks (no abort controller):", e);
            setError(e.message || 'Unknown error');
            if (cacheRef.current && cacheRef.current.userId === user.id) {
                console.log("📋 Using cached tasks as fallback");
                setTasks(cacheRef.current.data);
            } else {
                setTasks([]);
            }
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setIsLoading(false);
                isFetchingRef.current = false;
            }
        }
    }, [user?.id, isCacheValid]);

    const refreshTasks = useCallback(async () => {
        console.log("🔄 Manually refreshing tasks...");
        await fetchAllTasks(true);
        console.log("✅ Manual refresh completed");
    }, [fetchAllTasks]);

    useEffect(() => {
        if (cacheRef.current && cacheRef.current.userId !== user?.id) {
            cacheRef.current = null;
        }
    }, [user?.id]);

    // Initial fetch guard chống StrictMode double-mount
    const didFirstFetchRef = useRef(false);
    useEffect(() => {
        if (!user?.id) {
            setTasks([]);
            setError(null);
            setIsLoading(false);
            cacheRef.current = null;
            didFirstFetchRef.current = false;
            return;
        }
        if (didFirstFetchRef.current) {
            // mount lần 2 của StrictMode -> bỏ qua
            return;
        }
        didFirstFetchRef.current = true;
        console.log("🚀 useTask initial fetch for user", user.id);
        fetchAllTasks();
    }, [user?.id, fetchAllTasks]);

    return {
        tasks: debouncedTasks,
        taskStats,
        refreshTasks,
        isLoading,
        error,
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