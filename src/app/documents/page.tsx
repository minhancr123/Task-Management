"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
    Plus, FileText, Search, Download, Trash2, File, Image,
    FileSpreadsheet, FileCode, FolderKanban, Building2, Filter
} from "lucide-react";
import { Document, Project, Department } from "@/lib/types/database";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const FILE_ICONS: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
    doc: { icon: FileText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
    docx: { icon: FileText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
    xls: { icon: FileSpreadsheet, color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
    xlsx: { icon: FileSpreadsheet, color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
    csv: { icon: FileSpreadsheet, color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
    png: { icon: Image, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
    jpg: { icon: Image, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
    jpeg: { icon: Image, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
    js: { icon: FileCode, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" },
    ts: { icon: FileCode, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
    default: { icon: File, color: "text-slate-500 bg-slate-50 dark:bg-slate-800" },
};

const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return FILE_ICONS[ext] || FILE_ICONS.default;
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

export default function DocumentsPage() {
    const { user } = useAuth();
    const { isManager, isAdmin } = usePermissions();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [search, setSearch] = useState("");
    const [filterProject, setFilterProject] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [docToDelete, setDocToDelete] = useState<string | null>(null);

    const [form, setForm] = useState({ title: "", description: "", project_id: "", department_id: "", file_url: "", file_name: "", file_size: 0, file_type: "", tags: "" });

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase.from("documents")
                .select("*, uploader:profiles(*), project:projects(*)")
                .order("created_at", { ascending: false });

            if (filterProject) query = query.eq("project_id", filterProject);
            if (filterDept) query = query.eq("department_id", filterDept);

            const { data, error } = await query;
            if (error) throw error;
            setDocuments((data || []) as Document[]);
        } catch { /* */ } finally { setLoading(false); }
    }, [filterProject, filterDept]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
    useEffect(() => {
        supabase.from("projects").select("*").order("name").then(({ data }) => setProjects((data || []) as Project[]));
        supabase.from("departments").select("*").order("name").then(({ data }) => setDepartments((data || []) as Department[]));
    }, []);

    const handleUpload = async () => {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        if (!user || !form.title.trim() || !file) {
            toast.error("Vui lòng nhập tiêu đề và chọn file");
            return;
        }

        try {
            setLoading(true);

            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 3. Save metadata to Database
            const { error: dbError } = await supabase.from("documents").insert({
                title: form.title,
                description: form.description || null,
                project_id: form.project_id || null,
                department_id: form.department_id || null,
                uploaded_by: user.id,
                file_url: publicUrl,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
            });

            if (dbError) throw dbError;

            toast.success("Đã tải lên tài liệu thành công!");
            setShowUpload(false);
            setForm({ title: "", description: "", project_id: "", department_id: "", file_url: "", file_name: "", file_size: 0, file_type: "", tags: "" });
            fetchDocuments();
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Lỗi khi tải lên file");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!docToDelete) return;
        try {
            await supabase.from("documents").delete().eq("id", docToDelete);
            toast.success("Đã xóa");
            setDocToDelete(null);
            fetchDocuments();
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (n: string | null) => n?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    const filtered = documents.filter(d =>
        (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tài liệu</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý tài liệu dự án và phòng ban</p>
                </div>
                <Button onClick={() => setShowUpload(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Tải lên
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600"><CardContent className="p-4"><p className="text-blue-100 text-xs">Tổng tài liệu</p><p className="text-2xl font-bold text-white">{documents.length}</p></CardContent></Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600"><CardContent className="p-4"><p className="text-purple-100 text-xs">Tổng dung lượng</p><p className="text-2xl font-bold text-white">{formatFileSize(documents.reduce((s, d) => s + (d.file_size || 0), 0))}</p></CardContent></Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600"><CardContent className="p-4"><p className="text-emerald-100 text-xs">Người đóng góp</p><p className="text-2xl font-bold text-white">{new Set(documents.map(d => d.uploaded_by)).size}</p></CardContent></Card>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tài liệu..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                </div>
                <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="">Tất cả dự án</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="">Tất cả phòng ban</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Tải lên tài liệu</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Tiêu đề *</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">File *</label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                        </div>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="">Dự án (tùy chọn)</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="">Phòng ban (tùy chọn)</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (phân cách ,)" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowUpload(false)}>Hủy</Button>
                            <Button onClick={handleUpload} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {loading ? "Đang tải lên..." : "Lưu"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Document List */}
            <div className="space-y-2">
                {loading ? [1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></CardContent></Card>) :
                    filtered.length === 0 ?
                        <Card><CardContent className="flex flex-col items-center py-12"><FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chưa có tài liệu</h3></CardContent></Card> :
                        filtered.map(doc => {
                            const fi = getFileIcon(doc.file_name);
                            const Icon = fi.icon;
                            return (
                                <Card key={doc.id} className="border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${fi.color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.title}</span>
                                                {doc.version > 1 && <span className="text-[10px] text-indigo-600 font-medium">v{doc.version}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span>{doc.file_name}</span>
                                                <span>·</span>
                                                <span>{formatFileSize(doc.file_size)}</span>
                                                {doc.project && <span className="flex items-center gap-0.5"><FolderKanban className="w-3 h-3" />{doc.project.name}</span>}
                                            </div>
                                            {doc.tags && doc.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {doc.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">{tag}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {doc.uploader && (
                                                <Avatar className="h-6 w-6"><AvatarFallback className="bg-indigo-500 text-white text-[8px]">{getInitials(doc.uploader.full_name)}</AvatarFallback></Avatar>
                                            )}
                                            <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString("vi-VN")}</span>
                                            <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Tải xuống">
                                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                            </a>
                                            {(doc.uploaded_by === user?.id || isAdmin) && (
                                                <button onClick={() => setDocToDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Xóa">
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                }
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={!!docToDelete}
                onOpenChange={(open) => !open && setDocToDelete(null)}
                title="Xóa tài liệu"
                description="Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác."
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}
