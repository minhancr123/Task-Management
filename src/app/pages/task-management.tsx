"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlarmClockCheck, Laugh, ListChecks, Loader2, Tag, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTaskStore } from "@/store/useTaskStore";
import { useTask } from "@/hooks/use-task";
import { usePageRefresh } from "@/hooks/use-page-refresh";
import TaskBoard from "./task-board";
import { PresenceUser } from "@/context/GloBalPresence";
import OnlineUsers from "@/components/online-users";

const INITIAL_TASK_LIST = {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
};

const STAT_CARDS = [
    {
        key: 'total',
        label: 'Total Tasks',
        icon: Tag,
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
        iconBg: 'bg-blue-500',
        textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
        key: 'todo',
        label: 'To Do',
        icon: AlarmClockCheck,
        gradient: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900',
        iconBg: 'bg-gray-500',
        textColor: 'text-gray-700 dark:text-gray-300'
    },
    {
        key: 'inProgress',
        label: 'In Progress',
        icon: ListChecks,
        gradient: 'from-amber-500 to-orange-500',
        bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900',
        iconBg: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-300'
    },
    {
        key: 'done',
        label: 'Completed',
        icon: CheckCircle,
        gradient: 'from-emerald-500 to-green-500',
        bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900',
        iconBg: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-300'
    },
];

export default function TaskManagement() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { tasks, refreshTasks, isLoading: tasksLoading } = useTask();
    const { refreshKey } = useTaskStore();
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
    // Enable page refresh detection
    usePageRefresh();

    // Calculate task stats from tasks array
    const taskStats = useMemo(() => {
        if (!tasks || tasks.length === 0) return INITIAL_TASK_LIST;

        return {
            total: tasks.length,
            todo: tasks.filter(task => task.status === 'todo').length,
            inProgress: tasks.filter(task => task.status === 'in-progress').length,
            done: tasks.filter(task => task.status === 'completed').length,
        };
    }, [tasks]);

    // Calculate completion percentage
    const completionPercentage = useMemo(() => {
        if (taskStats.total === 0) return 0;
        return Math.round((taskStats.done / taskStats.total) * 100);
    }, [taskStats]);

    // Load tasks when user is available
    useEffect(() => {
        if (user?.id) {
            setLoading(false);
            console.log("🏠 TaskManagement: User available, tasks will load from useTask hook");
        } else {
            setLoading(true);
        }
    }, [user?.id]);

    // Handle refresh trigger from store only (after CRUD operations) 
    useEffect(() => {
        if (refreshKey > 0 && user?.id) {
            console.log("🔄 TaskManagement: Store triggered refresh");
            refreshTasks();
        }
    }, [refreshKey, user?.id, refreshTasks]);

    if (loading || tasksLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="container mx-auto p-6 space-y-8">
                    {/* Header Skeleton */}
                    <div className="text-center space-y-4">
                        <div className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-64 mx-auto animate-pulse"></div>
                        <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded w-96 mx-auto animate-pulse"></div>
                        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded w-80 mx-auto animate-pulse"></div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STAT_CARDS.map((_, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-20 animate-pulse"></div>
                                        <div className="h-8 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-400 rounded w-12 animate-pulse"></div>
                                    </div>
                                    <div className="h-8 w-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-lg animate-pulse"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-16 animate-pulse"></div>
                                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-8 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress Card Skeleton */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="space-y-2">
                                <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-32 animate-pulse"></div>
                                <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-48 animate-pulse"></div>
                            </div>
                            <div className="h-16 w-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                                <div className="h-2 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-400 rounded-full w-1/3 animate-pulse"></div>
                            </div>
                            <div className="flex justify-between">
                                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-24 animate-pulse"></div>
                                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Task Board Skeleton */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-24 animate-pulse"></div>
                            <div className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-32 animate-pulse"></div>
                        </div>
                        
                        {/* Kanban Columns Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((col) => (
                                <div key={col} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-20 animate-pulse"></div>
                                        <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-8 animate-pulse"></div>
                                    </div>
                                    
                                    {/* Task Cards Skeleton */}
                                    <div className="space-y-3">
                                        {[1, 2].map((task) => (
                                            <div key={task} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                                                <div className="space-y-3">
                                                    <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-full animate-pulse"></div>
                                                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-3/4 animate-pulse"></div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-2">
                                                            <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-16 animate-pulse"></div>
                                                            <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-12 animate-pulse"></div>
                                                        </div>
                                                        <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-16 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-600 dark:text-red-400 text-2xl">!</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Welcome Section */}
                <div className="mb-8 sm:mb-12">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="relative">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl">
                                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                Dashboard
                            </h1>
                            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                                Welcome back! Here's your productivity overview
                            </p>
                        </div>
                    </div>
                    
                    {/* Progress Section */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                                <span className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Overall Progress
                                </span>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {completionPercentage}%
                                </span>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">completed</p>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                                    style={{ width: `${completionPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                </div>
                            </div>
                            <div className="absolute right-0 top-4 sm:top-6 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {taskStats.done} of {taskStats.total} tasks completed
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12">
                    {STAT_CARDS.map((card, index) => {
                        const IconComponent = card.icon;
                        const value = taskStats[card.key as keyof typeof taskStats];
                        
                        return (
                            <Card key={card.key} className={`${card.bgColor} border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 rounded-xl sm:rounded-2xl group`}>
                                <CardContent className="p-4 sm:p-8">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                        <div className="w-full sm:w-auto">
                                            <p className={`text-xs sm:text-sm font-bold ${card.textColor} mb-1 sm:mb-2 uppercase tracking-wider`}>
                                                {card.label}
                                            </p>
                                            <p className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 group-hover:scale-110 transition-transform duration-300">
                                                {value}
                                            </p>
                                        </div>
                                        <div className={`h-10 w-10 sm:h-16 sm:w-16 ${card.iconBg} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-300 self-end sm:self-auto`}>
                                            <IconComponent className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-2xl rounded-xl sm:rounded-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                        <CardHeader className="pb-4 sm:pb-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
                                    <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Today's Focus</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your priority tasks</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {taskStats.todo + taskStats.inProgress}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Active tasks to complete
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-2xl rounded-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                        <CardHeader className="pb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                                    <CheckCircle className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">This Week</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed tasks</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {taskStats.done}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tasks finished
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-2xl rounded-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                        <CardHeader className="pb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                                    <TrendingUp className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Productivity</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completion rate</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {completionPercentage}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Overall efficiency
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Task Board Component */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <ListChecks className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                Task Board
                            </h2>
                        </div>
                        <TaskBoard />
                    </div>
                </div>
            </div>
            
            {/* Online Users Component */}
            <OnlineUsers />
        </div>
    );
}