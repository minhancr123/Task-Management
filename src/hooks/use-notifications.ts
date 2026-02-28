
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Notification } from "@/lib/types/database";
import { useAuth } from "@/hooks/use-auth";

export const useNotifications = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["notifications", "list", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as Notification[];
        },
        enabled: !!user,
        staleTime: 30 * 1000,
    });
};
