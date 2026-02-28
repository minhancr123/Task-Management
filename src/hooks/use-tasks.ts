
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Task } from "@/lib/types/database";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

export const useTasks = (statusFilter: string = "all") => {
    const { user } = useAuth();
    const { isManager } = usePermissions();

    return useQuery({
        queryKey: ["tasks", user?.id, isManager, statusFilter],
        queryFn: async () => {
            if (!user) return [];

            let query = supabase
                .from("tasks")
                .select("*, assignee:profiles!tasks_assigned_to_fkey(*)")
                .order("created_at", { ascending: false });

            if (!isManager) {
                query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
            }

            if (statusFilter !== "all") {
                if (statusFilter === "in_progress") {
                    query = query.in("status", ["in_progress", "in-progress"]);
                } else {
                    query = query.eq("status", statusFilter);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as Task[];
        },
        enabled: !!user,
        staleTime: 60 * 1000, // 1 minute cache
    });
};
