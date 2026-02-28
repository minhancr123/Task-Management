"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { LoginForm } from "./login-form";
import SignupForm from "./signup-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Users,
  Zap,
  Shield,
  Sparkles,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
            <div className="absolute inset-1 rounded-full border-2 border-t-indigo-400 animate-spin" />
          </div>
          <p className="text-sm text-slate-400 animate-pulse">
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  if (user) return null;

  const features = [
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Quản lý công việc",
      description: "Kanban board, drag & drop, phân công thông minh",
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Cộng tác nhóm",
      description: "Chat realtime, phòng ban, phân quyền RBAC",
      color: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Báo cáo & KPI",
      description: "Dashboard thống kê, đánh giá hiệu suất",
      color: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-500/10 text-violet-400",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Bảo mật cao",
      description: "Supabase RLS, audit logs, mã hóa end-to-end",
      color: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#07070f]">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Animated gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px] animate-float" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px]"
          style={{ animation: "float 5s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-cyan-600/10 blur-[100px]"
          style={{ animation: "float 6s ease-in-out infinite 1s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 min-h-[calc(100vh-4rem)] items-center">
          {/* Left Side – Hero */}
          <div className="space-y-8 order-2 lg:order-1 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-indigo-400 mr-2" />
              <span className="text-sm font-medium text-indigo-300">
                Enterprise Task Management
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Nâng tầm</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  hiệu suất làm việc
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
                Hệ thống quản lý công việc thông minh với phân quyền RBAC, chat
                realtime, Kanban board và đánh giá KPI toàn diện.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-2">
              {[
                { value: "6", label: "Cấp phân quyền" },
                { value: "15+", label: "Modules" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side – Auth Card */}
          <div
            className="flex justify-center lg:justify-end order-1 lg:order-2 animate-fade-in-up"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="w-full max-w-[440px]">
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-60" />

                <Card className="relative rounded-3xl border-white/[0.08] bg-[#12121f]/80 backdrop-blur-2xl shadow-2xl shadow-black/40">
                  <CardContent className="p-7 sm:p-8">
                    {/* Mode Toggle */}
                    <div className="flex rounded-2xl bg-white/[0.04] p-1 mb-8 border border-white/[0.06]">
                      <Button
                        variant="ghost"
                        className={`flex-1 rounded-xl h-10 text-sm font-medium transition-all duration-300 ${isLoginMode
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:text-white"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                          }`}
                        onClick={() => setIsLoginMode(true)}
                      >
                        Đăng nhập
                      </Button>
                      <Button
                        variant="ghost"
                        className={`flex-1 rounded-xl h-10 text-sm font-medium transition-all duration-300 ${!isLoginMode
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:text-white"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                          }`}
                        onClick={() => setIsLoginMode(false)}
                      >
                        Đăng ký
                      </Button>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-7">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {isLoginMode ? "Chào mừng trở lại!" : "Tạo tài khoản"}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {isLoginMode
                          ? "Đăng nhập để tiếp tục với TaskPro"
                          : "Tham gia TaskPro để tăng hiệu suất"}
                      </p>
                    </div>

                    {/* Forms */}
                    {isLoginMode ? (
                      <LoginForm
                        onToggleMode={() => setIsLoginMode(false)}
                      />
                    ) : (
                      <SignupForm
                        onToggleMode={() => setIsLoginMode(true)}
                      />
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/[0.06]">
                      <p className="text-center text-xs text-slate-500">
                        Bằng việc tiếp tục, bạn đồng ý với{" "}
                        <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                          Điều khoản dịch vụ
                        </a>{" "}
                        và{" "}
                        <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                          Chính sách bảo mật
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
