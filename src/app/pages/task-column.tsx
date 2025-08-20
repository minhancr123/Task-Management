"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFormData } from "../zod/task";
import { UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./task-card";
import EditTaskDialog from "./task-edit-dialog";
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTaskById, Task } from "@/lib/task";

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: TaskFormData[];
  onUpdateTask: (taskId: string, updates: Partial<TaskFormData>) => Promise<Task | string>;
  onDeleteTask: (taskId: string) => void;
  loading?: boolean;
  error?: string;
}

const statusColors = {
  todo: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  "in-progress": "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  completed: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
} as const;

type StatusType = keyof typeof statusColors;

const TaskCardSkeleton = () => (
  <div className="p-3 rounded-lg border bg-white dark:bg-gray-800 space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-12" />
    </div>
  </div>
);

const ColumnLoadingSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, index) => (
      <TaskCardSkeleton key={index} />
    ))}
  </div>
);

export default function TaskColumn({
  id,
  title,
  tasks,
  onUpdateTask,
  onDeleteTask,
  loading = false,
  error = null,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const [isOpenEditTaskDialog, setIsOpenEditTaskDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskFormData | null>(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());

  const taskIds = useMemo(
    () => tasks.map((t) => t.id!).filter(Boolean) as UniqueIdentifier[],
    [tasks]
  );

  const columnStyles = useMemo(() => {
    const baseStyles = statusColors[id as StatusType] || statusColors.todo;
    const hoverStyles = isOver ? "ring-2 ring-blue-500 ring-opacity-50" : "";
    const loadingStyles = loading ? "opacity-75" : "";
    return `${baseStyles} transition-colors ${hoverStyles} ${loadingStyles}`;
  }, [id, isOver, loading]);

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<TaskFormData>): Promise<Task | string> => {
      setUpdatingTaskIds((prev) => new Set(prev).add(taskId));

      try {
        const result = await onUpdateTask(taskId, updates);

        // Nếu cần fetch lại từ server sau khi update
        // const taskUpdated = await fetchTaskById(taskId);
        // if (taskUpdated) {
        //   // Task mới sẽ được TaskBoard truyền xuống qua props, không cần set local state
        // }

        return result;
      } finally {
        setUpdatingTaskIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
    },
    [onUpdateTask]
  );

  const handleEdit = useCallback((task: TaskFormData) => {
    setCurrentTask(task);
    setIsOpenEditTaskDialog(true);
  }, []);

  const handleCloseDialog = useCallback((open: boolean) => {
    setIsOpenEditTaskDialog(open);
    if (!open) setCurrentTask(null);
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <>
      <Card className={columnStyles}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center gap-2">
              <span>{title}</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
            </div>
            <Badge variant="secondary" className="ml-2">
              {loading ? "..." : tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <p className="text-sm text-red-500 text-center">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            )}

            {loading && <ColumnLoadingSkeleton />}

            {!loading && !error && (
              <>
                {tasks.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tasks in {title.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => {
                      const isUpdating = updatingTaskIds.has(task.id!);
                      return (
                        <div key={task.id} className="group flex items-center gap-1 relative">
                          <div className="flex-1">
                            <div className={`transition-opacity ${isUpdating ? "opacity-50" : ""}`}>
                              <TaskCard
                                task={task}
                                onUpdate={handleUpdateTask}
                                onDelete={onDeleteTask}
                              />
                            </div>
                            {isUpdating && <TaskCardSkeleton />}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => handleEdit(task)}
                            aria-label={`Edit ${task.title || "task"}`}
                            disabled={isUpdating || loading}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </SortableContext>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {currentTask && (
        <EditTaskDialog
          task={currentTask}
          open={isOpenEditTaskDialog}
          onOpenChange={handleCloseDialog}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </>
  );
}
