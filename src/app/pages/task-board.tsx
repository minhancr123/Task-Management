import React, { useState, useEffect } from 'react';
import { useTask } from "@/hooks/use-task";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskFormData } from "@/app/zod/task";
import { editTask, deleteTask as deleteTaskFromLib } from "@/lib/task";
import { toast } from "sonner";
import { CreateTaskDialog } from './task-create-dialog';
import EditTaskDialog from './task-edit-dialog';
import { KanbanBoard } from '@/components/kanban-board';

// Type aliases for better compatibility
type TaskItem = TaskFormData;

export default function TaskBoard() {
  const { tasks, refreshTasks, updateOptimisticTask } = useTask();
  const { triggerRefresh, refreshKey } = useTaskStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Refresh trigger
  useEffect(() => {
    if (refreshKey > 0) refreshTasks();
  }, [refreshKey, refreshTasks]);

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let currentStatus = task.status;
    if (currentStatus === 'in-progress') currentStatus = 'in_progress';

    // OPTIMISTIC UPDATE: Update UI immediately
    updateOptimisticTask(taskId, { status: newStatus as any });

    try {
      const result = await editTask(taskId, { status: newStatus as any });
      if (typeof result === "string") {
        throw new Error(result);
      }
      toast.success(`Moved to ${newStatus.replace("_", " ")}`);
    } catch (error: any) {
      toast.error("Failed to update task: " + error.message);
      // REVERT on error
      updateOptimisticTask(taskId, { status: currentStatus as any });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTaskFromLib(id);
      toast.success("Task deleted");
      triggerRefresh();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <KanbanBoard
        tasks={tasks.filter(t => t.id) as any}
        onTaskMove={handleTaskMove}
        onEditTask={(task) => {
          setEditingTask(task);
          setIsEditDialogOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
        onAddTask={() => setIsCreateDialogOpen(true)}
        isUpdating={isUpdating}
      />

      <CreateTaskDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} categories={["Work", "Personal", "Other"]} />

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdateTask={async (id, updates) => {
            const result = await editTask(id, updates);
            toast.success("Updated");
            triggerRefresh(); // Refresh UI
            return result; // Return the result object as expected
          }}
        />
      )}
    </div>
  );
}
