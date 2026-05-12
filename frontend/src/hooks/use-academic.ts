"use client";

import { create } from "zustand";
import { academicApi } from "@/lib/api";

interface AcademicState {
  currentSession: any | null;
  myContext: any | null;
  isLoading: boolean;
  error: string | null;
  fetchContext: () => Promise<void>;
}

export const useAcademic = create<AcademicState>((set) => ({
  currentSession: null,
  myContext: null,
  isLoading: false,
  error: null,

  fetchContext: async () => {
    set({ isLoading: true, error: null });
    try {
      const [sessionRes, contextRes] = await Promise.all([
        academicApi.getActiveSession(),
        academicApi.getMyContext(),
      ]);

      if (sessionRes.success && contextRes.success) {
        set({ 
          currentSession: sessionRes.data, 
          myContext: contextRes.data, 
          isLoading: false 
        });
      } else {
        set({ error: "Failed to fetch academic context", isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || "An error occurred", isLoading: false });
    }
  },
}));
