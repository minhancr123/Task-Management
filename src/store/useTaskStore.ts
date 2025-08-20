import { create } from "zustand";

// useTaskStore.ts
interface TaskState {
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
