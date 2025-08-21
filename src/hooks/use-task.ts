import { supabase } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import { useEffect, useState, useCallback } from "react";
import { TaskFormData } from "@/app/zod/task";

export const useTask = () => {
    const [tasks , setTasks] =useState<TaskFormData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const {user} = useAuth();
    
    const fetchAllTasks = useCallback(async () => {
        // Don't fetch if user is not available
        if (!user?.id) {
            console.log("User not available, skipping task fetch");
            setTasks([]);
            return;
        }
    
        try {
            setIsLoading(true);
            console.log("🔄 Fetching tasks for user:", user.id);
            const {data , error} = await supabase.from("tasks").select("*").eq("user_id" ,user.id ).order("created_at" ,{ascending : false});
            console.log("📋 Tasks fetched from DB:", data?.length, "tasks");
            if(error) throw new Error(error.message);
            setTasks(data || [])
            console.log("📋 Tasks state updated with", data?.length || 0, "tasks");
            return data;
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setTasks([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const refreshTasks = useCallback(async () => {
        console.log("🔄 Manually refreshing tasks...");
        await fetchAllTasks();
        console.log("✅ Manual refresh completed");
    }, [fetchAllTasks]);

    // Initial fetch when user is available
    useEffect(() => {
        if (user?.id) {
            console.log("🚀 useTask: User available, fetching tasks");
            fetchAllTasks();
        } else {
            console.log("❌ useTask: No user, clearing tasks");
            setTasks([]);
        }
    }, [user?.id, fetchAllTasks]);

    // Optional: Auto-refresh on visibility/focus changes (currently disabled to avoid spam)
    // Uncomment if you want auto-refresh when switching back to tab after long periods
    /*
    useEffect(() => {
        let refreshTimeout: NodeJS.Timeout;
        let lastVisibilityTime = 0;
        
        const handleVisibilityChange = () => {
            if (!document.hidden && user?.id) {
                const now = Date.now();
                // Only refresh if page was hidden for more than 5 minutes
                if (now - lastVisibilityTime > 5 * 60 * 1000) { // 5 minutes
                    clearTimeout(refreshTimeout);
                    refreshTimeout = setTimeout(() => {
                        console.log("👁️ useTask: Page visible after long absence, refreshing tasks");
                        fetchAllTasks();
                    }, 1000);
                } else {
                    console.log("👁️ useTask: Page visible but recently active, skipping refresh");
                }
            } else {
                // Record when page becomes hidden
                lastVisibilityTime = Date.now();
            }
        };

        const handleFocus = () => {
            if (user?.id) {
                const now = Date.now();
                // Only refresh if window was unfocused for more than 5 minutes
                if (now - lastVisibilityTime > 5 * 60 * 1000) { // 5 minutes
                    clearTimeout(refreshTimeout);
                    refreshTimeout = setTimeout(() => {
                        console.log("🎯 useTask: Window focused after long absence, refreshing tasks");
                        fetchAllTasks();
                    }, 1000);
                } else {
                    console.log("🎯 useTask: Window focused but recently active, skipping refresh");
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearTimeout(refreshTimeout);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user?.id, fetchAllTasks]);
    */
    
    return {tasks, refreshTasks, isLoading};
}