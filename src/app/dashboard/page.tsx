"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROLE_DISPLAY } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import {
    Users,
    FolderKanban,
    CheckSquare,
    Clock,
    TrendingUp,
    AlertTriangle,
    CalendarCheck,
    Briefcase,
    ArrowUpRight,
    Activity,
    ListTodo,
    CheckCircle2,
    Timer,
    XCircle,
    Sparkles,
    Zap,
    MessageSquare,
    Target,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardStats {
    totalUsers: number;
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    myTasks: number;
    myCompletedTasks: number;
    pendingLeaves: number;
    pendingApprovals: number;
}

export default function EnterpriseDashboard() {
    const { user, profile } = useAuth();
    const {
        role,
        isAdmin,
        isManager,
        canManageUsers,
        canViewReportsAll,
        canApproveLeave,
    } = usePermissions();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        myTasks: 0,
        myCompletedTasks: 0,
        pendingLeaves: 0,
        pendingApprovals: 0,
    });
    const [recentTasks, setRecentTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const promises: Promise<any>[] = [];

            promises.push(
                supabase
                    .from("tasks")
                    .select("id, status", { count: "exact" })
                    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id},user_id.eq.${user.id}`)
            );
            promises.push(
                supabase
                    .from("tasks")
                    .select("*")
                    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id},user_id.eq.${user.id}`)
                    .order("created_at", { ascending: false })
                    .limit(5)
            );

            if (isAdmin || isManager) {
                promises.push(supabase.from("profiles").select("*", { count: "exact", head: true }));
                promises.push(supabase.from("projects").select("*", { count: "exact", head: true }));
                promises.push(supabase.from("tasks").select("*", { count: "exact", head: true }));
                promises.push(
                    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed")
                );
            }

            if (canApproveLeave) {
                promises.push(
                    supabase
                        .from("leave_requests")
                        .select("*", { count: "exact", head: true })
                        .eq("status", "pending")
                        .then((res) => res)
                        .catch(() => ({ count: 0 }))
                );
            }

            const results = await Promise.allSettled(promises);

            const myTasksResult = results[0].status === "fulfilled" ? results[0].value : { data: [] };
            const myTasks = myTasksResult.data || [];
            const myCompleted = myTasks.filter((t: any) => t.status === "completed").length;

            const recentResult = results[1].status === "fulfilled" ? results[1].value : { data: [] };
            setRecentTasks(recentResult.data || []);

            const newStats: DashboardStats = {
                myTasks: myTasks.length,
                myCompletedTasks: myCompleted,
                inProgressTasks: myTasks.filter(
                    (t: any) => t.status === "in_progress" || t.status === "in-progress"
                ).length,
                overdueTasks: myTasks.filter(
                    (t: any) =>
                        t.due_date &&
                        new Date(t.due_date) < new Date() &&
                        t.status !== "completed" &&
                        t.status !== "cancelled"
                ).length,
                totalUsers: 0,
                totalProjects: 0,
                totalTasks: 0,
                completedTasks: 0,
                pendingLeaves: 0,
                pendingApprovals: 0,
            };

            if (isAdmin || isManager) {
                newStats.totalUsers = results[2]?.status === "fulfilled" ? results[2].value.count || 0 : 0;
                newStats.totalProjects = results[3]?.status === "fulfilled" ? results[3].value.count || 0 : 0;
                newStats.totalTasks = results[4]?.status === "fulfilled" ? results[4].value.count || 0 : 0;
                newStats.completedTasks = results[5]?.status === "fulfilled" ? results[5].value.count || 0 : 0;

                if (canApproveLeave && results[6]?.status === "fulfilled") {
                    newStats.pendingLeaves = results[6].value.count || 0;
                }
            }

            setStats(newStats);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin, isManager, canApproveLeave]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const roleDisplay = ROLE_DISPLAY[role];
    const completionRate = stats.myTasks > 0 ? Math.round((stats.myCompletedTasks / stats.myTasks) * 100) : 0;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng";
        if (hour < 18) return "Chào buổi chiều";
        return "Chào buổi tối";
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
            in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
            "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
            active: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
            in_review: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
            completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
            cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        };
        return map[status] || "bg-slate-100 text-slate-700";
    };

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            todo: "Chờ làm", "in-progress": "Đang làm", in_progress: "Đang làm",
            active: "Đang hoạt động",
            in_review: "Chờ duyệt", completed: "Hoàn thành", cancelled: "Đã hủy",
        };
        return map[status] || status;
    };

    const getPriorityIndicator = (priority: string) => {
        const map: Record<string, string> = {
            critical: "bg-red-500", high: "bg-orange-500",
            medium: "bg-yellow-500", low: "bg-emerald-500",
        };
        return map[priority] || "bg-slate-400";
    };

    // SVG circular progress
    const CircularProgress = ({ value, size = 44, stroke = 3.5 }: { value: number; size?: number; stroke?: number }) => {
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        return (
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/10" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#progressGradient)" strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out" />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
                    </linearGradient>
                </defs>
            </svg>
        );
    };

    const myStatCards = [
        {
            label: "Công việc", value: stats.myTasks, icon: ListTodo,
            gradient: "from-indigo-600 to-blue-500", shadow: "shadow-indigo-500/20",
        },
        {
            label: "Hoàn thành", value: stats.myCompletedTasks, icon: CheckCircle2,
            gradient: "from-emerald-600 to-teal-500", shadow: "shadow-emerald-500/20",
            extra: (
                <div className="flex items-center gap-2 mt-2">
                    <CircularProgress value={completionRate} />
                    <span className="text-white/70 text-xs font-medium">{completionRate}%</span>
                </div>
            ),
        },
        {
            label: "Đang làm", value: stats.inProgressTasks, icon: Timer,
            gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20",
        },
        {
            label: "Quá hạn", value: stats.overdueTasks, icon: AlertTriangle,
            gradient: "from-red-600 to-rose-500", shadow: "shadow-red-500/20",
        },
    ];

    const quickActions = [
        { label: "Tạo công việc", icon: CheckSquare, color: "text-blue-500 bg-blue-500/10", href: "/tasks" },
        { label: "Xem dự án", icon: FolderKanban, color: "text-indigo-500 bg-indigo-500/10", href: "/projects" },
        { label: "Ghi nhận giờ làm", icon: Clock, color: "text-amber-500 bg-amber-500/10", href: "/timesheets" },
        { label: "Xin nghỉ phép", icon: CalendarCheck, color: "text-emerald-500 bg-emerald-500/10", href: "/leaves" },
        { label: "Nhắn tin", icon: MessageSquare, color: "text-purple-500 bg-purple-500/10", href: "/chat" },
        { label: "Đánh giá KPI", icon: Target, color: "text-pink-500 bg-pink-500/10", href: "/kpi" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {getGreeting()},{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {profile?.full_name?.split(" ").slice(-1)[0] || "bạn"}
                        </span>{" "}
                        👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Đây là tổng quan công việc của bạn hôm nay
                    </p>
                </div>
                <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${roleDisplay.color} ${roleDisplay.bgColor} border border-current/10`}
                >
                    {roleDisplay.label}
                </span>
            </div>

            {/* My Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                {myStatCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.label}
                            className={`relative overflow-hidden border-0 bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg hover-lift`}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-white/70 text-xs font-medium">{card.label}</p>
                                        <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                                            {loading ? (
                                                <span className="inline-block w-8 h-8 rounded bg-white/20 animate-pulse" />
                                            ) : card.value}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                {card.extra}
                                {/* Decorative circle */}
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5" />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Admin/Manager Stats */}
            {(isAdmin || isManager) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    {[
                        { label: "Tổng nhân sự", value: stats.totalUsers, icon: Users, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/10" },
                        { label: "Dự án", value: stats.totalProjects, icon: FolderKanban, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/10" },
                        { label: "Tổng task", value: stats.totalTasks, icon: CheckSquare, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-500/10" },
                        ...(canApproveLeave
                            ? [{ label: "Đơn chờ duyệt", value: stats.pendingLeaves, icon: CalendarCheck, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/10" }]
                            : [{ label: "Task hoàn thành", value: stats.completedTasks, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" }]),
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="border border-slate-200/60 dark:border-white/[0.06] shadow-sm hover-lift bg-white dark:bg-white/[0.02]">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{item.label}</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                                                {loading ? <span className="inline-block w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" /> : item.value}
                                            </p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${item.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Recent Tasks + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tasks */}
                <Card className="lg:col-span-2 border border-slate-200/60 dark:border-white/[0.06] shadow-sm bg-white dark:bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                Công việc gần đây
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 gap-1"
                                onClick={() => router.push("/tasks")}
                            >
                                Xem tất cả
                                <ArrowUpRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] animate-pulse">
                                        <div className="w-1.5 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                                    <CheckSquare className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Chưa có công việc nào</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Bắt đầu bằng cách tạo công việc đầu tiên</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => router.push("/tasks")}
                                >
                                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                                    Tạo công việc
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {recentTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all duration-200 cursor-pointer group"
                                        onClick={() => router.push(`/tasks`)}
                                    >
                                        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${getPriorityIndicator(task.priority)}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                                                    {getStatusLabel(task.status)}
                                                </span>
                                                {task.due_date && (
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {new Date(task.due_date).toLocaleDateString("vi-VN")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border border-slate-200/60 dark:border-white/[0.06] shadow-sm bg-white dark:bg-white/[0.02]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Thao tác nhanh
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={action.label}
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all duration-200 group"
                                    onClick={() => router.push(action.href)}
                                >
                                    <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                        {action.label}
                                    </span>
                                </Button>
                            );
                        })}

                        {isAdmin && (
                            <>
                                <div className="border-t border-slate-200/60 dark:border-white/[0.06] my-2" />
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all duration-200 group"
                                    onClick={() => router.push("/users")}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quản lý nhân sự</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all duration-200 group"
                                    onClick={() => router.push("/departments")}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quản lý phòng ban</span>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
