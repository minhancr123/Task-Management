"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useProjects } from "@/hooks/use-projects";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Plus,
    FolderKanban,
    Calendar,
    Users,
    MoreHorizontal,
    Search,
} from "lucide-react";
import { Project } from "@/lib/types/database";

export default function ProjectsPage() {
    const { user } = useAuth();
    const { canManageProjects } = usePermissions();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newProject, setNewProject] = useState({ name: "", description: "", priority: "medium", start_date: "", end_date: "" });
    const queryClient = useQueryClient();

    // Use React Query
    const { data: projects = [], isLoading: loading } = useProjects();

    const handleCreateProject = async () => {
        if (!user || !newProject.name.trim()) return;
        try {
            const { error } = await supabase.from("projects").insert({
                name: newProject.name,
                description: newProject.description || null,
                priority: newProject.priority,
                start_date: newProject.start_date || null,
                end_date: newProject.end_date || null,
                created_by: user.id,
                status: "planning",
            });
            if (error) throw error;
            setShowCreateDialog(false);
            setNewProject({ name: "", description: "", priority: "medium", start_date: "", end_date: "" });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        } catch (err) {
            console.error("Error creating project:", err);
        }
    };

    const filteredProjects = projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            planning: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        };
        return styles[status] || styles.planning;
    };

    const getPriorityStyle = (priority: string) => {
        const styles: Record<string, string> = {
            low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
            high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
            critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        };
        return styles[priority] || styles.medium;
    };

    const statusLabel: Record<string, string> = {
        planning: "Lên kế hoạch",
        active: "Đang thực hiện",
        on_hold: "Tạm dừng",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dự án</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Quản lý và theo dõi tiến độ các dự án
                    </p>
                </div>
                {canManageProjects && (
                    <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo dự án
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm dự án..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
            </div>

            {/* Create Dialog */}
            {showCreateDialog && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tạo dự án mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên dự án *</label>
                            <input
                                type="text"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"
                                placeholder="Nhập tên dự án"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
                            <textarea
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"
                                placeholder="Mô tả dự án"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Độ ưu tiên</label>
                                <select
                                    value={newProject.priority}
                                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"
                                >
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                    <option value="critical">Khẩn cấp</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    value={newProject.start_date}
                                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày kết thúc</label>
                                <input
                                    type="date"
                                    value={newProject.end_date}
                                    onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
                            <Button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white">Tạo dự án</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Projects Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-5 space-y-3">
                                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                                <div className="flex gap-2">
                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {search ? "Không tìm thấy dự án" : "Chưa có dự án nào"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {search ? "Thử tìm kiếm với từ khóa khác" : "Tạo dự án đầu tiên để bắt đầu"}
                        </p>
                        {canManageProjects && !search && (
                            <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo dự án
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <Card
                            key={project.id}
                            className="hover:shadow-md transition-shadow cursor-pointer group border border-slate-200 dark:border-slate-800"
                            onClick={() => router.push(`/projects/${project.id}`)}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                        {project.name}
                                    </h3>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusStyle(project.status)}`}>
                                        {statusLabel[project.status] || project.status}
                                    </span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getPriorityStyle(project.priority)}`}>
                                        {project.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    {project.start_date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.start_date).toLocaleDateString("vi-VN")}
                                        </span>
                                    )}
                                    {project.end_date && (
                                        <span>→ {new Date(project.end_date).toLocaleDateString("vi-VN")}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
