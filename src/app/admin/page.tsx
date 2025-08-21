"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Users, CheckCircle, Shield, UserCheck, UserX, Trash2, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile || profile.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/");
        return;
      }
      // Only fetch data once when component mounts
      if (!dataLoaded) {
        fetchAdminData();
      }
    }
  }, [user, profile, authLoading, router, dataLoaded]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching admin stats...");
      
      // Only fetch stats initially for faster load
      const [
        { count: userCount },
        { count: taskCount },
        { count: completedCount }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed")
      ]);

      console.log("✅ Admin stats fetched successfully");

      setStats({
        totalUsers: userCount || 0,
        totalTasks: taskCount || 0,
        completedTasks: completedCount || 0,
      });

      setDataLoaded(true);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (usersLoaded) return;
    
    try {
      console.log("🔄 Fetching users...");
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setUsers(usersData || []);
      setUsersLoaded(true);
      console.log("✅ Users fetched successfully");
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const fetchTasks = async () => {
    if (tasksLoaded) return;
    
    try {
      console.log("🔄 Fetching tasks...");
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (tasksData && tasksData.length > 0) {
        // Fetch user profiles separately
        const userIds = [...new Set(tasksData.map(task => task.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        // Combine tasks with profile data
        const tasksWithProfiles = tasksData.map(task => ({
          ...task,
          profiles: profilesData?.find(p => p.id === task.user_id) || null
        }));

        setTasks(tasksWithProfiles);
      } else {
        setTasks([]);
      }

      setTasksLoaded(true);
      console.log("✅ Tasks fetched successfully");
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  const refreshData = async () => {
    setDataLoaded(false);
    setUsersLoaded(false);
    setTasksLoaded(false);
    await fetchAdminData();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Lazy load data based on tab
    if (tab === "users" && !usersLoaded) {
      fetchUsers();
    } else if (tab === "tasks" && !tasksLoaded) {
      fetchTasks();
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);

      if (error) throw error;
      
      toast.success("User promoted to admin");
      refreshData(); // Use refreshData instead of fetchAdminData
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("Failed to promote user");
    }
  };

  const handleDemoteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", userId);

      if (error) throw error;
      
      toast.success("User demoted to regular user");
      refreshData(); // Use refreshData instead of fetchAdminData
    } catch (error) {
      console.error("Error demoting user:", error);
      toast.error("Failed to demote user");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success("Task deleted");
      refreshData(); // Use refreshData instead of fetchAdminData
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (loading && !dataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-7 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-48 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          
          {/* Navigation Tabs Skeleton */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-24 animate-pulse"></div>
            ))}
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-20 animate-pulse"></div>
                  <div className="h-5 w-5 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded animate-pulse"></div>
                </div>
                <div className="h-10 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-400 rounded-lg w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Content Area Skeleton */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-lg w-40 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-64 animate-pulse"></div>
              <div className="space-y-3 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="h-10 w-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-48 animate-pulse"></div>
                    </div>
                    <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleBackToHome}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={handleBackToHome} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users and tasks</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "overview" ? "default" : "outline"}
          onClick={() => handleTabChange("overview")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => handleTabChange("users")}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Users
        </Button>
        <Button
          variant={activeTab === "tasks" ? "default" : "outline"}
          onClick={() => handleTabChange("tasks")}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Tasks
        </Button>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedTasks || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {!usersLoaded ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-48 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-16 animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((userData) => (
                <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg font-bold">
                        {userData.full_name?.charAt(0)?.toUpperCase() || userData.email?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{userData.full_name || "No name"}</div>
                      <div className="text-sm text-muted-foreground">{userData.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                      {userData.role || "user"}
                    </Badge>
                    {userData.role === "user" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteUser(userData.id)}
                        className="flex items-center gap-1"
                      >
                        <UserCheck className="h-3 w-3" />
                        Promote
                      </Button>
                    ) : userData.id !== user.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDemoteUser(userData.id)}
                        className="flex items-center gap-1"
                      >
                        <UserX className="h-3 w-3" />
                        Demote
                      </Button>
                    ) : (
                      <Badge variant="outline">Current User</Badge>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Monitor and manage all tasks in the system</CardDescription>
              </div>
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!tasksLoaded ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-48 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-64 animate-pulse"></div>
                      <div className="flex gap-2 mt-2">
                        <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-16 animate-pulse"></div>
                        <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-20 animate-pulse"></div>
                        <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full w-14 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-24 animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-red-200 to-red-300 dark:from-red-800 dark:to-red-700 rounded w-8 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        by {task.profiles?.full_name || task.profiles?.email || "Unknown"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status}
                        </Badge>
                        <Badge variant={task.priority === "high" ? "destructive" : "outline"}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTask(task.id)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
