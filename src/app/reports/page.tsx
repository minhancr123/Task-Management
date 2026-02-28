"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    BarChart3, Users, FolderKanban, CheckCircle2, Clock, TrendingUp,
    Briefcase, ListTodo, CalendarDays, Download, FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";

type ReportTab = "overview" | "tasks" | "team" | "timesheets";

export default function ReportsPage() {
    const { user } = useAuth();
    const { isManager, isAdmin, canViewReportsAll } = usePermissions();
    const [stats, setStats] = useState<any>(null);
    const [taskStats, setTaskStats] = useState<any[]>([]);
    const [teamStats, setTeamStats] = useState<any[]>([]);
    const [timesheetData, setTimesheetData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<ReportTab>("overview");

    const fetchStats = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);

            // Total counts
            const [projectsRes, tasksRes, usersRes, deptRes] = await Promise.all([
                supabase.from("projects").select("id, status", { count: "exact" }),
                supabase.from("tasks").select("id, status, priority, assigned_to, project_id", { count: "exact" }),
                supabase.from("profiles").select("id, full_name, role, department_id", { count: "exact" }),
                supabase.from("departments").select("id", { count: "exact" }),
            ]);

            const allTasks = tasksRes.data || [];
            const completedTasks = allTasks.filter(t => t.status === "completed").length;
            const inProgressTasks = allTasks.filter(t => t.status === "in_progress").length;
            const todoTasks = allTasks.filter(t => t.status === "todo").length;
            const inReviewTasks = allTasks.filter(t => t.status === "in_review").length;

            const allProjects = projectsRes.data || [];
            const activeProjects = allProjects.filter(p => p.status === "active").length;

            setStats({
                totalProjects: allProjects.length,
                activeProjects,
                totalTasks: allTasks.length,
                completedTasks,
                inProgressTasks,
                todoTasks,
                inReviewTasks,
                totalUsers: usersRes.count || 0,
                totalDepartments: deptRes.count || 0,
                completionRate: allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0,
            });

            // Task breakdown by priority
            const priorityCounts = ["low", "medium", "high", "critical"].map(p => ({
                priority: p,
                count: allTasks.filter(t => t.priority === p).length,
            }));
            setTaskStats(priorityCounts);

            // Team performance
            const users = usersRes.data || [];
            const teamPerf = users.slice(0, 10).map(u => ({
                id: u.id,
                name: u.full_name || "Unknown",
                role: u.role,
                totalTasks: allTasks.filter(t => t.assigned_to === u.id).length,
                completed: allTasks.filter(t => t.assigned_to === u.id && t.status === "completed").length,
            })).filter(u => u.totalTasks > 0).sort((a, b) => b.completed - a.completed);
            setTeamStats(teamPerf);

            // Timesheet summary (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 6);
            const { data: tsData } = await supabase.from("timesheets")
                .select("work_date, hours")
                .gte("work_date", weekAgo.toISOString().slice(0, 10))
                .order("work_date");
            const dayMap: Record<string, number> = {};
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekAgo);
                d.setDate(weekAgo.getDate() + i);
                dayMap[d.toISOString().slice(0, 10)] = 0;
            }
            (tsData || []).forEach(t => { if (dayMap[t.work_date] !== undefined) dayMap[t.work_date] += t.hours || 0; });
            setTimesheetData(Object.entries(dayMap).map(([date, hours]) => ({ date, hours })));

        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleExportCSV = () => {
        if (!stats) return;
        const rows = [
            ["Metric", "Value"],
            ["Total Projects", stats.totalProjects],
            ["Active Projects", stats.activeProjects],
            ["Total Tasks", stats.totalTasks],
            ["Completed Tasks", stats.completedTasks],
            ["In Progress", stats.inProgressTasks],
            ["Completion Rate", `${stats.completionRate}%`],
            ["Total Users", stats.totalUsers],
            ["Total Departments", stats.totalDepartments],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Đã xuất CSV!");
    };

    const PRIORITY_COLORS: Record<string, string> = { low: "bg-green-400", medium: "bg-yellow-400", high: "bg-orange-400", critical: "bg-red-400" };
    const PRIORITY_LABELS: Record<string, string> = { low: "Thấp", medium: "TB", high: "Cao", critical: "Khẩn" };

    const tabs: { key: ReportTab; label: string; icon: any }[] = [
        { key: "overview", label: "Tổng quan", icon: BarChart3 },
        { key: "tasks", label: "Tasks", icon: ListTodo },
        { key: "team", label: "Team", icon: Users },
        { key: "timesheets", label: "Chấm công", icon: Clock },
    ];

    if (loading || !stats) {
        return <div className="space-y-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" /><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />)}</div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Báo cáo & Thống kê</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phân tích dữ liệu tổng quan</p>
                </div>
                <Button onClick={handleExportCSV} variant="outline"><Download className="w-4 h-4 mr-2" />Xuất CSV</Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === t.key ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600"><CardContent className="p-4"><p className="text-indigo-100 text-xs flex items-center gap-1"><FolderKanban className="w-3 h-3" />Dự án</p><p className="text-2xl font-bold text-white">{stats.totalProjects}</p><p className="text-indigo-200 text-[10px]">{stats.activeProjects} đang hoạt động</p></CardContent></Card>
                        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600"><CardContent className="p-4"><p className="text-blue-100 text-xs flex items-center gap-1"><ListTodo className="w-3 h-3" />Tasks</p><p className="text-2xl font-bold text-white">{stats.totalTasks}</p><p className="text-blue-200 text-[10px]">{stats.completionRate}% hoàn thành</p></CardContent></Card>
                        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600"><CardContent className="p-4"><p className="text-emerald-100 text-xs flex items-center gap-1"><Users className="w-3 h-3" />Nhân viên</p><p className="text-2xl font-bold text-white">{stats.totalUsers}</p></CardContent></Card>
                        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600"><CardContent className="p-4"><p className="text-purple-100 text-xs flex items-center gap-1"><Briefcase className="w-3 h-3" />Phòng ban</p><p className="text-2xl font-bold text-white">{stats.totalDepartments}</p></CardContent></Card>
                    </div>

                    {/* Completion bar */}
                    <Card className="border border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" />Tỷ lệ hoàn thành Tasks</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all" style={{ width: `${stats.completionRate}%` }} />
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completionRate}%</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg font-bold text-slate-600">{stats.todoTasks}</p><p className="text-[10px] text-slate-400">Chờ làm</p></div>
                                <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10"><p className="text-lg font-bold text-blue-600">{stats.inProgressTasks}</p><p className="text-[10px] text-slate-400">Đang làm</p></div>
                                <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10"><p className="text-lg font-bold text-purple-600">{stats.inReviewTasks}</p><p className="text-[10px] text-slate-400">Chờ duyệt</p></div>
                                <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10"><p className="text-lg font-bold text-emerald-600">{stats.completedTasks}</p><p className="text-[10px] text-slate-400">Hoàn thành</p></div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Tasks Tab */}
            {tab === "tasks" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Priority breakdown */}
                    <Card className="border border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-sm">Phân bố theo mức ưu tiên</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {taskStats.map(p => {
                                    const pct = stats.totalTasks > 0 ? (p.count / stats.totalTasks) * 100 : 0;
                                    return (
                                        <div key={p.priority} className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500 w-10">{PRIORITY_LABELS[p.priority]}</span>
                                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${PRIORITY_COLORS[p.priority]}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white w-8 text-right">{p.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                    {/* Status distribution */}
                    <Card className="border border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-sm">Phân bố trạng thái</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Chờ làm", count: stats.todoTasks, color: "bg-slate-400" },
                                    { label: "Đang làm", count: stats.inProgressTasks, color: "bg-blue-500" },
                                    { label: "Chờ duyệt", count: stats.inReviewTasks, color: "bg-purple-500" },
                                    { label: "Hoàn thành", count: stats.completedTasks, color: "bg-emerald-500" },
                                ].map(s => (
                                    <div key={s.label} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <span className={`w-3 h-3 rounded-full ${s.color}`} />
                                        <div><p className="text-lg font-bold text-slate-900 dark:text-white">{s.count}</p><p className="text-[10px] text-slate-400">{s.label}</p></div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Team Tab */}
            {tab === "team" && (
                <Card className="border border-slate-200 dark:border-slate-800">
                    <CardHeader><CardTitle className="text-sm">Hiệu suất nhân viên</CardTitle></CardHeader>
                    <CardContent>
                        {teamStats.length === 0 ? (
                            <p className="text-sm text-slate-500 py-8 text-center">Chưa có dữ liệu</p>
                        ) : (
                            <div className="space-y-2">
                                {teamStats.map((u, i) => {
                                    const pct = u.totalTasks > 0 ? Math.round((u.completed / u.totalTasks) * 100) : 0;
                                    return (
                                        <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">{u.name?.charAt(0)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{pct}%</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{u.completed}/{u.totalTasks}</p>
                                                <p className="text-[10px] text-slate-400">hoàn thành</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Timesheets Tab */}
            {tab === "timesheets" && (
                <Card className="border border-slate-200 dark:border-slate-800">
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" />Giờ làm 7 ngày qua</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-3 h-32">
                            {timesheetData.map(d => {
                                const maxH = Math.max(...timesheetData.map(x => x.hours), 1);
                                const h = (d.hours / maxH) * 100;
                                const isToday = d.date === new Date().toISOString().slice(0, 10);
                                return (
                                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">{d.hours > 0 ? `${d.hours}h` : ""}</span>
                                        <div className={`w-full rounded-t-lg transition-all ${isToday ? "bg-indigo-500" : "bg-blue-400"}`} style={{ height: `${Math.max(h, 4)}px` }} />
                                        <span className={`text-[9px] ${isToday ? "text-indigo-600 font-bold" : "text-slate-400"}`}>{new Date(d.date).toLocaleDateString("vi-VN", { weekday: "short" })}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-slate-400">
                            <span>Tổng: {timesheetData.reduce((s, d) => s + d.hours, 0)}h</span>
                            <span>TB: {Math.round(timesheetData.reduce((s, d) => s + d.hours, 0) / 7 * 10) / 10}h/ngày</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
