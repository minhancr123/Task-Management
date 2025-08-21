"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { LoginForm } from "./login-form";
import SignupForm from "./signup-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Zap, Shield, ArrowRight } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  const features = [
    {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      title: "Task Management",
      description: "Organize and track your tasks efficiently"
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Team Collaboration",
      description: "Work together with your team members"
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      title: "Real-time Updates",
      description: "Get instant notifications and updates"
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      title: "Secure & Private",
      description: "Your data is protected and encrypted"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 min-h-screen items-center">
          
          {/* Left Side - Welcome & Features */}
          <div className="space-y-8 lg:pr-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Welcome to TaskFlow
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Manage Your
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tasks Efficiently
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Streamline your workflow, boost productivity, and achieve your goals with our modern task management platform.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
                    <div className="flex-shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl">
              <CardContent className="p-8">
                {/* Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-8">
                  <Button
                    variant={isLoginMode ? "default" : "ghost"}
                    className={`flex-1 ${isLoginMode 
                      ? "bg-white dark:bg-slate-600 shadow-sm" 
                      : "text-gray-600 dark:text-gray-400"
                    }`}
                    onClick={() => setIsLoginMode(true)}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={!isLoginMode ? "default" : "ghost"}
                    className={`flex-1 ${!isLoginMode 
                      ? "bg-white dark:bg-slate-600 shadow-sm" 
                      : "text-gray-600 dark:text-gray-400"
                    }`}
                    onClick={() => setIsLoginMode(false)}
                  >
                    Sign Up
                  </Button>
                </div>

                {/* Welcome Text */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isLoginMode ? "Welcome Back!" : "Create Account"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isLoginMode 
                      ? "Sign in to continue to TaskFlow" 
                      : "Join TaskFlow and boost your productivity"
                    }
                  </p>
                </div>

                {/* Forms */}
                {isLoginMode ? (
                  <LoginForm onToggleMode={() => setIsLoginMode(false)} />
                ) : (
                  <SignupForm onToggleMode={() => setIsLoginMode(true)} />
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    By continuing, you agree to our{" "}
                    <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
