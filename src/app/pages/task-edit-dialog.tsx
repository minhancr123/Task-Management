import { useForm } from "react-hook-form";
import { TaskFormData, taskSchemaValidate } from "../zod/task";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CatergoryMock, Task } from "@/lib/task";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TaskEditDialogProps {
    task: TaskFormData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateTask: (taskId: string, updates: Partial<TaskFormData>) => Promise<Task | string>;
}

export default function EditTaskDialog({ 
    task, 
    open, 
    onOpenChange, 
    onUpdateTask 
}: TaskEditDialogProps) {
    const [loading, setLoading] = useState(false);
    
    const formEdit = useForm<TaskFormData>({
        resolver: zodResolver(taskSchemaValidate),
        defaultValues: {
            title: task.title || "",
            description: task.description || "",
            due_date: task.due_date || "",
            category: task.category || "",
            priority: task.priority || "medium",
            status: task.status || "todo",
        }
    });

    // Reset form khi task thay đổi
    useEffect(() => {
        if (open && task) {
            formEdit.reset({
                title: task.title || "",
                description: task.description || "",
                due_date: task.due_date || "",
                category: task.category || "",
                priority: task.priority || "medium",
                status: task.status || "todo",
            });
        }
    }, [task, open, formEdit]);

    const handleSubmit = useCallback(async (data: TaskFormData) => {
        if (!task.id) {
            toast.error("Task ID is missing");
            return;
        }

        setLoading(true);
        
        try {
            console.log("Submitting task update:", { taskId: task.id, data });
            
            const result = await onUpdateTask(task.id, data);
            
            if (result) {
                toast.success("Task updated successfully!");
                onOpenChange(false);
                // Reset form với dữ liệu mới
                formEdit.reset(data);
            } else {
                toast.error("Failed to update task");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [task.id, onUpdateTask, onOpenChange, formEdit]);

    const handleCancel = useCallback(() => {
        if (!loading) {
            onOpenChange(false);
            // Reset form về giá trị ban đầu
            formEdit.reset({
                title: task.title || "",
                description: task.description || "",
                due_date: task.due_date || "",
                category: task.category || "",
                priority: task.priority || "medium",
                status: task.status || "todo",
            });
        }
    }, [loading, onOpenChange, formEdit, task]);

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>

                <Form {...formEdit}>
                    <form onSubmit={formEdit.handleSubmit(handleSubmit)} className="space-y-4">
                        
                        <FormField 
                            control={formEdit.control} 
                            name="title" 
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        {...field}
                                        placeholder="Enter task title"
                                        disabled={loading}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField 
                            control={formEdit.control} 
                            name="description" 
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        {...field}
                                        value={field.value || ""}
                                        placeholder="Enter task description"
                                        disabled={loading}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField 
                            control={formEdit.control} 
                            name="due_date" 
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        {...field}
                                        disabled={loading}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField 
                            control={formEdit.control} 
                            name="category" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select 
                                        value={field.value || ""} 
                                        onValueChange={field.onChange}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CatergoryMock.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField 
                            control={formEdit.control} 
                            name="priority" 
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Priority</Label>
                                    <Select 
                                        value={field.value || "medium"} 
                                        onValueChange={field.onChange}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="flex-1" 
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="flex-1" 
                                disabled={loading || !formEdit.formState.isValid}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Updating..." : "Update Task"}
                            </Button>
                        </div>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}