import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {  useAuth } from "@/hooks/use-auth";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreateTaskDialog } from "../pages/task-create-dialog";
import { set } from "zod";
import { CatergoryMock } from "@/lib/task";



interface HeaderProps {
    onNavigateAdmin? : () => void;
}

export function Header({onNavigateAdmin} : HeaderProps){
    const {user , profile , signOut} = useAuth();
    const [isOpenCreateTaskDialog, setIsOpenCreateTaskDialog] = useState(false);
    const router = useRouter();
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
    return (
        <header className="borde-b bg-white dark:bg-slate-900 px-4 py-3">
            <div className="container mx-auto flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Task Management</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white" onClick={() => setIsOpenCreateTaskDialog(true)}>
                        New task
                    </Button>
                    <CreateTaskDialog isOpen={isOpenCreateTaskDialog} onOpenChange={setIsOpenCreateTaskDialog} onCreateTask={()=> {}}
                        categories={CatergoryMock.map((c) => (c.name ))}
                    ></CreateTaskDialog>
                    {profile?.role === "admin" && onNavigateAdmin &&(
                        <Button variant="outline" size="sm" onClick={onNavigateAdmin}>
                            <Shield className="h-2 w-2 mr-2">
                            Admin Dashboard
                            </Shield>
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar>
                                <AvatarImage src={profile?.avatar_url || "/default-avatar.png"} className="h-full w-full rounded-full">
                                </AvatarImage>
                                <AvatarFallback>{profile?.full_name || "User Avatar"}</AvatarFallback>

                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <div className  ="flex items-center justify-start gap-2 p-2">
                                <div className="flex-col space-y-1 leading-none">
                                <p className="font-medium">{profile?.full_name}</p>
                                <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                                {profile?.role === "admin" && (
                                    <span className="text-xs text-blue-400 font-medium inline-flex items-center px-2 rounded-full py-0.5 ">Admin</span>
                                )}
                                </div>
                            </div>
                            <DropdownMenuSeparator/>
                                <DropdownMenuItem>
                                    <User className="h-2 w-2 mr-2"></User>
                                    <span>Profiles</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="h-2 w-2 mr-2"></Settings>
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleSignOut}>
                                    <LogOut className="h-2 w-2 mr-2"></LogOut>
                                    <span>Log out</span>
                                </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

        </header>
    )
}