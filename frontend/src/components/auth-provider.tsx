"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAcademic } from "@/hooks/use-academic";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const { fetchContext } = useAcademic();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        setLoading(false);
        return;
      }
      try {
        const response = await authApi.getMe();
        if (response.success) {
          setUser(response.data);
          // Fetch academic context after successful auth
          fetchContext();
        }
      } catch (error) {
        console.error("Auth initialization failed", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-gray-500">Initializing Aurora ERP...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
