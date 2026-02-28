"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedDatabase } from "@/lib/seed";
import { Database, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";

export default function SeedDataPage() {
    const [loading, setLoading] = useState(false);
    const { isAdmin } = usePermissions();
    const router = useRouter();

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                <h1 className="text-xl font-bold">Truy cập bị từ chối</h1>
                <p className="text-slate-500 mt-2">Bạn cần quyền Admin để truy cập trang này.</p>
                <Button className="mt-4" onClick={() => router.push("/")}>Quay lại trang chủ</Button>
            </div>
        );
    }

    const handleSeed = async () => {
        if (!confirm("CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế bằng dữ liệu mẫu. Bạn có chắc chắn không?")) return;

        try {
            setLoading(true);
            toast.info("Đang khởi tạo dữ liệu mẫu...");

            await seedDatabase();

            toast.success("Đã tạo dữ liệu mẫu thành công!");
            setTimeout(() => window.location.reload(), 1500); // Reload to refresh data
        } catch (error: any) {
            console.error(error);
            toast.error("Có lỗi xảy ra: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10">
            <h1 className="text-2xl font-bold mb-6">Quản trị hệ thống</h1>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
                <CardHeader>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <Database className="w-5 h-5" />
                        <CardTitle>Khởi tạo dữ liệu mẫu</CardTitle>
                    </div>
                    <CardDescription className="text-amber-700/80 dark:text-amber-400">
                        Công cụ này dùng để reset hệ thống về trạng thái ban đầu với dữ liệu demo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 text-sm space-y-2">
                        <p className="font-medium text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Cảnh báo quan trọng:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-1">
                            <li>Toàn bộ <strong>Tasks, Projects, Departments, Comments</strong> sẽ bị xóa vĩnh viễn.</li>
                            <li>Tài khoản người dùng thực tế sẽ không bị xóa (nhưng thông tin Profile có thể bị override nếu trùng ID demo).</li>
                            <li>Dữ liệu mẫu bao gồm: 4 phòng ban, 3 dự án, ~10 tasks và 7 users giả lập.</li>
                        </ul>
                    </div>

                    <Button
                        size="lg"
                        variant="destructive"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleSeed}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {loading ? "Đang xử lý..." : "Xóa hết & Tạo dữ liệu mẫu"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
