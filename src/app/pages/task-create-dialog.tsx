"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createTask } from "@/lib/task";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Calendar, Tag, Flag, CheckSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchemaValidate, TaskFormData } from "../zod/task";
import { useTaskStore } from "@/store/useTaskStore";

interface CreateTaskDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    categories: string[];
}

export function CreateTaskDialog({
    isOpen,
    onOpenChange,
    categories,
}: CreateTaskDialogProps) {
    const { user } = useAuth();
    const form = useForm({
        resolver: zodResolver(taskSchemaValidate),
        defaultValues: {
            title: "",
            description: "",
            due_date: "",
            category: "",
            priority: "medium",
            status: "todo",
        },
    });

    const { triggerRefresh } = useTaskStore();
    const [loading, setLoading] = useState(false);

    const handleCreateTask = async (data: TaskFormData) => {
        try {
            setLoading(true);
            console.log("🚀 CreateTaskDialog: Starting task creation...", data);
            const res = await createTask(data, String(user?.id));
            if (res) {
                console.log("✅ CreateTaskDialog: Task created successfully", res);
                toast.success("Task created successfully!");
                form.reset();
                triggerRefresh(); // Trigger refresh for all components
                onOpenChange(false);
            } else {
                console.error("❌ CreateTaskDialog: Failed to create task - no result");
                toast.error("Failed to create task. Please try again.");
            }
        } catch (error: unknown) {
            console.error("💥 CreateTaskDialog: Error creating task:", error);
            const errorMessage = error instanceof Error ? error.message : "Something went wrong";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <CheckSquare className="h-5 w-5" />
                            </div>
                            Create New Task
                        </DialogTitle>
                        <p className="text-blue-100 mt-2">
                            Add a new task to your workflow and stay organized
                        </p>
                    </DialogHeader>
                </div>

                {/* Form Content */}
                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-6">
                            {/* Task Title */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            Task Title
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter a descriptive task title..."
                                                className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Description (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Add more details about the task..."
                                                className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Grid for Date and Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Due Date
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Category
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Grid for Priority and Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Flag className="h-4 w-4" />
                                                Priority
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400">
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">
                                                        <span className="flex items-center gap-2">
                                                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                                            Low
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="medium">
                                                        <span className="flex items-center gap-2">
                                                            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                                                            Medium
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="high">
                                                        <span className="flex items-center gap-2">
                                                            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                                                            High
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Status
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="todo">To Do</SelectItem>
                                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1 h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border-0 transition-all duration-200"
                                    disabled={loading || !form.formState.isValid}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Create Task
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}