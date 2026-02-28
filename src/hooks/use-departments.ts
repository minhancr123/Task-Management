
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Department, DepartmentMember } from "@/lib/types/database";

export interface DeptWithMembers extends Department {
    members?: DepartmentMember[];
    _memberCount?: number;
}

export const useDepartments = () => {
    return useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("departments")
                .select("*")
                .order("name");

            if (error) throw error;

            const depts = (data || []) as DeptWithMembers[];

            // Fetch member counts in parallel
            await Promise.all(
                depts.map(async (dept) => {
                    const { count } = await supabase
                        .from("department_members")
                        .select("*", { count: "exact", head: true })
                        .eq("department_id", dept.id);
                    dept._memberCount = count || 0;
                })
            );

            return depts;
        },
        staleTime: 60 * 1000,
    });
};

export const useDepartmentMembers = (deptId: string | undefined) => {
    return useQuery({
        queryKey: ["department_members", deptId],
        queryFn: async () => {
            if (!deptId) return [];
            const { data, error } = await supabase
                .from("department_members")
                .select("*, user:profiles(*)")
                .eq("department_id", deptId);
            if (error) throw error;
            return (data || []) as DepartmentMember[];
        },
        enabled: !!deptId,
        staleTime: 60 * 1000,
    });
};
