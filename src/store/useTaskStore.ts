import { create } from "zustand";

// useTaskStore.ts with debounced refresh
interface TaskState {
  refreshKey: number;
  lastTriggerTime: number;
  triggerRefresh: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  refreshKey: 0,
  lastTriggerTime: 0,
  triggerRefresh: () => {
    const now = Date.now();
    const { lastTriggerTime } = get();
    
    // Debounce: Only trigger if 1 second has passed since last trigger
    if (now - lastTriggerTime > 1000) {
      set((state) => ({ 
        refreshKey: state.refreshKey + 1,
        lastTriggerTime: now
      }));
      console.log("✅ Store: Refresh triggered");
    } else {
      console.log("⏳ Store: Refresh debounced (too soon)");
    }
  },
}));
