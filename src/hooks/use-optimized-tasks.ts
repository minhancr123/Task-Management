// hooks/use-optimized-tasks.ts
'use client'

import { useTask } from './use-task';
import { useTaskStore } from '@/store/useTaskStore';
import { useEffect, useMemo } from 'react';
import { useDebounce } from './use-debounce';

export function useOptimizedTasks() {
  const { refreshKey, setRefreshing } = useTaskStore();
  const { 
    tasks, 
    taskStats, 
    refreshTasks, 
    isLoading, 
    error,
    addOptimisticTask,
    removeOptimisticTask,
    updateOptimisticTask
  } = useTask();

  // Debounce task stats to prevent excessive re-calculations
  const debouncedTaskStats = useDebounce(taskStats, 150);

  // Listen to store refresh triggers
  useEffect(() => {
    if (refreshKey > 0) {
      console.log("🔄 OptimizedTasks: Responding to store refresh trigger");
      setRefreshing(true);
      refreshTasks().finally(() => {
        setRefreshing(false);
      });
    }
  }, [refreshKey, refreshTasks, setRefreshing]);

  // Memoized task collections for performance
  const taskCollections = useMemo(() => {
    const todoTasks = tasks.filter(task => task.status === 'todo');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const completedTasks = tasks.filter(task => task.status === 'completed');

    return {
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      all: tasks
    };
  }, [tasks]);

  // Memoized helper functions
  const helpers = useMemo(() => ({
    getTaskById: (id: string) => tasks.find(task => task.id === id),
    getTasksByStatus: (status: string) => tasks.filter(task => task.status === status),
    getRecentTasks: (limit = 5) => tasks.slice(0, limit),
    getOverdueTasks: () => tasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date) < new Date() && task.status !== 'completed';
    }),
    getTasksCompletedToday: () => {
      const today = new Date().toDateString();
      return tasks.filter(task => {
        if (task.status !== 'completed') return false;
        // Since we don't have updated_at in TaskFormData, we'll use a simple approach
        // In a real app, you might want to add this field to your schema
        return task.status === 'completed';
      });
    }
  }), [tasks]);

  return {
    // Core data
    tasks,
    taskCollections,
    taskStats: debouncedTaskStats,
    
    // States
    isLoading,
    error,
    
    // Actions
    refreshTasks,
    addOptimisticTask,
    removeOptimisticTask,
    updateOptimisticTask,
    
    // Helpers
    ...helpers,
    
    // Computed values
    hasAnyTasks: tasks.length > 0,
    isEmpty: tasks.length === 0,
    completionRate: tasks.length > 0 ? (debouncedTaskStats.completed / tasks.length) * 100 : 0
  };
}
