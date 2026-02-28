"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
    Plus, Building2, Users, Search, Edit2, Trash2, UserPlus,
    ChevronRight, MoreHorizontal, X, Check, Crown
} from "lucide-react";
import { Department, DepartmentMember, Profile } from "@/lib/types/database";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDepartments, useDepartmentMembers, DeptWithMembers } from "@/hooks/use-departments";
import { useQueryClient } from "@tanstack/react-query";



export default function DepartmentsPage() {
    const { user } = useAuth();
    const { canManageDepartments, isAdmin } = usePermissions();
    const queryClient = useQueryClient();

    // React Query for Departments
    const { data: departments = [], isLoading: loading } = useDepartments();

    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [search, setSearch] = useState("");

    // Dialog states
    const [showCreate, setShowCreate] = useState(false);
    const [editingDept, setEditingDept] = useState<DeptWithMembers | null>(null);
    const [viewingDept, setViewingDept] = useState<DeptWithMembers | null>(null);
    const [showAddMember, setShowAddMember] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState<DeptWithMembers | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<{ id: string, userId: string } | null>(null);

    // React Query for Members of Viewing Dept
    const { data: deptMembers = [] } = useDepartmentMembers(viewingDept?.id);

    // Form state
    const [form, setForm] = useState({ name: "", description: "", head_id: "" });

    const fetchUsers = useCallback(async () => {
        const { data } = await supabase.from("profiles").select("*").order("full_name");
        setAllUsers((data || []) as Profile[]);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        try {
            const { error } = await supabase.from("departments").insert({
                name: form.name,
                description: form.description || null,
                head_id: form.head_id || null,
            });
            if (error) throw error;
            toast.success("Tạo phòng ban thành công!");
            setShowCreate(false);
            resetForm();

        } catch (err: any) {
            toast.error(err.message || "Lỗi khi tạo phòng ban");
        }
    };

    const handleUpdate = async () => {
        if (!editingDept || !form.name.trim()) return;
        try {
            const { error } = await supabase
                .from("departments")
                .update({
                    name: form.name,
                    description: form.description || null,
                    head_id: form.head_id || null,
                })
                .eq("id", editingDept.id);
            if (error) throw error;
            toast.success("Cập nhật phòng ban thành công!");
            setEditingDept(null);
            resetForm();

        } catch (err: any) {
            toast.error(err.message || "Lỗi");
        }
    };

    const handleDelete = async () => {
        if (!deptToDelete) return;
        try {
            // Remove members first
            await supabase.from("department_members").delete().eq("department_id", deptToDelete.id);
            const { error } = await supabase.from("departments").delete().eq("id", deptToDelete.id);
            if (error) throw error;
            toast.success("Đã xóa phòng ban");
            if (viewingDept?.id === deptToDelete.id) setViewingDept(null);
            setDeptToDelete(null);

        } catch (err: any) {
            toast.error(err.message || "Lỗi");
        }
    };

    const handleAddMember = async (userId: string, role: string) => {
        if (!viewingDept) return;
        try {
            const { error } = await supabase.from("department_members").insert({
                department_id: viewingDept.id,
                user_id: userId,
                role: role,
            });
            if (error) throw error;
            // Also update user profile department_id
            await supabase.from("profiles").update({ department_id: viewingDept.id }).eq("id", userId);
            toast.success("Đã thêm thành viên");
            setShowAddMember(false);
            openDeptDetail(viewingDept);

        } catch (err: any) {
            toast.error(err.message || "Lỗi");
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToDelete) return;
        try {
            await supabase.from("department_members").delete().eq("id", memberToDelete.id);
            await supabase.from("profiles").update({ department_id: null }).eq("id", memberToDelete.userId);
            toast.success("Đã xóa thành viên");
            setMemberToDelete(null);
            if (viewingDept) openDeptDetail(viewingDept);

        } catch (err: any) {
            toast.error(err.message || "Lỗi");
        }
    };

    const openDeptDetail = async (dept: DeptWithMembers) => {
        setViewingDept(dept);
    };

    const startEdit = (dept: DeptWithMembers) => {
        setForm({ name: dept.name, description: dept.description || "", head_id: dept.head_id || "" });
        setEditingDept(dept);
    };

    const resetForm = () => setForm({ name: "", description: "", head_id: "" });

    const filtered = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

    const getInitials = (name: string | null) =>
        name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

    const getRoleBadge = (role: string) => {
        const map: Record<string, { label: string; color: string }> = {
            head: { label: "Trưởng phòng", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
            deputy: { label: "Phó phòng", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
            member: { label: "Thành viên", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
        };
        return map[role] || map.member;
    };

    // ===== Department Detail Panel =====
    if (viewingDept) {
        const existingMemberIds = viewingDept.members?.map((m) => m.user_id) || [];
        const availableUsers = allUsers.filter((u) => !existingMemberIds.includes(u.id));

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setViewingDept(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingDept.name}</h1>
                        {viewingDept.description && <p className="text-sm text-slate-500 dark:text-slate-400">{viewingDept.description}</p>}
                    </div>
                    {canManageDepartments && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEdit(viewingDept)}>
                                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Sửa
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeptToDelete(viewingDept)}>
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa
                            </Button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600">
                        <CardContent className="p-4"><p className="text-indigo-100 text-xs">Thành viên</p><p className="text-2xl font-bold text-white mt-1">{viewingDept.members?.length || 0}</p></CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600">
                        <CardContent className="p-4"><p className="text-purple-100 text-xs">Trưởng phòng</p><p className="text-sm font-bold text-white mt-1 truncate">{viewingDept.members?.find(m => m.role === "head")?.user?.full_name || "Chưa có"}</p></CardContent>
                    </Card>
                </div>

                {/* Members List */}
                <Card className="border border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Thành viên phòng ban</CardTitle>
                            {canManageDepartments && (
                                <Button size="sm" onClick={() => setShowAddMember(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Thêm
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Add Member Dialog */}
                        {showAddMember && (
                            <div className="mb-4 p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Thêm thành viên mới</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {availableUsers.length === 0 ? (
                                        <p className="text-sm text-slate-500 py-3 text-center">Không còn người dùng nào để thêm</p>
                                    ) : (
                                        availableUsers.map((u) => (
                                            <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-bold">{getInitials(u.full_name)}</AvatarFallback></Avatar>
                                                    <span className="text-sm text-slate-900 dark:text-white">{u.full_name || u.email}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleAddMember(u.id, "member")} className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">Thành viên</button>
                                                    <button onClick={() => handleAddMember(u.id, "head")} className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">Trưởng phòng</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setShowAddMember(false)}>Đóng</Button>
                                </div>
                            </div>
                        )}

                        {!viewingDept.members?.length ? (
                            <div className="flex flex-col items-center py-8">
                                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="text-sm text-slate-500">Chưa có thành viên nào</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {viewingDept.members.map((m) => {
                                    const rb = getRoleBadge(m.role);
                                    return (
                                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                                    {getInitials(m.user?.full_name || null)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.user?.full_name || "N/A"}</p>
                                                <p className="text-xs text-slate-400 truncate">{m.user?.email}</p>
                                            </div>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${rb.color}`}>{rb.label}</span>
                                            {canManageDepartments && (
                                                <button
                                                    onClick={() => setMemberToDelete({ id: m.id, userId: m.user_id })}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-opacity"
                                                >
                                                    <X className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ===== Department List View =====
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Phòng ban</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý cơ cấu tổ chức — {departments.length} phòng ban</p>
                </div>
                {canManageDepartments && (
                    <Button onClick={() => { resetForm(); setShowCreate(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Tạo phòng ban
                    </Button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Tìm kiếm phòng ban..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>

            {/* Create/Edit Dialog */}
            {(showCreate || editingDept) && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{editingDept ? "Sửa phòng ban" : "Tạo phòng ban mới"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên phòng ban *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" placeholder="VD: Phòng Kỹ thuật" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" placeholder="Mô tả phòng ban..." rows={2} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trưởng phòng</label>
                            <select value={form.head_id} onChange={(e) => setForm({ ...form, head_id: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="">-- Chưa chọn --</option>
                                {allUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingDept(null); resetForm(); }}>Hủy</Button>
                            <Button onClick={editingDept ? handleUpdate : handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {editingDept ? "Cập nhật" : "Tạo phòng ban"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-5 space-y-3"><div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" /><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" /><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /></CardContent></Card>)}
                </div>
            ) : filtered.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-12">
                    <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{search ? "Không tìm thấy" : "Chưa có phòng ban"}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{search ? "Thử từ khóa khác" : "Tạo phòng ban đầu tiên"}</p>
                </CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((dept) => (
                        <Card key={dept.id} className="hover:shadow-md transition-all cursor-pointer group border border-slate-200 dark:border-slate-800"
                            onClick={() => openDeptDetail(dept)}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{dept.name}</h3>
                                            {dept.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{dept.description}</p>}
                                        </div>
                                    </div>
                                    {canManageDepartments && (
                                        <button onClick={(e) => { e.stopPropagation(); startEdit(dept); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity">
                                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {dept._memberCount || 0} người</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            {/* Confirm Dialogs */}
            <ConfirmDialog
                open={!!deptToDelete}
                onOpenChange={(open) => !open && setDeptToDelete(null)}
                title="Xóa phòng ban"
                description={`Bạn có chắc muốn xóa phòng ban "${deptToDelete?.name}"? Tất cả thành viên sẽ bị xóa khỏi phòng ban này.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
            />
            <ConfirmDialog
                open={!!memberToDelete}
                onOpenChange={(open) => !open && setMemberToDelete(null)}
                title="Xóa thành viên"
                description="Bạn có chắc muốn xóa thành viên này khỏi phòng ban?"
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleRemoveMember}
            />
        </div>
    );
}
