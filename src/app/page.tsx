'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env.client";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "./layout/Header";
import { set } from "zod";
import { TaskManagement } from "./pages/task-management";
import TaskBoard from "./pages/task-board";
export default function Home() {
  const [viewAdmin , setViewAdmin] = useState(false);

  return (
     <div className="min-h-screen bg-gradient-to-b from-background to-muted dark:to-muted">
  <div className="container mx-auto p-4 lg:p-12">
    {/* Header */}
    <Header onNavigateAdmin={() => {setViewAdmin(true)}} >
    
    </Header>

    <TaskManagement></TaskManagement>

    {/* <div className="mb-6">
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-3xl font-black text-foreground">
          Task Management App
        </h2>
        <p className="text-muted-foreground mt-1">
          Organize and track your tasks efficiently
        </p>
      </div>
    </div> */}
  </div>
</div>

  );
}
