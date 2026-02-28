"use client";

import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    closestCorners
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Plus, MoreHorizontal } from "lucide-react";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
type Status = "todo" | "in_progress" | "in_review" | "completed";

interface KanbanTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date?: string | null;
    category?: string;
    tags?: string[];
    assignee?: {
        full_name: string | null;
        email: string | null;
    } | null;
    [key: string]: any;
}

interface KanbanBoardProps {
    tasks: KanbanTask[];
    onTaskMove: (taskId: string, newStatus: string) => Promise<void>;
    onEditTask?: (task: any) => void;
    onDeleteTask?: (taskId: string) => void;
    onAddTask?: (status?: string) => void;
    isUpdating?: boolean;
}

// Column definitions
const COLUMNS = [
    {
        id: 'todo',
        title: 'To Do',
        status: 'todo',
        color: 'bg-slate-500',
        columnColor: 'bg-slate-100/80 dark:bg-slate-900/50'
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        status: 'in_progress',
        color: 'bg-blue-500',
        columnColor: 'bg-blue-50/80 dark:bg-blue-900/20'
    },
    {
        id: 'in_review',
        title: 'In Review',
        status: 'in_review',
        color: 'bg-purple-500',
        columnColor: 'bg-purple-50/80 dark:bg-purple-900/20'
    },
    {
        id: 'completed',
        title: 'Completed',
        status: 'completed',
        color: 'bg-green-500',
        columnColor: 'bg-green-50/80 dark:bg-green-900/20'
    }
];

// Priority color mappings
const PRIORITY_COLORS: Record<string, string> = {
    low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    medium: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    high: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    critical: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
};

function SortableTask({
    task,
    onDelete,
    onEdit,
    isUpdating
}: {
    task: KanbanTask;
    onDelete?: (id: string) => void;
    onEdit?: (task: KanbanTask) => void;
    isUpdating?: boolean;
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
        opacity: isDragging ? 0 : 1, // Hide original when dragging
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } catch { return ''; }
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
    const getInitials = (name: string | null) => name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

    return (
        <div ref={setNodeRef} style={style} className="mb-2 touch-none">
            <div
                {...attributes}
                {...listeners}
                onClick={() => onEdit?.(task)}
                className={`
          group relative bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700
          hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer
          ${isUpdating ? 'opacity-70 pointer-events-none' : ''}
          ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
        `}
            >
                {/* Hover Actions */}
                {onDelete && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                {/* Categories/Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {task.category && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {task.category}
                        </span>
                    )}
                    {/* Fallback to first tag if category missing */}
                    {!task.category && task.tags && task.tags.length > 0 && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {task.tags[0]}
                        </span>
                    )}
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                        {task.priority}
                    </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug mb-2 pr-6">
                    {task.title}
                </h4>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                    {task.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(task.due_date)}</span>
                        </div>
                    )}

                    {task.assignee && (
                        <Avatar className="h-5 w-5 border border-slate-200">
                            <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600">
                                {getInitials(task.assignee.full_name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </div>
        </div>
    );
}

function DroppableColumn({
    column,
    tasks,
    onDeleteTask,
    onEditTask,
    isUpdating,
    onAddTask
}: {
    column: typeof COLUMNS[0];
    tasks: KanbanTask[];
    onDeleteTask?: (id: string) => void;
    onEditTask?: (task: KanbanTask) => void;
    isUpdating?: boolean;
    onAddTask?: (status: string) => void;
}) {
    const { setNodeRef } = useDroppable({ id: column.status });

    return (
        <div className="flex flex-col h-auto md:h-full w-full md:w-[300px] flex-shrink-0">
            <div className={`flex-1 flex flex-col rounded-xl px-2 py-3 ${column.columnColor} transition-colors`}>
                {/* Header */}
                <div className="flex items-center justify-between px-2 mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{column.title}</h3>
                        <span className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-sm">
                            {tasks.length}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Task List */}
                <div ref={setNodeRef} className="flex-1 md:overflow-y-auto overflow-visible min-h-[100px] px-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    <SortableContext
                        items={tasks.filter(t => t.id).map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col pb-2">
                            {tasks.map((task) => (
                                <SortableTask
                                    key={task.id}
                                    task={task}
                                    onDelete={onDeleteTask}
                                    onEdit={onEditTask}
                                    isUpdating={isUpdating}
                                />
                            ))}
                            {tasks.length === 0 && (
                                <div
                                    onClick={() => onAddTask?.(column.status)}
                                    className="h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    Drop task here or click + to add
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </div>

                {/* Quick Add Button */}
                {onAddTask && (
                    <button
                        onClick={() => onAddTask(column.status)}
                        className="mt-2 flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors text-sm w-full text-left"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Add task</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export function KanbanBoard({
    tasks,
    onTaskMove,
    onEditTask,
    onDeleteTask,
    onAddTask,
    isUpdating = false
}: KanbanBoardProps) {
    const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);

    // Grouping
    const tasksByStatus = useMemo(() => {
        // Initialize groups including 'in_review'
        const grouped: Record<string, KanbanTask[]> = {
            todo: [],
            in_progress: [],
            in_review: [],
            completed: []
        };

        tasks.forEach((task) => {
            let status = task.status as string;
            if (status === 'in-progress') status = 'in_progress';
            if (status === 'active') status = 'in_progress'; // Map "active" to "in_progress"

            if (grouped[status]) {
                grouped[status].push(task);
            } else {
                // Fallback: put unknown statuses into todo
                grouped['todo'].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find(t => t.id === active.id);
        if (task) setDraggedTask(task);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedTask(null);
        if (!over || !active.id) return;

        const taskId = active.id as string;
        let newStatus: string | null = null;

        // Check if dropped on a column
        if (COLUMNS.map(c => c.id).includes(over.id as string)) {
            newStatus = over.id as string;
        } else {
            // Check if dropped on a task
            const overTask = tasks.find((t) => t.id === over.id);
            if (overTask) {
                let status = overTask.status;
                if (status === 'in-progress') status = 'in_progress';
                newStatus = status;
            }
        }

        if (!newStatus) return;

        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        let currentStatus = task.status;
        if (currentStatus === 'in-progress') currentStatus = 'in_progress';

        if (currentStatus !== newStatus) {
            await onTaskMove(taskId, newStatus);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* Kanban Board Container - Responsive */}
                <div className="flex-1 md:overflow-x-auto md:overflow-y-hidden overflow-y-auto">
                    <div className="h-auto md:h-full flex flex-col md:flex-row gap-4 pb-4 items-start w-full md:w-auto md:min-w-max">
                        {COLUMNS.map((column) => (
                            <DroppableColumn
                                key={column.id}
                                column={column}
                                tasks={tasksByStatus[column.status] || []}
                                onDeleteTask={onDeleteTask}
                                onEditTask={onEditTask}
                                isUpdating={isUpdating}
                                onAddTask={onAddTask}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
                    {draggedTask && (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-indigo-500 w-[280px] rotate-3 cursor-grabbing opacity-90">
                            <div className="flex gap-2 mb-2">
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[draggedTask.priority] || PRIORITY_COLORS.medium}`}>
                                    {draggedTask.priority}
                                </span>
                            </div>
                            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{draggedTask.title}</h4>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
