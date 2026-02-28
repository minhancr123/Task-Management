import { supabase } from "./supabase"
import { TaskFormData } from "@/app/zod/task";
export interface Task {
  id: string
  title: string
  description: string | null
  due_date: string
  category: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "in_progress" | "completed" | "in_review" | "cancelled"
  created_at: string
  updated_at: string
}

export const CatergoryMock = [
  {
    id: "1",
    name: "Work",
  },
  {
    id: "2",
    name: "Personal",
  },
  {
    id: "3",
    name: "Shopping",
  },
  {
    id: "4",
    name: "Health",
  },
  {
    id: "5",
    name: "Other",
  }

]
export const createTask = async (data: TaskFormData, user_id: string) => {
  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert([{ ...data, user_id }])
    .select();

  if (error) throw new Error(error.message);
  return inserted;

};

export const editTask = async (taskId: string, updates: Partial<TaskFormData>): Promise<Task | string> => {
  try {
    console.log("Starting task update:", { taskId, updates });

    // Validate taskId
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Clean updates object - remove undefined values
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    console.log("Clean updates:", cleanUpdates);

    // Perform the update with better error handling
    const { data, error } = await supabase
      .from("tasks")
      .update(cleanUpdates)
      .eq("id", taskId)
      .select('*') // Return updated data to verify success
      .single(); // Expect single record

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log("Task updated successfully:", data);
    return data;

  } catch (error) {
    console.error("editTask error:", error);
    throw error; // Re-throw để component có thể handle
  }
};

export const deleteTask = async (taskId: string): Promise<Task | string> => {
  try {
    console.log("Starting task deletion:", taskId);
    if (!taskId) {
      throw new Error("Task ID is required");
    }
    const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).select('*').single();
    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(`Database deletion failed: ${error.message}`);
    }
    console.log("Task deleted successfully:", data);
    return data;
  }
  catch (error: unknown) {
    console.error("Error deleting task:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete task";
    throw new Error(errorMessage);
  }
  {


  }
}

export const fetchTaskById = async (taskId: string): Promise<TaskFormData | null> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
  return data as TaskFormData;
}
export const TaskReview = async (userId: string | undefined) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("status", { count: "exact" })
    .eq("user_id", userId);

  if (error) throw error;

  const total = data?.length ?? 0;
  const totalTodo = data?.filter(t => t.status === "todo").length ?? 0;
  const totalCompleted = data?.filter(t => t.status === "completed").length ?? 0;
  const inProgressTodo = data?.filter(t => t.status === "in-progress").length ?? 0;

  return {
    total,
    totalTodo,
    totalCompleted,
    InprogressTodo: inProgressTodo,
  };
};

