"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
    Bell, BellOff, CheckCircle2, Info, AlertTriangle, XCircle,
    CheckCheck, Trash2, MessageSquare, FolderKanban, CheckSquare, Users
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useNotifications } from "@/hooks/use-notifications";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
    info: { icon: Info, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    success: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
    warning: { icon: AlertTriangle, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
    error: { icon: XCircle, color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
    task: { icon: CheckSquare, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
    task_assigned: { icon: CheckSquare, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
    project: { icon: FolderKanban, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" },
    team: { icon: Users, color: "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" },
    message: { icon: MessageSquare, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400" },
};

const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString("vi-VN");
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // React Query
    const { data: allNotifications = [], isLoading: loading } = useNotifications();

    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
    const [showDeleteReadConfirm, setShowDeleteReadConfirm] = useState(false);

    // Derived state
    const notifications = allNotifications.filter(n => {
        if (filter === "unread") return !n.is_read;
        if (filter === "read") return n.is_read;
        return true;
    });

    const markAsRead = async (id: string) => {
        try {
            await supabase.from("notifications").update({ is_read: true }).eq("id", id);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } catch (err: any) { toast.error(err.message); }
    };

    const markAllRead = async () => {
        if (!user) return;
        try {
            await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Đã đọc tất cả");
        } catch (err: any) { toast.error(err.message); }
    };

    const deleteNotification = async (id: string) => {
        try {
            await supabase.from("notifications").delete().eq("id", id);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } catch (err: any) { toast.error(err.message); }
    };

    const deleteAllRead = async () => {
        if (!user) return;
        try {
            await supabase.from("notifications").delete().eq("user_id", user.id).eq("is_read", true);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Đã xóa thông báo đã đọc");
        } catch (err: any) { toast.error(err.message); }
    };

    const unreadCount = allNotifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-500" />
                        Thông báo
                        {unreadCount > 0 && <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-red-500 text-white">{unreadCount}</span>}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tất cả thông báo của bạn — mỗi người dùng chỉ xem thông báo liên quan đến mình
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0} className="text-xs"><CheckCheck className="w-3.5 h-3.5 mr-1" />Đọc tất cả</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteReadConfirm(true)} className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5 mr-1" />Xóa đã đọc</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 stagger-children">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-blue-500 hover-lift"><CardContent className="p-4"><p className="text-indigo-100 text-xs">Tổng</p><p className="text-2xl font-bold text-white">{allNotifications.length}</p></CardContent></Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-600 to-rose-500 hover-lift"><CardContent className="p-4"><p className="text-red-100 text-xs">Chưa đọc</p><p className="text-2xl font-bold text-white">{unreadCount}</p></CardContent></Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-600 to-teal-500 hover-lift"><CardContent className="p-4"><p className="text-emerald-100 text-xs">Đã đọc</p><p className="text-2xl font-bold text-white">{allNotifications.length - unreadCount}</p></CardContent></Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {(["all", "unread", "read"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                        {f === "all" ? "Tất cả" : f === "unread" ? "Chưa đọc" : "Đã đọc"}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-1.5">
                {loading ? [1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                            </div>
                        </CardContent>
                    </Card>
                )) :
                    notifications.length === 0 ? (
                        <Card className="border border-slate-200/60 dark:border-white/[0.06]">
                            <CardContent className="flex flex-col items-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
                                    <BellOff className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Không có thông báo</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Bạn sẽ nhận thông báo khi có công việc mới hoặc cập nhật</p>
                            </CardContent>
                        </Card>
                    ) : (
                        notifications.map(n => {
                            const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                            const Icon = tc.icon;
                            return (
                                <Card key={n.id}
                                    className={`border transition-all duration-200 hover:shadow-sm cursor-pointer group ${!n.is_read
                                        ? "border-indigo-200/60 dark:border-indigo-500/15 bg-indigo-50/40 dark:bg-indigo-900/5"
                                        : "border-slate-200/60 dark:border-white/[0.06]"
                                        }`}
                                    onClick={() => !n.is_read && markAsRead(n.id)}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!n.is_read ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{n.title}</p>
                                            {n.message && <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{n.message}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                                            <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                                            <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )
                }
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={showDeleteReadConfirm}
                onOpenChange={setShowDeleteReadConfirm}
                title="Xóa thông báo đã đọc"
                description="Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc? Hành động này không thể hoàn tác."
                confirmLabel="Xóa hết"
                variant="danger"
                onConfirm={deleteAllRead}
            />
        </div>
    );
}
