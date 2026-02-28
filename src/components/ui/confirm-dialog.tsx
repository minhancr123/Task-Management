"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Info } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
    loading?: boolean;
}

const VARIANT_CONFIG = {
    danger: {
        icon: Trash2,
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        buttonClass: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
        icon: Info,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
    },
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title = "Xác nhận",
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    variant = "danger",
    onConfirm,
    loading = false,
}: ConfirmDialogProps) {
    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${config.iconBg} flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        <div className="space-y-1.5 pt-0.5">
                            <DialogTitle className="text-base">{title}</DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="min-w-[80px]"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        disabled={loading}
                        className={`min-w-[80px] ${config.buttonClass}`}
                    >
                        {loading ? "Đang xử lý..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
