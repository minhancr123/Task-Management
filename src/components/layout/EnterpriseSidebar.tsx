"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { ROLE_DISPLAY } from "@/lib/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Building2,
    Clock,
    CalendarOff,
    Target,
    BarChart3,
    FileText,
    MessageSquare,
    ClipboardCheck,
    Users,
    Settings,
    Shield,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Bell,
    Moon,
    Sun,
    Database,
    LayoutGrid,
    Search,
    Command,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Building2,
    Clock,
    CalendarOff,
    Target,
    BarChart3,
    FileText,
    MessageSquare,
    ClipboardCheck,
    Users,
    Settings,
    Shield,
    Bell,
    Database,
};

export default function EnterpriseSidebar({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile, signOut } = useAuth();
    const { navItems, role } = usePermissions();
    const { theme, setTheme } = useTheme();

    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowSearch(true);
                setSearchQuery("");
            }
            if (e.key === "Escape") {
                setShowSearch(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    const filteredSearchItems = navItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearchSelect = (href: string) => {
        router.push(href);
        setShowSearch(false);
        setSearchQuery("");
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/auth");
    };

    const roleDisplay = ROLE_DISPLAY[role];
    const initials = profile?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || user?.email?.[0]?.toUpperCase() || "?";

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo / Brand */}
            <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] dark:border-white/[0.06] ${collapsed ? "justify-center px-2" : ""}`}>
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <LayoutGrid className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 blur-md opacity-30" />
                </div>
                {!collapsed && (
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            TaskPro
                        </h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-[0.15em]">
                            Enterprise
                        </p>
                    </div>
                )}
            </div>

            {/* User Profile Card */}
            <div className={`mx-3 mt-4 mb-2 ${collapsed ? "mx-2" : ""}`}>
                <button
                    onClick={() => router.push("/profile")}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-white/[0.04] dark:to-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] hover:border-indigo-300/50 dark:hover:border-indigo-500/20 transition-all duration-300 group ${collapsed ? "p-2 justify-center" : ""}`}
                >
                    <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9 ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/40 transition-all duration-300">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {profile?.full_name || "User"}
                            </p>
                            <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleDisplay.color} ${roleDisplay.bgColor}`}
                            >
                                {roleDisplay.label}
                            </span>
                        </div>
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {!collapsed && (
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-[0.15em] px-3 mb-2">
                        Menu chính
                    </p>
                )}
                {navItems.map((item, index) => {
                    const Icon = ICON_MAP[item.icon] || CheckSquare;
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                                transition-all duration-200 group relative
                                ${collapsed ? "justify-center px-2" : ""}
                                ${isActive
                                    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/5 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/30 dark:border-indigo-500/10"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                                }
                            `}
                            title={collapsed ? item.label : undefined}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full" />
                            )}

                            <Icon
                                className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-200 ${isActive
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                                    }`}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}

                            {/* Badge */}
                            {item.badge && !collapsed && (
                                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                                    {item.badge}
                                </span>
                            )}

                            {/* Tooltip for collapsed */}
                            {collapsed && (
                                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
                                    {item.label}
                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-3 py-3 border-t border-slate-200/60 dark:border-white/[0.06] space-y-0.5">
                {/* Theme toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-200 ${collapsed ? "justify-center px-2" : ""}`}
                    title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
                >
                    <div className="relative w-[18px] h-[18px]">
                        <Sun className={`w-[18px] h-[18px] absolute inset-0 transition-all duration-300 ${theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`} />
                        <Moon className={`w-[18px] h-[18px] absolute inset-0 transition-all duration-300 ${theme === "dark" ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`} />
                    </div>
                    {!collapsed && <span>{theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}</span>}
                </button>

                {/* Sign out */}
                <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.06] transition-all duration-200 ${collapsed ? "justify-center px-2" : ""}`}
                    title="Đăng xuất"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a14]">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar – Desktop */}
            <aside
                className={`
                    hidden lg:flex flex-col border-r border-slate-200/60 dark:border-white/[0.06]
                    bg-white/90 dark:bg-[#0f0f1a]/90 backdrop-blur-xl
                    transition-all duration-300 ease-in-out z-30 flex-shrink-0 relative
                    ${collapsed ? "w-[72px]" : "w-[260px]"}
                `}
            >
                <SidebarContent />
                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-7 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 z-40"
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                    ) : (
                        <ChevronLeft className="w-3 h-3 text-slate-500" />
                    )}
                </button>
            </aside>

            {/* Sidebar – Mobile */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-[#0f0f1a]
                    border-r border-slate-200/60 dark:border-white/[0.06]
                    transform transition-transform duration-300 ease-in-out
                    lg:hidden shadow-2xl
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <SidebarContent />
                {/* Close button */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 border-b border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a14]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div className="hidden sm:flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {navItems.find(
                                    (item) =>
                                        pathname === item.href ||
                                        (item.href !== "/dashboard" && pathname.startsWith(item.href))
                                )?.label || "Dashboard"}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Search button */}
                        <button
                            onClick={() => { setShowSearch(true); setSearchQuery(""); }}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-colors text-sm text-slate-500 dark:text-slate-400 min-w-[180px]"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span className="flex-1 text-left text-xs">Tìm kiếm...</span>
                            <kbd className="text-[10px] font-mono bg-white dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.1]">⌘K</kbd>
                        </button>
                        <button
                            onClick={() => { setShowSearch(true); setSearchQuery(""); }}
                            className="sm:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                            <Search className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
                        </button>

                        {/* Notifications */}
                        <button
                            onClick={() => router.push("/notifications")}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors relative"
                        >
                            <Bell className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0a0a14]" />
                        </button>

                        {/* Theme toggle for header (mobile) */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors lg:hidden"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4.5 h-4.5 text-slate-500" />
                            ) : (
                                <Moon className="w-4.5 h-4.5 text-slate-500" />
                            )}
                        </button>

                        {/* User avatar (mobile) */}
                        <button
                            onClick={() => router.push("/profile")}
                            className="lg:hidden"
                        >
                            <Avatar className="h-8 w-8 ring-1 ring-slate-200 dark:ring-white/[0.1]">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Search Modal (Command Palette) */}
            {showSearch && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowSearch(false)}
                    />
                    {/* Modal */}
                    <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-slate-200/60 dark:border-white/[0.08] overflow-hidden animate-scale-in">
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/60 dark:border-white/[0.06]">
                            <Search className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Tìm kiếm trang, chức năng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && filteredSearchItems.length > 0) {
                                        handleSearchSelect(filteredSearchItems[0].href);
                                    }
                                }}
                                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                            />
                            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.1]">
                                ESC
                            </kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[320px] overflow-y-auto p-2">
                            {filteredSearchItems.length === 0 ? (
                                <div className="flex flex-col items-center py-8 text-center">
                                    <Search className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider px-3 py-1.5">
                                        Trang
                                    </p>
                                    {filteredSearchItems.map((item) => {
                                        const Icon = ICON_MAP[item.icon] || CheckSquare;
                                        const isActive = pathname === item.href;
                                        return (
                                            <button
                                                key={item.href}
                                                onClick={() => handleSearchSelect(item.href)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                                        : "hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300"
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                <span className="font-medium">{item.label}</span>
                                                {isActive && (
                                                    <span className="ml-auto text-[10px] text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                        Đang xem
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
