import { supabase } from "@/lib/supabase"
import { useAuth } from "./use-auth"
import { useEffect, useState } from "react";
import { TaskFormData } from "@/app/zod/task";
import { Task } from "@/lib/task";

export const useTask = () => {
    const [tasks , setTasks] =useState<TaskFormData[]>([]);
    const {user} = useAuth();
    const fetchAllTasks = async () => {
    
    const {data , error} = await supabase.from("tasks").select("*").eq("user_id" ,user?.id ).order("created_at" ,{ascending : false});
    console.log("Tasks fetched:", data);
    if(error) throw new Error(error.message);
    setTasks(data || [])
    return data;
    }

    useEffect(() => {
        fetchAllTasks();
    }, [user])
    return {tasks};
}