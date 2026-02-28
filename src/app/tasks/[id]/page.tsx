"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
    ChevronRight, Calendar, Clock, Edit2, Trash2, Plus,
    CheckCircle2, Circle, MessageSquare, Activity, User,
    FolderKanban, Send, ListTodo
} from "lucide-react";
import { Task, TaskComment, Profile } from "@/lib/types/database";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createNotification } from "@/lib/notifications";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    todo: { label: "Chờ làm", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    in_progress: { label: "Đang làm", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    in_review: { label: "Chờ duyệt", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    completed: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bar: string }> = {
    low: { label: "Thấp", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", bar: "bg-green-500" },
    medium: { label: "Trung bình", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", bar: "bg-yellow-500" },
    high: { label: "Cao", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", bar: "bg-orange-500" },
    critical: { label: "Khẩn cấp", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", bar: "bg-red-500" },
};

type Tab = "details" | "subtasks" | "comments" | "activity";

export default function TaskDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { canAssignTasks, isManager } = usePermissions();

    const [task, setTask] = useState<Task | null>(null);
    const [subtasks, setSubtasks] = useState<Task[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("details");

    // Forms
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", status: "todo", priority: "medium", assigned_to: "", due_date: "", estimated_hours: "" });
    const [newSubtask, setNewSubtask] = useState("");
    const [newComment, setNewComment] = useState("");
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchTask = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("tasks")
                .select("*, assignee:profiles!tasks_assigned_to_fkey(*), creator:profiles!tasks_created_by_fkey(*), project:projects(*)")
                .eq("id", id).single();
            if (error) throw error;
            const t = data as Task;
            setTask(t);
            setEditForm({
                title: t.title, description: t.description || "", status: t.status,
                priority: t.priority, assigned_to: t.assigned_to || "",
                due_date: t.due_date || "", estimated_hours: t.estimated_hours?.toString() || "",
            });
        } catch { router.push("/tasks"); } finally { setLoading(false); }
    }, [id, router]);

    const fetchSubtasks = useCallback(async () => {
        const { data } = await supabase.from("tasks")
            .select("*, assignee:profiles!tasks_assigned_to_fkey(*)")
            .eq("parent_task_id", id).order("order_index");
        setSubtasks((data || []) as Task[]);
    }, [id]);

    const fetchComments = useCallback(async () => {
        const { data } = await supabase.from("task_comments")
            .select("*, user:profiles(*)").eq("task_id", id).order("created_at", { ascending: true });
        setComments((data || []) as TaskComment[]);
    }, [id]);

    useEffect(() => { fetchTask(); fetchSubtasks(); fetchComments(); }, [fetchTask, fetchSubtasks, fetchComments]);
    useEffect(() => {
        supabase.from("profiles").select("*").order("full_name").then(({ data }) => setAllUsers((data || []) as Profile[]));
    }, []);

    // === Handlers ===
    const handleUpdate = async () => {
        if (!editForm.title.trim()) return;
        try {
            const { error } = await supabase.from("tasks").update({
                title: editForm.title, description: editForm.description || null,
                status: editForm.status, priority: editForm.priority,
                assigned_to: editForm.assigned_to || null, due_date: editForm.due_date || null,
                estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : null,
            }).eq("id", id);

            if (error) throw error;

            // Notification: Assignment Change
            if (editForm.assigned_to && editForm.assigned_to !== task?.assigned_to) {
                await createNotification({
                    userId: editForm.assigned_to,
                    title: "Công việc mới",
                    message: `${user?.user_metadata?.full_name || user?.email} đã phân công công việc "${editForm.title}" cho bạn.`,
                    type: "task_assigned",
                    entityType: "tasks",
                    entityId: id,
                    senderId: user?.id
                });
            }

            toast.success("Cập nhật thành công!");
            setShowEdit(false);
            fetchTask();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await supabase.from("tasks").update({ status: newStatus }).eq("id", id);

            // Notification: Status Change
            if (task) {
                const recipients = new Set<string>();
                if (task.assigned_to && task.assigned_to !== user?.id) recipients.add(task.assigned_to);
                if (task.created_by && task.created_by !== user?.id) recipients.add(task.created_by);

                for (const recipientId of recipients) {
                    await createNotification({
                        userId: recipientId,
                        title: "Cập nhật trạng thái",
                        message: `Công việc "${task.title}" đã chuyển sang trạng thái "${STATUS_MAP[newStatus]?.label}".`,
                        type: "task_updated",
                        entityType: "tasks",
                        entityId: id,
                        senderId: user?.id
                    });
                }
            }

            fetchTask();
            toast.success("Đã cập nhật trạng thái");
        } catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async () => {
        try {
            await supabase.from("task_comments").delete().eq("task_id", id);
            await supabase.from("tasks").delete().eq("parent_task_id", id);
            const { error } = await supabase.from("tasks").delete().eq("id", id);
            if (error) throw error;
            toast.success("Đã xóa");
            router.push("/tasks");
        } catch (err: any) { toast.error(err.message); }
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim() || !user) return;
        try {
            const { error } = await supabase.from("tasks").insert({
                title: newSubtask, parent_task_id: id, project_id: task?.project_id || null,
                created_by: user.id, status: "todo", priority: "medium", tags: [], order_index: subtasks.length,
            });
            if (error) throw error;
            toast.success("Đã thêm subtask!");
            setNewSubtask("");
            setShowAddSubtask(false);
            fetchSubtasks();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleToggleSubtask = async (st: Task) => {
        try {
            await supabase.from("tasks").update({ status: st.status === "completed" ? "todo" : "completed" }).eq("id", st.id);
            fetchSubtasks();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return;
        try {
            const { error } = await supabase.from("task_comments").insert({
                task_id: id, user_id: user.id, content: newComment,
            });
            if (error) throw error;

            // Notification: New Comment
            if (task) {
                const recipients = new Set<string>();
                if (task.assigned_to && task.assigned_to !== user.id) recipients.add(task.assigned_to);
                if (task.created_by && task.created_by !== user.id) recipients.add(task.created_by);

                for (const recipientId of recipients) {
                    await createNotification({
                        userId: recipientId,
                        title: "Bình luận mới",
                        message: `${user.user_metadata?.full_name || user.email} đã bình luận trong công việc "${task.title}".`,
                        type: "comment_added",
                        entityType: "tasks",
                        entityId: id,
                        senderId: user.id
                    });
                }
            }

            setNewComment("");
            fetchComments();
        } catch (err: any) { toast.error(err.message); }
    };


    const handleDeleteComment = async (commentId: string) => {
        try {
            await supabase.from("task_comments").delete().eq("id", commentId);
            fetchComments();
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (n: string | null) => n?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "vừa xong";
        if (mins < 60) return `${mins} phút trước`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} giờ trước`;
        return `${Math.floor(hrs / 24)} ngày trước`;
    };

    if (loading || !task) {
        return <div className="space-y-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" /><div className="h-60 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></div>;
    }

    const st = STATUS_MAP[task.status] || STATUS_MAP.todo;
    const pr = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
    const completedSubtasks = subtasks.filter((s) => s.status === "completed").length;

    const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
        { key: "details", label: "Chi tiết", icon: Activity },
        { key: "subtasks", label: "Subtasks", icon: ListTodo, count: subtasks.length },
        { key: "comments", label: "Bình luận", icon: MessageSquare, count: comments.length },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3">
                <button onClick={() => router.push("/tasks")} className="mt-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{task.title}</h1>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pr.color}`}>{pr.label}</span>
                    </div>
                    {task.project && <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><FolderKanban className="w-3 h-3" />{task.project.name}</p>}
                </div>
                {canAssignTasks && (
                    <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}><Edit2 className="w-3.5 h-3.5 mr-1" />Sửa</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                )}
            </div>

            {/* Status quick change */}
            <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <button key={key} onClick={() => handleStatusChange(key)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${task.status === key ? `${val.color} ring-2 ring-indigo-500 ring-offset-1` : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                        {val.label}
                    </button>
                ))}
            </div>

            {/* Edit Dialog */}
            {showEdit && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Chỉnh sửa công việc</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="todo">Chờ làm</option><option value="in_progress">Đang làm</option><option value="in_review">Chờ duyệt</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option>
                            </select>
                            <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="low">Thấp</option><option value="medium">TB</option><option value="high">Cao</option><option value="critical">Khẩn</option>
                            </select>
                            <select value={editForm.assigned_to} onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="">Chưa gán</option>{allUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                            </select>
                            <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEdit(false)}>Hủy</Button>
                            <Button onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700 text-white">Lưu</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === t.key ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                        <t.icon className="w-4 h-4" />{t.label} {t.count !== undefined && <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{t.count}</span>}
                    </button>
                ))}
            </div>

            {/* Tab: Details */}
            {tab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border border-slate-200 dark:border-slate-800">
                            <CardHeader><CardTitle className="text-base">Mô tả</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.description || "Chưa có mô tả"}</p>
                            </CardContent>
                        </Card>
                        {subtasks.length > 0 && (
                            <Card className="border border-slate-200 dark:border-slate-800">
                                <CardHeader><CardTitle className="text-base">Subtasks ({completedSubtasks}/{subtasks.length})</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%` }} />
                                    </div>
                                    <div className="space-y-1">
                                        {subtasks.slice(0, 5).map((st) => (
                                            <div key={st.id} className="flex items-center gap-2 py-1">
                                                {st.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                                                <span className={`text-sm ${st.status === "completed" ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>{st.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <div className="space-y-4">
                        <Card className="border border-slate-200 dark:border-slate-800">
                            <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Ưu tiên</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pr.color}`}>{pr.label}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Hạn</span><span className="text-slate-900 dark:text-white">{task.due_date ? new Date(task.due_date).toLocaleDateString("vi-VN") : "—"}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Giờ ước tính</span><span className="text-slate-900 dark:text-white">{task.estimated_hours ? `${task.estimated_hours}h` : "—"}</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Người giao</span>
                                    {task.creator ? <div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="bg-slate-500 text-white text-[8px]">{getInitials(task.creator.full_name)}</AvatarFallback></Avatar><span className="text-xs">{task.creator.full_name}</span></div> : <span>—</span>}
                                </div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Người nhận</span>
                                    {task.assignee ? <div className="flex items-center gap-1.5"><Avatar className="h-5 w-5"><AvatarFallback className="bg-indigo-500 text-white text-[8px]">{getInitials(task.assignee.full_name)}</AvatarFallback></Avatar><span className="text-xs">{task.assignee.full_name}</span></div> : <span>—</span>}
                                </div>
                                <div className="flex justify-between"><span className="text-slate-500">Tạo lúc</span><span className="text-xs text-slate-400">{timeAgo(task.created_at)}</span></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Tab: Subtasks */}
            {tab === "subtasks" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{completedSubtasks}/{subtasks.length} hoàn thành</span>
                            {subtasks.length > 0 && (
                                <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }} />
                                </div>
                            )}
                        </div>
                        <Button size="sm" onClick={() => setShowAddSubtask(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-3.5 h-3.5 mr-1" /> Thêm subtask
                        </Button>
                    </div>
                    {showAddSubtask && (
                        <div className="flex gap-2">
                            <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Tên subtask..." onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            <Button size="sm" onClick={handleAddSubtask} className="bg-indigo-600 hover:bg-indigo-700 text-white">Thêm</Button>
                            <Button size="sm" variant="outline" onClick={() => { setShowAddSubtask(false); setNewSubtask(""); }}>Hủy</Button>
                        </div>
                    )}
                    {subtasks.length === 0 ? (
                        <Card><CardContent className="flex flex-col items-center py-10"><ListTodo className="w-10 h-10 text-slate-300 mb-3" /><p className="text-sm text-slate-500">Chưa có subtask</p></CardContent></Card>
                    ) : (
                        <div className="space-y-1">
                            {subtasks.map((st) => (
                                <div key={st.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                    <button onClick={() => handleToggleSubtask(st)} className="flex-shrink-0">
                                        {st.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-400" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${st.status === "completed" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>{st.title}</span>
                                    {st.assignee && <Avatar className="h-6 w-6"><AvatarFallback className="bg-indigo-500 text-white text-[9px]">{getInitials(st.assignee.full_name)}</AvatarFallback></Avatar>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Comments */}
            {tab === "comments" && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-indigo-500 text-white text-xs">{getInitials(user?.user_metadata?.full_name || null)}</AvatarFallback></Avatar>
                        <div className="flex-1 flex gap-2">
                            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Viết bình luận..."
                                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    {comments.length === 0 ? (
                        <Card><CardContent className="flex flex-col items-center py-10"><MessageSquare className="w-10 h-10 text-slate-300 mb-3" /><p className="text-sm text-slate-500">Chưa có bình luận</p></CardContent></Card>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-3 group">
                                    <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">{getInitials(c.user?.full_name || null)}</AvatarFallback></Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{c.user?.full_name || "N/A"}</span>
                                            <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                                            {c.user_id === user?.id && (
                                                <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Xóa công việc"
                description="Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác."
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}
