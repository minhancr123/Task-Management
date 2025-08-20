import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label";
import { deleteTask, editTask, Task, TaskReview } from "@/lib/task";
import { AlarmClockCheck, Laugh, ListChecks, Loader2, Tag } from "lucide-react"
import { useEffect, useState, useCallback, useMemo } from "react";
import TaskBoard from "./task-board";
import { useTask } from "@/hooks/use-task";
import { TaskFormData } from "../zod/task";

interface TaskStats {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
}

// Move constants outside component
const INITIAL_TASK_LIST: TaskStats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0
};

const STAT_CARDS = [
    {
        key: 'total' as keyof TaskStats,
        label: 'Total',
        icon: Tag,
        bgColor: 'bg-blue-500 dark:bg-blue-900',
        iconColor: 'text-white'
    },
    {
        key: 'todo' as keyof TaskStats,
        label: 'Todo',
        icon: AlarmClockCheck,
        bgColor: 'bg-gray-600 dark:bg-gray-800',
        iconColor: 'text-white'
    },
    {
        key: 'inProgress' as keyof TaskStats,
        label: 'In Progress',
        icon: ListChecks,
        bgColor: 'bg-amber-500 dark:bg-amber-700',
        iconColor: 'text-white'
    },
    {
        key: 'done' as keyof TaskStats,
        label: 'Completed',
        icon: Laugh,
        bgColor: 'bg-green-500 dark:bg-green-700',
        iconColor: 'text-white'
    }
];

export const TaskManagement = () => {
    const [taskList, setTaskList] = useState<TaskStats>(INITIAL_TASK_LIST);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { tasks } = useTask();

    // Memoize the fetch function to prevent unnecessary re-creations
    const fetchTaskStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log("Fetching task stats...");
            const taskStats = await TaskReview();
            console.log("Task stats received:", taskStats);
            
            setTaskList({
                total: taskStats.total || 0,
                todo: taskStats.totalTodo || 0,
                done: taskStats.totalCompleted || 0,
                inProgress: taskStats.InprogressTodo || 0
            });
            
        } catch (error) {
            console.error("Error fetching task data:", error);
            setError("Failed to load task statistics");
            // Set default values on error
            setTaskList(INITIAL_TASK_LIST);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            if (isMounted) {
                await fetchTaskStats();
            }
        };
        
        loadData();
        
        return () => {
            isMounted = false;
        };
    }, [fetchTaskStats]);

    const handleCreateTask = useCallback(async (taskData: TaskFormData) => {
        try {
        }
        catch (error) {
            console.error("Error creating task:", error);
        }
    }, []);

    // Optimized update task function
    const onUpdateTask = useCallback(async (taskId: string, updatesData: Partial<TaskFormData>): Promise<Task | string> => {
        try {
            const result = await editTask(taskId, updatesData);
            if (result) {
                console.log("Task updated successfully");
                // Optionally refresh stats after update
                // await fetchTaskStats();
                return result;
            } else {
                console.error("Failed to update task");
                return "Failed to update task";
            }
        } catch (error) {
            console.error("Error updating task:", error);
            return error instanceof Error ? error.message : "Update failed";
        }
    }, [fetchTaskStats]);

    const onDeleteTask = useCallback( async(taskId : string): Promise<Task | string> => {
         try {
            const result = await deleteTask(taskId);
            if (result) {
                console.log("Task deleted successfully");
                // Optionally refresh stats after delete
                // await fetchTaskStats();
                return result;
            } else {
                console.error("Failed to delete task");
                return "Failed to delete task";
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            return error instanceof Error ? error.message : "Delete failed";
        }
    }, [fetchTaskStats]);

               

    const handleMoveTask = useCallback((): void => {
        // Implementation for move task
        console.log("Move task functionality to be implemented");
    }, []);

    // Memoize stat cards to prevent unnecessary re-renders
    const statCards = useMemo(() => {
        return STAT_CARDS.map((card) => {
            const IconComponent = card.icon;
            return (
                <Card key={card.key} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-600 dark:text-slate-100 font-bold">
                                {card.label}: {taskList[card.key]}
                            </Label>
                            <div className={`w-8 h-8 ${card.bgColor} rounded-full flex items-center justify-center`}>
                                <IconComponent className={`h-4 w-4 ${card.iconColor}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        });
    }, [taskList]);

    // Show error state
    if (error && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <p className="text-red-500 text-center">{error}</p>
                <button 
                    onClick={fetchTaskStats}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-sm text-slate-500">Loading task statistics...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {statCards}
                    </div>

                    <TaskBoard
                        onCreateTask={handleCreateTask}
                        tasks={tasks}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onMoveTask={handleMoveTask}
                    />
                </>
            )}
        </>
    );
};