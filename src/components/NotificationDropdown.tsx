"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useTask } from "@/hooks/use-task";

interface Notification {
  id: string;
  type: 'overdue' | 'due_today' | 'completed';
  title: string;
  message: string;
  taskId: string;
  timestamp: Date;
}

export function NotificationDropdown() {
  const { tasks } = useTask();
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const notifs: Notification[] = [];

    tasks.forEach(task => {
      const dueDate = new Date(task.due_date);
      const isOverdue = dueDate < now && task.status !== 'completed';
      const isDueToday = dueDate.toDateString() === today && task.status !== 'completed';

      if (isOverdue) {
        notifs.push({
          id: `overdue-${task.id}`,
          type: 'overdue',
          title: 'Task Overdue',
          message: `"${task.title}" was due ${Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`,
          taskId: task.id!,
          timestamp: dueDate
        });
      } else if (isDueToday) {
        notifs.push({
          id: `due-today-${task.id}`,
          type: 'due_today',
          title: 'Due Today',
          message: `"${task.title}" is due today`,
          taskId: task.id!,
          timestamp: dueDate
        });
      }
    });

    // Add completed task notifications (last 3)
    const completedTasks = tasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .slice(0, 3);

    completedTasks.forEach(task => {
      notifs.push({
        id: `completed-${task.id}`,
        type: 'completed',
        title: 'Task Completed',
        message: `"${task.title}" has been completed`,
        taskId: task.id!,
        timestamp: new Date(task.due_date)
      });
    });

    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [tasks]);

  const unreadCount = notifications.filter(n => n.type === 'overdue' || n.type === 'due_today').length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'due_today':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <p className="text-sm text-gray-500">{notifications.length} notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-start gap-3 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
