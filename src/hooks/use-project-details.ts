
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Project, Task, Profile, Milestone } from "@/lib/types/database";

type ProjectWithDetails = Project & {
    members: { user: Profile; role: string }[];
    tasks: Task[];
    milestones: Milestone[];
};

export const useProjectDetails = (id: string) => {
    return useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            // Fetch project basics
            const { data: project, error: pError } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();
            if (pError) throw pError;

            // Fetch members
            const { data: members, error: mError } = await supabase
                .from("project_members")
                .select("role, user:profiles(*)")
                .eq("project_id", id);
            if (mError) throw mError;

            // Fetch tasks
            const { data: tasks, error: tError } = await supabase
                .from("tasks")
                .select("*, assignee:profiles!tasks_assigned_to_fkey(*)")
                .eq("project_id", id)
                .order("created_at", { ascending: false });
            if (tError) throw tError;

            // Fetch milestones
            const { data: milestones, error: msError } = await supabase
                .from("milestones")
                .select("*")
                .eq("project_id", id)
                .order("due_date", { ascending: true });
            if (msError) throw msError;

            return {
                ...project,
                members: members || [],
                tasks: tasks || [],
                milestones: milestones || [],
            } as ProjectWithDetails;
        },
        enabled: !!id,
        staleTime: 60 * 1000,
    });
};
