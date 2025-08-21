import { useState } from "react"
import { TaskFormData } from "../zod/task"
import { useSortable } from "@dnd-kit/sortable"
import { UniqueIdentifier } from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/card"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Calendar, GripVertical, MoreHorizontal, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Task } from "@/lib/task"
import { Close } from "@radix-ui/react-dialog"

interface TaskCardProps {
  task: TaskFormData
  onUpdate: (taskId:string , updates: Partial<TaskFormData>) => void
  onDelete: (taksId : string) => void
  isDragging?: boolean
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}
export default function TaskCard({ task, onUpdate, onDelete, isDragging =false }: TaskCardProps) {

    const [isEditDialog , setIsEditDialog] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition , isDragging : isSortableDragging } = useSortable({id : task.id as UniqueIdentifier});
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const isOverDue = task.status !== "completed" && new Date(task.due_date) > new Date();
    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if(isSortableDragging || isDragging){
        return (
            <Card ref={setNodeRef} className="opacity-50 rotate-3 shadow-lg">
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg line-clamp-1">
                                {task.title}
                            </h3>
                            <p className="text-sm font-medium line-clamp-2">
                                {task.description || "No description"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }
     return(
            <>
            <Card ref={setNodeRef} style={style} className={`relative cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${isOverDue ? "border-red-200 dark:border-red-800" : ""}`} {...attributes} {...listeners}>
            {/* Delete Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-0 right-0 w-6 h-6 mx-2 z-10 hover:bg-red-100 hover:text-red-600" 
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log("🗑️ Delete button clicked for task:", task.id);
                    onDelete(task.id as string);
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
                onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
                >
                <X className="w-4 h-4" />
            </Button>
            
                <CardContent className="p-4 pr-10">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg line-clamp-1">
                                {task.title}
                            </h3>
                          
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {task.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                <Calendar className="h-3 w-3">
                                </Calendar>
                                <span className={isOverDue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                                    {new Date(task.due_date).toLocaleDateString()}    
                                </span>
                            </div>

                            {task.status == "completed" && (
                                <span className={`text-xs ${isOverDue ? "text-red-600 dark:text-red-400 font-medium" : daysUntilDue > 3 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 dark:text-slate-400"}`}>
                                    {isOverDue ? `${Math.abs(daysUntilDue)} days overdue` : daysUntilDue ==0 ? "Due today" : `${daysUntilDue} days left`}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            </>
        )
}