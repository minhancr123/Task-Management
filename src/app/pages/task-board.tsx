"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import TaskColumn from "./task-column";
import { TaskFormData } from "../zod/task";
import { Task } from "@/lib/task";
import { useTaskStore } from "@/store/useTaskStore";

type Status = "todo" | "in-progress" | "completed";

interface TaskBoardProps {
  tasks: TaskFormData[];
  onCreateTask?: (task: TaskFormData) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskFormData>) => Promise<Task | string>;
  onDeleteTask: (taskId: string) => void;
  onMoveTask?: (taskId: string, newStatus: Status) => void;
  loading?: boolean;
  error?: string; // dùng string | undefined, KHÔNG dùng null
}

// Cấu hình cột
const COLUMNS = [
  { id: "todo", title: "To Do", status: "todo" as Status },
  { id: "in-progress", title: "In Progress", status: "in-progress" as Status },
  { id: "completed", title: "Completed", status: "completed" as Status },
] as const;

export default function TaskBoard({
  tasks = [],
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  loading = false,
  error, // đừng đặt mặc định = null
}: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<TaskFormData | null>(null);
  const {refreshKey} = useTaskStore();

  // Đồng bộ state hiển thị với props tasks
  const [taskUpdated, setTaskUpdated] = useState<TaskFormData[]>(tasks);
  useEffect(() => {
    setTaskUpdated(tasks);
  }, [tasks ,refreshKey]);

  // Loading/error theo từng cột, dùng key là status để thống nhất
  const [columnLoadingStates, setColumnLoadingStates] = useState<Record<Status, boolean>>({
    "todo": false,
    "in-progress": false,
    "completed": false,
  });
  const [columnErrors, setColumnErrors] = useState<Record<Status, string | undefined>>({
    "todo": undefined,
    "in-progress": undefined,
    "completed": undefined,
  });

  // Gom task theo status
  const tasksByStatus = useMemo(() => {
    if (loading || !Array.isArray(taskUpdated)) {
      return {
        "todo": [] as TaskFormData[],
        "in-progress": [] as TaskFormData[],
        "completed": [] as TaskFormData[],
      };
    }
    return {
      "todo": taskUpdated.filter((t) => t.status === "todo"),
      "in-progress": taskUpdated.filter((t) => t.status === "in-progress"),
      "completed": taskUpdated.filter((t) => t.status === "completed"),
    };
  }, [taskUpdated, loading]);

  // Update task có loading/error theo cột
  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<TaskFormData>): Promise<Task | string> => {
      const currentTask = taskUpdated.find((t) => t.id === taskId);
      const currentStatus: Status = (currentTask?.status as Status) ?? "todo";
      const newStatus: Status = (updates.status as Status) ?? currentStatus;

      // bật loading 2 cột nếu chuyển cột
      setColumnLoadingStates((prev) => ({
        ...prev,
        [currentStatus]: true,
        ...(newStatus !== currentStatus ? { [newStatus]: true } : {}),
      }));

      try {
        const result = await onUpdateTask(taskId, updates);

        // Chỉ cập nhật UI khi result là Task (thành công), tránh string cũng truthy
        if (typeof result !== "string") {
          setTaskUpdated((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

          // clear lỗi ở các cột liên quan
          setColumnErrors((prev) => ({
            ...prev,
            [currentStatus]: undefined,
            ...(newStatus !== currentStatus ? { [newStatus]: undefined } : {}),
          }));
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Update failed";
        // Gán lỗi cho cột liên quan
        setColumnErrors((prev) => ({
          ...prev,
          [currentStatus]: errorMessage,
          ...(newStatus !== currentStatus ? { [newStatus]: errorMessage } : {}),
        }));
        return "Failed to update task";
      } finally {
        // tắt loading
        setColumnLoadingStates((prev) => ({
          ...prev,
          [currentStatus]: false,
          ...(newStatus !== currentStatus ? { [newStatus]: false } : {}),
        }));
      }
    },
    [taskUpdated, onUpdateTask]
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      // lấy từ taskUpdated (mới nhất), tránh lệch so với tasks props
      const task = taskUpdated.find((t) => t.id === active.id);
      setActiveId(active.id as string);
      setDraggedTask(task ?? null);
    },
    [taskUpdated]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Có thể thêm visual hoặc reorder tạm ở đây nếu cần
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      // giữ bản sao trước khi reset state
      const currentDragged = draggedTask;

      setActiveId(null);
      setDraggedTask(null);

      if (!over || !currentDragged) return;

      const newStatus = over.id as Status;
      const oldStatus = currentDragged.status as Status;

      if (newStatus === oldStatus) return;

      try {
        const result = await handleUpdateTask(currentDragged.id!, { status: newStatus });

        if (typeof result !== "string" && onMoveTask) {
          onMoveTask(currentDragged.id!, newStatus);
        }
      } catch (err) {
        console.error("Error moving task:", err);
      }
    },
    [draggedTask, handleUpdateTask, onMoveTask]
  );

  // Reset lỗi cột khi đã load thành công danh sách
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      setColumnErrors({
        "todo": undefined,
        "in-progress": undefined,
        "completed": undefined,
      });
    }
  }, [loading, tasks.length]);

  return (
    <div className="w-full">
      <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => {
            const status = column.status;
            return (
              <TaskColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasksByStatus[status]}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={onDeleteTask}
                // loading/error theo status cho nhất quán
                loading={loading || columnLoadingStates[status]}
                error={error ?? columnErrors[status] ?? undefined}
              />
            );
          })}
        </div>

        {/* Drag overlay đơn giản */}
         <DragOverlay>
    {draggedTask ? (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border-2 border-blue-500">
        <h4 className="font-medium text-sm">{draggedTask.title}</h4>
        <p className="text-xs text-gray-500 mt-1">Moving to new column...</p>
      </div>
    ) : null}
  </DragOverlay>
      </DndContext>

      {/* Global loading overlay cho lần load đầu */}
      {loading && tasks.length === 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="text-lg font-medium">Loading tasks...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
