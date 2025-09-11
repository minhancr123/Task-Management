"use client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading) {
      // Mark auth as resolved quickly
      if (!authReady) setAuthReady(true);
      if (!user) {
        router.push("/auth");
      }
    }
  }, [user, loading, router, authReady]);

  // Safety timeout: if something keeps loading >3s, release spinner
  useEffect(() => {
    if (loading && !authReady) {
      timeoutRef.current = setTimeout(() => {
        setAuthReady(true);
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, authReady]);

  if (loading && !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Đang xác thực...
          </p>
        </div>
      </div>
    );
  }

  // if (!user) {
  //   return (
  //     fallback || (
  //       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
  //         <div className="text-center">
  //           <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
  //             Authentication Required
  //           </h2>
  //           <p className="text-gray-600 dark:text-gray-400">
  //             Please log in to access this page.
  //           </p>
  //           <Button variant="outline" className="mt-4" onClick={() => router.push("/auth")}>
  //             Go to Login
  //           </Button>
  //         </div>
  //       </div>
  //     )
  //   );
  // }

  return <>{children}</>;
}
