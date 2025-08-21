'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Trash2, AlertCircle, Plus, MoreHorizontal } from "lucide-react";
import { useTask } from "@/hooks/use-task";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskFormData } from "@/app/zod/task";
import { editTask, deleteTask as deleteTaskFromLib, createTask } from "@/lib/task";
import { toast } from "sonner";
import { CreateTaskDialog } from './task-create-dialog';
import EditTaskDialog from './task-edit-dialog';
import { useAuth } from "@/hooks/use-auth";
import { snapCenterToCursor } from "@dnd-kit/modifiers";

// Type aliases for better compatibility
type TaskItem = TaskFormData;
type Status = "todo" | "in-progress" | "completed";

// Column definitions
const COLUMNS = [
  { 
    id: 'todo', 
    title: '📝 To Do', 
    status: 'todo' as Status, 
    color: 'from-blue-600 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950'
  },
  { 
    id: 'in-progress', 
    title: '⚡ In Progress', 
    status: 'in-progress' as Status, 
    color: 'from-amber-600 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950'
  },
  { 
    id: 'completed', 
    title: '✅ Completed', 
    status: 'completed' as Status, 
    color: 'from-green-600 to-emerald-600',
    bgColor: 'bg-green-50 dark:bg-green-950'
  }
];

// Priority color mappings
const PRIORITY_COLORS = {
  low: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600 shadow-sm",
  medium: "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 dark:from-amber-900 dark:to-yellow-800 dark:text-amber-200 border border-amber-300 dark:border-amber-600 shadow-sm",
  high: "bg-gradient-to-r from-red-100 to-pink-200 text-red-800 dark:from-red-900 dark:to-pink-800 dark:text-red-200 border border-red-300 dark:border-red-600 shadow-sm"
};

// Sortable Task Component
function SortableTask({ 
  task, 
  onDelete, 
  onEdit,
  isUpdating 
}: { 
  task: TaskItem; 
  onDelete: (id: string) => void; 
  onEdit: (task: TaskItem) => void;
  isUpdating: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id || "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const isOverdue = () => {
    try {
      return new Date(task.due_date) < new Date() && task.status !== 'completed';
    } catch {
      return false;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card 
  {...attributes}
  {...listeners}
  className={`
    overflow-hidden relative bg-white dark:bg-gray-800 shadow-sm hover:shadow-md 
    transition-all duration-200 
    cursor-grab active:cursor-grabbing 
    border border-gray-200 dark:border-gray-700 rounded-xl mb-3
    ${isDragging ? 'shadow-xl cursor-grabbing' : 'hover:-translate-y-0.5 cursor-grab'}
    ${isOverdue() ? 'ring-2 ring-red-400' : ''}
  `}
  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
>
  {/* Priority stripe */}
  <div
    className={`
      absolute top-0 w-full h-5
      ${task.priority === 'high' ? 'bg-red-500' :
        task.priority === 'medium' ? 'bg-amber-500' :
        'bg-blue-500'}
    `}
  />

  <CardContent className="p-3 sm:p-4">
    <div className="space-y-2 sm:space-y-3">
      {/* Task Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <h3 className="font-semibold text-sm leading-tight text-gray-900 dark:text-gray-100 flex-1 line-clamp-2">
          {task.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="h-6 w-6 text-gray-400 hover:text-blue-500"
            disabled={isUpdating}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id || "")}
            }
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            disabled={isUpdating}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Bottom Row: Category + Priority + Due Date */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          {task.category && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
              {task.category}
            </Badge>
          )}
          <Badge className={`text-xs px-2 py-0.5 font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </Badge>
        </div>
        
        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
          isOverdue() 
            ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950' 
            : 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800'
        }`}>
          <Calendar className="w-3 h-3 mr-1" />
          <span>{formatDate(task.due_date)}</span>
          {isOverdue() && <AlertCircle className="w-3 h-3 ml-1" />}
        </div>
      </div>
    </div>
  </CardContent>
</Card>

    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  tasks, 
  onDeleteTask, 
  onEditTask,
  isUpdating 
}: { 
  column: typeof COLUMNS[0]; 
  tasks: TaskItem[]; 
  onDeleteTask: (id: string) => void; 
  onEditTask: (task: TaskItem) => void;
  isUpdating: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 
        shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col
        ${isOver ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/50' : ''}
      `}
    >
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${column.color} text-white p-4 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
              {tasks.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-4 min-h-0 overflow-y-auto">
        <SortableContext 
          items={tasks.filter(task => task.id).map(task => task.id!)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0 h-full">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-full ${column.bgColor} flex items-center justify-center`}>
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {column.status === "todo" 
                        ? "No tasks yet" 
                        : column.status === "in-progress"
                        ? "Nothing in progress"
                        : "No completed tasks"
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                      {column.status === "todo" 
                        ? "Create new tasks or drag them here to get started" 
                        : `Drag tasks here when ${column.status === "in-progress" ? "you're working on them" : "they're completed"}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onDelete={onDeleteTask}
                  onEdit={onEditTask}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const { tasks, refreshTasks } = useTask();
  const { triggerRefresh, refreshKey } = useTaskStore();
  const { user } = useAuth();
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Auto-refresh when refresh is triggered
  useEffect(() => {
    if (refreshKey > 0) {
      console.log("🔄 TaskBoard: Auto-refreshing due to trigger");
      refreshTasks();
    }
  }, [refreshKey, refreshTasks]);

  // Force refresh when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log("� TaskBoard: Component mounted with user, forcing refresh");
      refreshTasks();
    }
  }, [user?.id, refreshTasks]);

  // Additional refresh on every mount (navigation)
  useEffect(() => {
    console.log("📋 TaskBoard: Component mounted, refreshing tasks");
    if (user?.id) {
      refreshTasks();
    }
  }, []);

  // Configure sensors for better drag behavior
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 3,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50,
      tolerance: 3,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: [] as TaskItem[],
      "in-progress": [] as TaskItem[],
      completed: [] as TaskItem[]
    };

    tasks.forEach((task) => {
      if (task.id && grouped[task.status]) {
        grouped[task.status].push({
          id: task.id,
          title: task.title,
          description: task.description || "",
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          category: task.category
        });
      }
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task && task.id) {
      setDraggedTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over || !active.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as Status;
    
    // Check if it's a valid status
    if (!["todo", "in-progress", "completed"].includes(newStatus)) {
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    console.log(`Moving task ${taskId} from ${task.status} to ${newStatus}`);

    try {
      setIsUpdating(true);
      const result = await editTask(taskId, { status: newStatus });
      
      if (typeof result === "string") {
        toast.error(result);
        return;
      }

      toast.success(`Task moved to ${newStatus.replace('-', ' ')}`);
      triggerRefresh();
      await refreshTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsUpdating(true);
      await deleteTaskFromLib(taskId);
      toast.success("Task deleted successfully");
      triggerRefresh();
      await refreshTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="w-full h-full relative">
      {/* Mobile Header */}
      <div className="lg:hidden mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
        <h2 className="text-lg font-bold mb-1">Task Board</h2>
        <p className="text-blue-100 text-sm">Drag and drop to organize your tasks</p>
        <div className="flex gap-4 mt-3">
          {COLUMNS.map((col) => (
            <div key={col.id} className="text-center">
              <div className="text-xs text-blue-200">{col.title.split(' ').slice(1).join(' ')}</div>
              <div className="text-lg font-bold">{tasksByStatus[col.status].length}</div>
            </div>
          ))}
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">
          {COLUMNS.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.status]}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              isUpdating={isUpdating}
            />
          ))}
        </div>

        <DragOverlay 
          dropAnimation={null}
          style={{ cursor: 'grabbing' }}
          modifiers={[snapCenterToCursor]}
        >
          {draggedTask && (
            <div 
              className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border-2 border-blue-500 opacity-90"
              style={{ 
                transform: 'rotate(5deg)',
                cursor: 'grabbing'
              }}
            >
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{draggedTask.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-xs">{draggedTask.priority}</Badge>
                {draggedTask.category && (
                  <Badge variant="outline" className="text-xs">{draggedTask.category}</Badge>
                )}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create Task Dialog */}
      {isCreateDialogOpen && (
        <CreateTaskDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateTask={async (task: Omit<TaskItem, "id">) => {
            if (!user?.id) {
              toast.error("User not authenticated");
              return;
            }
            const result = await createTask(task, user.id);
            if (typeof result === "string") {
              toast.error(result);
              throw new Error(result);
            }
            toast.success("Task created successfully");
            setIsCreateDialogOpen(false);
            triggerRefresh();
            await refreshTasks();
            return result;
          }}
          categories={["Work", "Personal", "Shopping", "Health", "Other"]}
        />
      )}

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdateTask={async (taskId: string, updates: any) => {
            const result = await editTask(taskId, updates);
            if (typeof result === "string") {
              toast.error(result);
              throw new Error(result);
            }
            toast.success("Task updated successfully");
            setIsEditDialogOpen(false);
            setEditingTask(null);
            triggerRefresh();
            await refreshTasks();
            return result;
          }}
        />
      )}
    </div>
  );
}
