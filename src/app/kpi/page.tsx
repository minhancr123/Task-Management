"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Target, TrendingUp, Award, Star, Send, Edit2, Check, Eye } from "lucide-react";
import { KPIReview, Profile } from "@/lib/types/database";
import { toast } from "sonner";

type Tab = "my" | "review" | "team";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: "Nháp", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    submitted: { label: "Đã nộp", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    reviewed: { label: "Đã đánh giá", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

const currentQuarter = () => {
    const now = new Date();
    return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
};

const scoreColor = (score: number | null) => {
    if (!score) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
};

const scoreLabel = (score: number | null) => {
    if (!score) return "—";
    if (score >= 90) return "Xuất sắc";
    if (score >= 80) return "Tốt";
    if (score >= 60) return "Khá";
    if (score >= 40) return "Trung bình";
    return "Cần cải thiện";
};

export default function KpiPage() {
    const { user } = useAuth();
    const { isManager, isAdmin } = usePermissions();
    const [reviews, setReviews] = useState<KPIReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("my");
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({ period: currentQuarter(), goals: "", self_score: "", self_comments: "" });
    const [reviewForm, setReviewForm] = useState({ manager_score: "", manager_comments: "" });

    const fetchReviews = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            let query = supabase.from("kpi_reviews")
                .select("*, user:profiles!kpi_reviews_user_id_fkey(*), reviewer:profiles!kpi_reviews_reviewer_id_fkey(*)")
                .order("created_at", { ascending: false });

            if (tab === "my") query = query.eq("user_id", user.id);
            else if (tab === "review") query = query.eq("status", "submitted");
            // team: show all

            const { data, error } = await query;
            if (error) throw error;
            setReviews((data || []) as KPIReview[]);
        } catch { /* */ } finally { setLoading(false); }
    }, [user, tab]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    // Stats
    const myReviews = useMemo(() => reviews.filter(r => r.user_id === user?.id), [reviews, user?.id]);
    const latestReview = myReviews[0];
    const avgSelfScore = myReviews.length > 0 ? Math.round(myReviews.filter(r => r.self_score).reduce((s, r) => s + (r.self_score || 0), 0) / myReviews.filter(r => r.self_score).length) || 0 : 0;
    const avgManagerScore = myReviews.length > 0 ? Math.round(myReviews.filter(r => r.manager_score).reduce((s, r) => s + (r.manager_score || 0), 0) / myReviews.filter(r => r.manager_score).length) || 0 : 0;
    const pendingReviewCount = tab === "review" ? reviews.length : 0;

    const handleCreate = async () => {
        if (!user || !form.goals.trim()) return;
        try {
            const { error } = await supabase.from("kpi_reviews").insert({
                user_id: user.id, period: form.period, goals: form.goals,
                self_score: form.self_score ? parseInt(form.self_score) : null,
                self_comments: form.self_comments || null,
                status: "draft",
            });
            if (error) throw error;
            toast.success("Đã tạo KPI Review!");
            setShowCreate(false);
            setForm({ period: currentQuarter(), goals: "", self_score: "", self_comments: "" });
            fetchReviews();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleSubmit = async (id: string) => {
        try {
            const { error } = await supabase.from("kpi_reviews").update({ status: "submitted" }).eq("id", id);
            if (error) throw error;
            toast.success("Đã nộp KPI Review!");
            fetchReviews();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleManagerReview = async (id: string) => {
        if (!user || !reviewForm.manager_score) return;
        try {
            const { error } = await supabase.from("kpi_reviews").update({
                reviewer_id: user.id,
                manager_score: parseInt(reviewForm.manager_score),
                manager_comments: reviewForm.manager_comments || null,
                status: "reviewed",
            }).eq("id", id);
            if (error) throw error;
            toast.success("Đã đánh giá!");
            setEditingId(null);
            setReviewForm({ manager_score: "", manager_comments: "" });
            fetchReviews();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleUpdateDraft = async (id: string) => {
        try {
            const { error } = await supabase.from("kpi_reviews").update({
                self_score: form.self_score ? parseInt(form.self_score) : null,
                self_comments: form.self_comments || null,
                goals: form.goals,
            }).eq("id", id);
            if (error) throw error;
            toast.success("Đã cập nhật!");
            setEditingId(null);
            fetchReviews();
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (n: string | null) => n?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    const tabs: { key: Tab; label: string; show: boolean }[] = [
        { key: "my", label: "KPI của tôi", show: true },
        { key: "review", label: "Chờ đánh giá", show: isManager },
        { key: "team", label: "Toàn bộ", show: isAdmin },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KPI & Đánh giá</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Đặt mục tiêu, tự đánh giá và nhận đánh giá từ quản lý</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Tạo KPI Review
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.filter(t => t.show).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 rounded-lg text-xs font-medium ${tab === t.key ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>{t.label}</button>
                ))}
            </div>

            {/* Stats */}
            {tab === "my" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600">
                        <CardContent className="p-4">
                            <p className="text-purple-100 text-xs">Tự đánh giá TB</p>
                            <p className="text-2xl font-bold text-white">{avgSelfScore || "—"}</p>
                            <p className="text-purple-200 text-[10px]">{scoreLabel(avgSelfScore)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
                        <CardContent className="p-4">
                            <p className="text-blue-100 text-xs">Đánh giá quản lý TB</p>
                            <p className="text-2xl font-bold text-white">{avgManagerScore || "—"}</p>
                            <p className="text-blue-200 text-[10px]">{scoreLabel(avgManagerScore)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <CardContent className="p-4">
                            <p className="text-emerald-100 text-xs">Kỳ đánh giá</p>
                            <p className="text-2xl font-bold text-white">{latestReview?.period || "—"}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-600">
                        <CardContent className="p-4">
                            <p className="text-amber-100 text-xs">Số lượt đánh giá</p>
                            <p className="text-2xl font-bold text-white">{myReviews.length}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Score trend (my tab) */}
            {tab === "my" && myReviews.length > 1 && (
                <Card className="border border-slate-200 dark:border-slate-800">
                    <CardHeader><CardTitle className="text-sm">Xu hướng điểm</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-3 h-24">
                            {myReviews.slice().reverse().map((r, i) => {
                                const selfH = r.self_score ? (r.self_score / 100) * 80 : 4;
                                const mgrH = r.manager_score ? (r.manager_score / 100) * 80 : 0;
                                return (
                                    <div key={r.id} className="flex flex-col items-center gap-1 flex-1">
                                        <div className="flex items-end gap-0.5 w-full justify-center">
                                            <div className="w-3 bg-purple-400 rounded-t" style={{ height: `${selfH}px` }} title={`Tự: ${r.self_score || "—"}`} />
                                            {mgrH > 0 && <div className="w-3 bg-blue-400 rounded-t" style={{ height: `${mgrH}px` }} title={`Quản lý: ${r.manager_score || "—"}`} />}
                                        </div>
                                        <span className="text-[9px] text-slate-400">{r.period}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-2 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-400" />Tự đánh giá</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" />Quản lý</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Form */}
            {showCreate && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Tạo KPI Review mới</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Kỳ đánh giá</label>
                                <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2026-Q1" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Tự chấm điểm (0-100)</label>
                                <input type="number" value={form.self_score} onChange={(e) => setForm({ ...form, self_score: e.target.value })} min="0" max="100" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Mục tiêu & KPI</label>
                            <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={3} placeholder="Liệt kê mục tiêu cho kỳ này..." className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Nhận xét tự đánh giá</label>
                            <textarea value={form.self_comments} onChange={(e) => setForm({ ...form, self_comments: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">Lưu nháp</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-3">
                {loading ? [1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></CardContent></Card>) :
                    reviews.length === 0 ?
                        <Card><CardContent className="flex flex-col items-center py-12"><Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tab === "my" ? "Chưa có KPI Review" : tab === "review" ? "Không có review chờ đánh giá" : "Chưa có dữ liệu"}</h3></CardContent></Card> :
                        reviews.map(r => {
                            const ss = STATUS_MAP[r.status] || STATUS_MAP.draft;
                            const isEditing = editingId === r.id;
                            return (
                                <Card key={r.id} className="border border-slate-200 dark:border-slate-800">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            {(tab === "review" || tab === "team") && r.user && (
                                                <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-indigo-500 text-white text-xs">{getInitials(r.user.full_name)}</AvatarFallback></Avatar>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    {(tab === "review" || tab === "team") && r.user && <span className="text-sm font-medium text-slate-900 dark:text-white">{r.user.full_name}</span>}
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{r.period}</span>
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ss.color}`}>{ss.label}</span>
                                                </div>
                                                {r.goals && <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">{r.goals}</p>}
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-slate-400">Tự chấm</p>
                                                    <p className={`text-lg font-bold ${scoreColor(r.self_score)}`}>{r.self_score ?? "—"}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-slate-400">Quản lý</p>
                                                    <p className={`text-lg font-bold ${scoreColor(r.manager_score)}`}>{r.manager_score ?? "—"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Self & Manager comments */}
                                        {(r.self_comments || r.manager_comments) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                {r.self_comments && <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg"><span className="text-purple-600 font-medium">Tự nhận xét:</span> <span className="text-slate-600 dark:text-slate-400">{r.self_comments}</span></div>}
                                                {r.manager_comments && <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg"><span className="text-blue-600 font-medium">Quản lý:</span> <span className="text-slate-600 dark:text-slate-400">{r.manager_comments}</span></div>}
                                            </div>
                                        )}

                                        {r.reviewer && <p className="text-[10px] text-slate-400">Đánh giá bởi: {r.reviewer.full_name}</p>}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {tab === "my" && r.status === "draft" && (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setEditingId(r.id); setForm({ period: r.period, goals: r.goals || "", self_score: r.self_score?.toString() || "", self_comments: r.self_comments || "" }); }}><Edit2 className="w-3 h-3 mr-1" />Sửa</Button>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => handleSubmit(r.id)}><Send className="w-3 h-3 mr-1" />Nộp</Button>
                                                </>
                                            )}
                                            {tab === "review" && r.status === "submitted" && !isEditing && (
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => setEditingId(r.id)}><Star className="w-3 h-3 mr-1" />Đánh giá</Button>
                                            )}
                                        </div>

                                        {/* Manager review form */}
                                        {isEditing && tab === "review" && (
                                            <div className="border-t pt-3 space-y-2">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500">Điểm quản lý (0-100)</label>
                                                        <input type="number" value={reviewForm.manager_score} onChange={(e) => setReviewForm({ ...reviewForm, manager_score: e.target.value })} min="0" max="100" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                                    </div>
                                                </div>
                                                <textarea value={reviewForm.manager_comments} onChange={(e) => setReviewForm({ ...reviewForm, manager_comments: e.target.value })} placeholder="Nhận xét của quản lý..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Hủy</Button>
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => handleManagerReview(r.id)}><Check className="w-3 h-3 mr-1" />Xác nhận</Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Edit draft form */}
                                        {isEditing && tab === "my" && (
                                            <div className="border-t pt-3 space-y-2">
                                                <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" placeholder="Mục tiêu..." />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="number" value={form.self_score} onChange={(e) => setForm({ ...form, self_score: e.target.value })} min="0" max="100" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" placeholder="Tự chấm (0-100)" />
                                                    <input value={form.self_comments} onChange={(e) => setForm({ ...form, self_comments: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" placeholder="Nhận xét" />
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Hủy</Button>
                                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs" onClick={() => handleUpdateDraft(r.id)}>Lưu</Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                }
            </div>
        </div>
    );
}
