"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Settings, Shield, User, ListChecks, Plus, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreateTaskDialog } from "../pages/task-create-dialog";
import { CatergoryMock } from "@/lib/task";
import { useTaskStore } from "@/store/useTaskStore";
import { NotificationDropdown } from "../components/NotificationDropdown";

export function Header() {
    const { user, profile, signOut, loading } = useAuth();
    const [isOpenCreateTaskDialog, setIsOpenCreateTaskDialog] = useState(false);
    const { triggerRefresh } = useTaskStore();
    const router = useRouter();

    const handleCreateTask = (taskData: any) => {
        console.log("🔥 Header: Task created, triggering optimized refresh");
        // Use a longer delay to avoid spam
        setTimeout(() => {
            triggerRefresh();
        }, 500);
    };

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.error) {
            console.log(result.error);
            toast.error(result.error.message);
        } else {
            toast.success("Logged out successfully!");
            router.replace("/auth");
        }
    };

    const handleNavigateProfile = () => {
        router.push("/profile");
    };

    const handleNavigateSettings = () => {
        router.push("/settings");
    };

    const handleNavigateAdmin = () => {
        router.push("/admin");
    };

    if (loading) {
        return (
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Left Side - Logo */}
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-lg animate-pulse"></div>
                            <div className="space-y-1">
                                <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-32 animate-pulse"></div>
                                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-40 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* New Task Button Skeleton */}
                            <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded w-24 animate-pulse"></div>

                            {/* Notification Button Skeleton */}
                            <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-lg animate-pulse"></div>

                            {/* Profile Dropdown Skeleton */}
                            <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="border-b border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                        <ListChecks className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            TaskFlow
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Manage your tasks efficiently
                        </p>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* New Task Button */}
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border-0 transition-all duration-200 hover:shadow-xl"
                        onClick={() => setIsOpenCreateTaskDialog(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>

                    <CreateTaskDialog
                        isOpen={isOpenCreateTaskDialog}
                        onOpenChange={setIsOpenCreateTaskDialog}
                        onCreateTask={handleCreateTask}
                        categories={CatergoryMock.map((c) => c.name)}
                    />

                    {/* Notification Button */}
                    <NotificationDropdown />

                    {/* Admin Button */}
                    {profile?.role === "admin" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNavigateAdmin}
                            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 transition-all duration-200"
                        >
                            <Shield className="h-4 w-4" />
                            Admin
                        </Button>
                    )}

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-12 w-12 rounded-full p-1 hover:bg-transparent transition-all duration-300"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={profile?.avatar_url || "/default-avatar.png"}
                                        alt={profile?.full_name || "User avatar"}
                                    />
                                    <AvatarFallback className="text-sm font-bold">
                                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72 p-0" align="end">
                            {/* User Info Header */}
                            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                                <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-slate-600 shadow-xl">
                                    <AvatarImage 
                                        src={profile?.avatar_url || "/default-avatar.png"} 
                                        alt={profile?.full_name || "User avatar"}
                                    />
                                    <AvatarFallback className="text-xl font-bold">
                                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col space-y-2 leading-none">
                                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                        {profile?.full_name || "User"}
                                    </p>
                                    <p className="w-[200px] truncate text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        {user?.email}
                                    </p>
                                    {profile?.role === "admin" && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full w-fit shadow-sm">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <DropdownMenuItem
                                    onClick={handleNavigateProfile}
                                    className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <User className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
                                    <span>Profile Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleNavigateSettings}
                                    className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Settings className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
                                    <span>App Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2" />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="cursor-pointer rounded-lg p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}