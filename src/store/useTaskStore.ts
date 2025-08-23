import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Enhanced TaskStore with better performance and caching
interface TaskState {
  refreshKey: number;
  lastTriggerTime: number;
  isRefreshing: boolean;
  pendingRefresh: boolean;
  triggerRefresh: () => void;
  setRefreshing: (isRefreshing: boolean) => void;
  forceTriggerRefresh: () => void;
}

export const useTaskStore = create<TaskState>()(
  subscribeWithSelector((set, get) => ({
    refreshKey: 0,
    lastTriggerTime: 0,
    isRefreshing: false,
    pendingRefresh: false,
    
    triggerRefresh: () => {
      const now = Date.now();
      const { lastTriggerTime, isRefreshing } = get();
      
      // If currently refreshing, mark as pending
      if (isRefreshing) {
        set({ pendingRefresh: true });
        console.log("⏳ Store: Refresh marked as pending (currently refreshing)");
        return;
      }
      
      // Debounce: Only trigger if 1 second has passed since last trigger
      if (now - lastTriggerTime > 1000) {
        set((state) => ({ 
          refreshKey: state.refreshKey + 1,
          lastTriggerTime: now,
          pendingRefresh: false
        }));
        console.log("✅ Store: Refresh triggered", get().refreshKey);
      } else {
        console.log("⏳ Store: Refresh debounced (too soon)");
      }
    },

    forceTriggerRefresh: () => {
      const now = Date.now();
      set((state) => ({ 
        refreshKey: state.refreshKey + 1,
        lastTriggerTime: now,
        pendingRefresh: false
      }));
      console.log("🚀 Store: Force refresh triggered", get().refreshKey);
    },

    setRefreshing: (isRefreshing: boolean) => {
      const { pendingRefresh } = get();
      
      set({ isRefreshing });
      
      // If refresh finished and there's a pending refresh, trigger it
      if (!isRefreshing && pendingRefresh) {
        console.log("🔄 Store: Executing pending refresh");
        setTimeout(() => {
          const now = Date.now();
          set((state) => ({ 
            refreshKey: state.refreshKey + 1,
            lastTriggerTime: now,
            pendingRefresh: false
          }));
        }, 100);
      }
    }
  }))
);

// Subscribe to refresh key changes for debugging
useTaskStore.subscribe(
  (state) => state.refreshKey,
  (refreshKey) => {
    console.log("🔄 TaskStore: RefreshKey changed to", refreshKey);
  }
);
