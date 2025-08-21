"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Flag, Target, X } from "lucide-react";
import { CreateTaskDialog } from "../pages/task-create-dialog";

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const actions = [
    {
      icon: Target,
      label: "Quick Task",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => setShowCreateDialog(true)
    },
    {
      icon: Calendar,
      label: "Scheduled",
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => setShowCreateDialog(true)
    },
    {
      icon: Flag,
      label: "Priority",
      color: "bg-red-500 hover:bg-red-600",
      action: () => setShowCreateDialog(true)
    }
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Action buttons */}
        <div className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          {actions.map((action, index) => (
            <div
              key={action.label}
              className="flex items-center gap-3 group"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </div>
              <Button
                size="sm"
                className={`h-12 w-12 rounded-full shadow-lg ${action.color} text-white border-0 hover:scale-110 transition-all duration-200`}
                onClick={action.action}
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Main FAB */}
        <Button
          size="lg"
          className={`h-14 w-14 rounded-full shadow-2xl border-0 transition-all duration-300 ${
            isOpen 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          } text-white hover:scale-110`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog 
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTask={() => {}}
        categories={["Work", "Personal", "Study"]}
      />
    </>
  );
}
