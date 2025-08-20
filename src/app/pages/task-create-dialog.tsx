import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask } from "@/lib/task";
import { useState } from "react";
import {useForm} from "react-hook-form";
import { toast } from "sonner";
import Loading from "../loading";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskFormData, taskSchemaValidate } from "../zod/task";
import { useStore } from "zustand";
import { useTaskStore } from "@/store/useTaskStore";
// interface TaskFormData {
//         title: string
//         description: string
//         due_date: string
//         category: string
//         priority: "low" | "medium" | "high"
//         status: "todo" | "in-progress" | "completed"
// }
interface CreateTaskDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen : boolean) => void;
    onCreateTask : (task: TaskFormData ) => void

  categories: string[];
}

export function CreateTaskDialog({ isOpen, onOpenChange, onCreateTask, categories }: CreateTaskDialogProps) {
  const { user } = useAuth();
     const form = 
     useForm<TaskFormData>({
      resolver : zodResolver(taskSchemaValidate),
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
  const [loading ,setloading] = useState(false);
    const handleCreateTask = async (data: TaskFormData) => {
  try {
triggerRefresh();

    setloading(true);
    const res = await createTask(data , String(user?.id));

    if (res) {
      toast.success("Task created successfully!");
    } else {
      toast.error("Failed to create task. Please try again.");
    }
  } catch (error : any) {
    console.error("Error creating task:", error);
    toast.error(error.message || "Something went wrong");
  } finally {
    form.reset();
    onOpenChange(false);
    setloading(false);
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} >
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Create Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-4">
                    {/* Title */}
                    <FormField  control={form.control} name="title" render={({field}) => (
                      <FormItem className="space-y-2" >
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter task title" {...field}></Input>
                          </FormControl>
                          <FormMessage></FormMessage>
                      </FormItem>
                    )}>

                    </FormField>

                    {/* Description */}
                    <FormField control={form.control} name="description" render={({field}) => (
                      <FormItem className="space-y-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter task description" {...field}
                            value={field.value ?? ""}
                            ></Input>
                          </FormControl>
                          <FormMessage></FormMessage>
                      </FormItem>
                    )}>
                    </FormField>
                      
                    <div className="grid sm:grid-cols-2 gap-4 ">
                      
                     {/* Due date */}
                    <FormField control={form.control} name="due_date" render={({field}) => (
                      <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" placeholder="Enter task due date" {...field}></Input>
                          </FormControl>
                          <FormMessage></FormMessage>
                      </FormItem>
                    )}>
                      
                    </FormField>

                     {/* Catergory */}
                    <FormField control={form.control} name="category" render={({field}) => (
                      <FormItem>
                          <FormLabel>Catergories</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" >

                            </SelectValue>
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
                        <FormMessage></FormMessage>
                      </FormItem>
                    )}>
                    </FormField>

                    {/* Priority */}
                    <FormField control={form.control} name="priority" render={({field}) => (
                      <FormItem>
                          <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" >
                            </SelectValue>
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage></FormMessage>
                      </FormItem>
                    )}>
                    </FormField>
                     {/* Status */}
                    <FormField control={form.control} name="status" render={({field}) => (
                      <FormItem>
                          <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" >
                            </SelectValue>
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage></FormMessage>
                      </FormItem>
                    )}>
                    </FormField>

                      </div>  
                      <Button type="submit" className="w-full" disabled={loading || !form.formState.isValid}>
                        Create Task
                      {loading && <Loader2 size={16} className="animate-spin mr-4"></Loader2>}
                      </Button>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}