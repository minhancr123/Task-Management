import z from "zod";

export const taskSchemaValidate = z.object({
    id  : z.string().optional(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required").optional().nullable(),
    due_date: z.string().refine((date) => {
        const today = new Date();
        const dueDate = new Date(date);
        return dueDate >= today;
    }, "Due date must be today or in the future"),
    category: z.string().min(1, "Category is required"),
    priority : z.enum(["low", "medium", "high"]),
    status: z.enum(["todo", "in-progress", "completed"])
})

export type TaskFormData = z.infer<typeof taskSchemaValidate>;