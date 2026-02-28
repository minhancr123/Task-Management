
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Project } from "@/lib/types/database";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

export const useProjects = (statusFilter: string = "all") => {
    const { user } = useAuth();
    const { isManager } = usePermissions();

    return useQuery({
        queryKey: ["projects", user?.id, isManager, statusFilter],
        queryFn: async () => {
            if (!user) return [];

            let query = supabase
                .from("projects")
                .select("*, members:project_members(*)")
                .order("created_at", { ascending: false });

            if (!isManager) {
                query = query.eq("members.user_id", user.id);
            }

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Client-side filtering for members if needed, though RLS/query handles most
            return (data || []) as Project[];
        },
        enabled: !!user,
        staleTime: 60 * 1000,
    });
};
