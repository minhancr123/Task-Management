'use client';
import { useAuth } from "@/hooks/use-auth";
import { Header } from "./layout/Header";
import TaskManagement from "./pages/task-management";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import GloBalPresence from "@/context/GloBalPresence";
import FloatingActionButton from "@/components/FloatingActionButton";

export default function Home() {
  return (
   
      <div className="min-h-screen bg-gradient-to-b from-background to-muted dark:to-muted">
        <div className="container mx-auto p-4 lg:p-12">
          {/* Header */}
          <Header />
          
          {/* Main Content */}
          <TaskManagement />
          
          {/* Floating Action Button */}
          {/* <FloatingActionButton /> */}
        </div>
      </div>
  );
}
