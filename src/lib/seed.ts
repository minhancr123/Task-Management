
import { supabase } from "@/lib/supabase";

// Define the roles/personas we want to have in the system
const PERSONAS = [
    { key: "ADMIN", role: "admin", name: "Nguyễn Văn Admin", email: "admin@company.com" },
    { key: "HR", role: "manager", name: "Lê Thu HR", email: "manager.hr@company.com" },
    { key: "TECH", role: "manager", name: "Trần Văn Tech", email: "manager.tech@company.com" },
    { key: "LEAD", role: "team_lead", name: "Phạm Frontend", email: "lead.fe@company.com" },
    { key: "DEV1", role: "member", name: "Ngô Developer 1", email: "dev.01@company.com" },
    { key: "DEV2", role: "member", name: "Đỗ Developer 2", email: "dev.02@company.com" },
    { key: "SALES", role: "member", name: "Bùi Sales", email: "sales.01@company.com" },
] as const;

export async function seedDatabase() {
    console.log("Starting seed with dynamic user mapping...");

    // 1. Get existing users (profiles)
    const { data: existingProfiles, error: profileError } = await supabase.from("profiles").select("*");

    if (profileError || !existingProfiles || existingProfiles.length === 0) {
        // If no profiles, try to get the current session user at least
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Cannot seed: No existing users found and no active session.");

        // Ensure profile for current user
        const { error: upsertError } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email,
            updated_at: new Date().toISOString()
        });
        if (upsertError) console.warn("Warning: Could not ensure profile for current user", upsertError);
    }

    // Refresh profiles list
    const { data: availableProfiles } = await supabase.from("profiles").select("*");
    if (!availableProfiles || availableProfiles.length === 0) throw new Error("No profiles available.");

    console.log(`Found ${availableProfiles.length} existing users to distribute roles to.`);

    // 2. Map Personas to Real IDs
    const USERS: Record<string, string> = {};

    PERSONAS.forEach((persona, index) => {
        // Use modulo to cycle through available real users
        const realUser = availableProfiles[index % availableProfiles.length];
        USERS[persona.key] = realUser.id;
    });

    const adminId = USERS['ADMIN'];
    await supabase.from("profiles").update({
        role: "admin",
        full_name: "Admin User",
    }).eq("id", adminId);

    // 3. Clear existing data
    const tables = [
        "notifications", "task_comments", "task_attachments", "task_activities",
        "milestones", "project_members", "tasks", "projects",
        "department_members", "departments",
        "timesheets", "leave_requests", "kpi_reviews", "documents", "audit_logs"
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) console.error(`Error deleting ${table}:`, error);
    }

    // 4. Insert Departments
    const { data: depts, error: deptError } = await supabase.from("departments").insert([
        { name: "Ban Giám Đốc", description: "Lãnh đạo công ty" },
        { name: "Phòng Kỹ Thuật", description: "Phát triển sản phẩm và hệ thống" },
        { name: "Phòng Nhân Sự", description: "Tuyển dụng và quản lý nhân sự" },
        { name: "Phòng Kinh Doanh", description: "Bán hàng và marketing" },
    ]).select();

    if (deptError || !depts) throw new Error("Failed to create departments");

    const deptMap = {
        board: depts.find(d => d.name === "Ban Giám Đốc"),
        tech: depts.find(d => d.name === "Phòng Kỹ Thuật"),
        hr: depts.find(d => d.name === "Phòng Nhân Sự"),
        sales: depts.find(d => d.name === "Phòng Kinh Doanh"),
    };

    // Assign Head of Departments
    if (deptMap.tech) await supabase.from("departments").update({ head_id: USERS.TECH }).eq("id", deptMap.tech.id);
    if (deptMap.hr) await supabase.from("departments").update({ head_id: USERS.HR }).eq("id", deptMap.hr.id);
    if (deptMap.sales) await supabase.from("departments").update({ head_id: USERS.SALES }).eq("id", deptMap.sales.id);
    if (deptMap.board) await supabase.from("departments").update({ head_id: USERS.ADMIN }).eq("id", deptMap.board.id);

    // 5. Create Projects
    console.log("Creating projects...");
    const { data: projects, error: projError } = await supabase.from("projects").insert([
        {
            name: "Hệ thống ERP nội bộ",
            description: "Xây dựng hệ thống quản lý tài nguyên doanh nghiệp",
            status: "active",
            priority: "high",
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            budget: 500000000,
            created_by: USERS.TECH
        },
        {
            name: "Website Thương mại điện tử",
            description: "Nâng cấp giao diện và tính năng mua sắm",
            status: "planning",
            priority: "medium",
            start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            budget: 200000000,
            created_by: USERS.LEAD
        },
        {
            name: "Chiến dịch Tuyển dụng Q2",
            description: "Tuyển dụng nhân sự cho team Ruby và React",
            status: "active",
            priority: "critical",
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            budget: 50000000,
            created_by: USERS.HR
        }
    ]).select();

    if (projError || !projects) throw new Error("Failed to create projects: " + projError.message);

    const erpProject = projects.find(p => p.name.includes("ERP"));
    const webProject = projects.find(p => p.name.includes("Website"));
    const hrProject = projects.find(p => p.name.includes("Tuyển dụng"));

    // 6. Add Project Members
    console.log("Adding members...");
    const members = [];
    if (erpProject) {
        members.push(
            { project_id: erpProject.id, user_id: USERS.TECH, role: "manager" },
            { project_id: erpProject.id, user_id: USERS.LEAD, role: "member" },
            { project_id: erpProject.id, user_id: USERS.DEV1, role: "member" },
            { project_id: erpProject.id, user_id: USERS.DEV2, role: "member" }
        );
    }
    if (webProject) {
        members.push(
            { project_id: webProject.id, user_id: USERS.LEAD, role: "manager" },
            { project_id: webProject.id, user_id: USERS.DEV1, role: "member" }
        );
    }
    if (hrProject) {
        members.push(
            { project_id: hrProject.id, user_id: USERS.HR, role: "manager" }
        );
    }

    // Filter duplicates
    const uniqueMembers = members.filter((v, i, a) => a.findIndex(t => (t.project_id === v.project_id && t.user_id === v.user_id)) === i);
    if (uniqueMembers.length > 0) {
        const { error } = await supabase.from("project_members").insert(uniqueMembers);
        if (error) console.error("Error adding members:", error);
    }

    // 7. Create Milestones
    console.log("Creating milestones...");
    if (erpProject) {
        await supabase.from("milestones").insert([
            { project_id: erpProject.id, title: "Thiết kế CSDL", due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
            { project_id: erpProject.id, title: "MVP Release", due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" },
            { project_id: erpProject.id, title: "UAT Testing", due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" },
        ]);
    }

    // 8. Create Tasks
    console.log("Creating tasks...");
    const tasks = [];
    // Note: 'category' field was removed/missing from seed data causing errors. 
    // Checking schema: tasks table does NOT have a 'category' column in the migration file provided.
    // Wait, the error said: "null value in column "category" of relation "tasks" violates not-null constraint"
    // This implies the actual DB *does* have a category column that is NOT NULL.
    // I will add a default category to all tasks.

    if (erpProject) {
        tasks.push(
            { title: "Phân tích yêu cầu module Kho", description: "Làm việc với bộ phận kho vận", status: "completed", priority: "high", project_id: erpProject.id, assigned_to: USERS.LEAD, created_by: USERS.TECH, due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), category: "Analysis" },
            { title: "Thiết kế API Gateway", description: "Setup Kong Gateway", status: "in_progress", priority: "critical", project_id: erpProject.id, assigned_to: USERS.DEV1, created_by: USERS.LEAD, due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), category: "Backend" },
            { title: "Implement UI Login", description: "Sử dụng Shadcn UI", status: "todo", priority: "medium", project_id: erpProject.id, assigned_to: USERS.DEV2, created_by: USERS.LEAD, due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), category: "Frontend" },
            { title: "Setup CI/CD Pipeline", description: "Github Actions workflows", status: "in_review", priority: "high", project_id: erpProject.id, assigned_to: USERS.DEV1, created_by: USERS.TECH, due_date: new Date().toISOString(), category: "DevOps" },
        );
    }
    if (hrProject) {
        tasks.push(
            { title: "Đăng tin tuyển dụng Senior Java", description: "Trên ITViecl, TopDev", status: "in_progress", priority: "high", project_id: hrProject.id, assigned_to: USERS.HR, created_by: USERS.HR, due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), category: "Recruitment" },
            { title: "Phỏng vấn ứng viên Dev 01", description: "Phỏng vấn kỹ thuật vòng 1", status: "todo", priority: "medium", project_id: hrProject.id, assigned_to: USERS.TECH, created_by: USERS.HR, due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), category: "Recruitment" },
        );
    }

    // Insert tasks and capture IDs so we can add timesheets/comments
    let createdTasks: any[] = [];
    if (tasks.length > 0) {
        const { data, error } = await supabase.from("tasks").insert(tasks).select();
        if (error) console.error("Error creating tasks:", error);
        createdTasks = data || [];
    }

    // 9. Create Timesheets
    console.log("Creating timesheets...");
    if (createdTasks.length > 0) {
        const ts = [];
        // Lead logs time on analysis
        const t1 = createdTasks.find((t: any) => t.title.includes("Phân tích"));
        if (t1) {
            ts.push({
                user_id: USERS.LEAD,
                task_id: t1.id,
                project_id: t1.project_id,
                work_date: new Date().toISOString().split('T')[0],
                hours: 4,
                description: "Họp với kho vận + viết tài liệu",
                status: "submitted"
            });
        }
        // Dev1 logs time on API
        const t2 = createdTasks.find((t: any) => t.title.includes("Gateway"));
        if (t2) {
            ts.push({
                user_id: USERS.DEV1,
                task_id: t2.id,
                project_id: t2.project_id,
                work_date: new Date().toISOString().split('T')[0],
                hours: 8,
                description: "Setup Kong gateway base image",
                status: "approved",
                approved_by: USERS.TECH
            });
        }
        await supabase.from("timesheets").insert(ts);
    }

    // 10. Create Leave Requests
    console.log("Creating leave requests...");
    await supabase.from("leave_requests").insert([
        {
            user_id: USERS.DEV1,
            leave_type: "annual",
            start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            total_days: 3,
            reason: "Về quê",
            status: "pending",
        },
        {
            user_id: USERS.SALES,
            leave_type: "sick",
            start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            total_days: 1,
            reason: "Sốt siêu vi",
            status: "approved",
            approved_by: USERS.HR,
            reviewer_note: "Đã nhận giấy nghỉ ốm"
        }
    ]);

    // 11. Create KPI Reviews
    console.log("Creating KPI reviews...");
    await supabase.from("kpi_reviews").insert([
        {
            user_id: USERS.DEV1,
            reviewer_id: USERS.TECH,
            period: "2023-Q4",
            self_score: 85,
            manager_score: 88,
            self_comments: "Hoàn thành tốt các task được giao",
            manager_comments: "Làm việc chăm chỉ, cần cải thiện tiếng Anh",
            status: "reviewed"
        },
        {
            user_id: USERS.LEAD,
            reviewer_id: USERS.TECH,
            period: "2024-Q1",
            status: "draft"
        }
    ]);

    // 12. Create Documents
    console.log("Creating documents...");
    await supabase.from("documents").insert([
        {
            uploaded_by: USERS.HR,
            title: "Sổ tay nhân viên 2024",
            description: "Quy định chung và phúc lợi",
            file_url: "https://example.com/handbook.pdf",
            file_name: "employee_handbook_v2.pdf",
            file_size: 2048576,
            file_type: "application/pdf",
            version: 1,
            tags: ["policy", "hr"]
        },
        {
            project_id: erpProject?.id,
            uploaded_by: USERS.TECH,
            title: "Architecture Diagram v1.0",
            description: "Sơ đồ kiến trúc microservices",
            file_url: "https://example.com/arch.png",
            file_name: "arch_v1.png",
            file_size: 1024000,
            file_type: "image/png",
            version: 1,
            tags: ["technical", "image"]
        }
    ]);

    // 13. Create Comments
    console.log("Creating comments...");
    if (createdTasks.length > 0) {
        const t = createdTasks[0];
        await supabase.from("task_comments").insert([
            {
                task_id: t.id,
                user_id: USERS.TECH,
                content: "Chú ý phần integrate với hệ thống kế toán cũ nhé."
            },
            {
                task_id: t.id,
                user_id: USERS.LEAD,
                content: "Đã note, đang chờ tài liệu API từ bên đó."
            }
        ]);
    }

    console.log("Seed completed successfully!");
    return { success: true, message: `Toàn bộ dữ liệu mẫu đã được tạo (sử dụng ${availableProfiles.length} tài khoản thực)!` };
}
