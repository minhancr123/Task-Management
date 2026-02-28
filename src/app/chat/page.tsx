"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { RealtimeChat } from "@/components/realtime-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Users, Hash, MessageSquare, Circle } from "lucide-react";
import { toast } from "sonner";
import { Profile } from "@/lib/types/database";

interface ChatSession {
  id: string;
  type: 'dm' | 'group';
  name: string;
  participants?: string[]; // user_ids
}

export default function ChatPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [search, setSearch] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Fetch all profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("*").neq("id", user?.id || "");
      if (data) setProfiles(data as Profile[]);
    };
    if (user) fetchProfiles();
  }, [user]);

  // Global Presence for determining who is "Online" in the app
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("global_presence", {
      config: { presence: { key: user.id } }
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const userIds = new Set(Object.keys(state));
      setOnlineUserIds(userIds);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => { channel.unsubscribe(); };
  }, [user]);

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const startDM = (otherUser: Profile) => {
    // Create a unique room ID for DM: sort user IDs to ensure potential consistency
    const ids = [user?.id, otherUser.id].sort();
    const roomId = `dm_${ids[0]}_${ids[1]}`;

    setSelectedSession({
      id: roomId,
      type: 'dm',
      name: otherUser.full_name || otherUser.email || "Unknown",
      participants: [otherUser.id]
    });
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const groupSlug = newGroupName.toLowerCase().replace(/\s+/g, '-');
    const roomId = `group_${groupSlug}_${Date.now()}`; // basic unique ID

    setSelectedSession({
      id: roomId,
      type: 'group',
      name: newGroupName,
      participants: []
    });

    setIsCreateGroupOpen(false);
    setNewGroupName("");
    toast.success(`Joined group channel: ${newGroupName}`);
  };

  const filteredProfiles = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const onlineProfiles = filteredProfiles.filter(p => onlineUserIds.has(p.id));
  const offlineProfiles = filteredProfiles.filter(p => !onlineUserIds.has(p.id));

  if (!user) return <div className="p-8 text-center">Please log in to chat.</div>;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Messages</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCreateGroupOpen(true)} title="Create Group Channel">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search people..."
              className="pl-9 bg-slate-50 dark:bg-slate-900 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-6">
            {/* Online Users */}
            {onlineProfiles.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">Online - {onlineProfiles.length}</h3>
                <div className="space-y-1">
                  {onlineProfiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => startDM(profile)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left ${selectedSession?.name === profile.full_name ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(profile.full_name || "?")}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{profile.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{profile.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Users / Offline */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">All Users</h3>
              <div className="space-y-1">
                {offlineProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => startDM(profile)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left ${selectedSession?.name === profile.full_name ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700 grayscale opacity-70">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(profile.full_name || "?")}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-slate-600 dark:text-slate-400">{profile.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{profile.role}</p>
                    </div>
                  </button>
                ))}
                {offlineProfiles.length === 0 && onlineProfiles.length === 0 && (
                  <p className="text-xs text-slate-400 px-2">No users found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-lg">
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
              {selectedSession.type === 'dm' ? (
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">{getInitials(selectedSession.name)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Hash className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{selectedSession.name}</h3>
                <div className="flex items-center gap-1.5">
                  {selectedSession.type === 'dm' && onlineUserIds.has(selectedSession.participants?.[0] || "") ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {selectedSession.type === 'group' ? 'Group Channel' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Realtime Chat Component */}
            <div className="flex-1 overflow-hidden relative">
              <RealtimeChat
                key={selectedSession.id} // Re-mount on session change
                roomName={selectedSession.id}
                username={user.email?.split('@')[0] || "User"} // Use email handle for now as generic username
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Select a conversation</h3>
            <p className="text-sm max-w-xs text-center mt-2">Choose a user from the sidebar to start chatting or create a new group.</p>
          </div>
        )}
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group Channel</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">Group Name</label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Marketing Team, Lunch Plans..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!newGroupName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
