"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAcademic } from "@/hooks/use-academic";

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const { fetchContext } = useAcademic();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setLoading(false);
      return;
    }

    async function initAuth() {
      try {
        const response = await authApi.getMe();
        if (response.success) {
          const user = response.data;

          // Role-Based Access Guard (Prevents session leakage across tabs)
          const isPathAdmin = pathname.startsWith('/admin');
          const isPathFaculty = pathname.startsWith('/faculty');
          const isPathStudent = pathname.startsWith('/student');

          if (
            (isPathAdmin && user.role !== 'ADMIN') ||
            (isPathFaculty && user.role !== 'FACULTY') ||
            (isPathStudent && user.role !== 'STUDENT')
          ) {
            console.error(`Session Conflict: Role ${user.role} is not allowed on ${pathname}`);
            setUser(null);
            window.location.href = '/login';
            return;
          }

          setUser(user);
          fetchContext();
        }
      } catch (error: any) {
        // Only clear session on explicit 401 — not on transient network failures
        if (error?.response?.status === 401) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
