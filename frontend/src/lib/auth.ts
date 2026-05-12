import { create } from 'zustand';
import { AuthUser, LoginResponseData } from '@shared/types/auth.types';

export type Role = "ADMIN" | "FACULTY" | "STUDENT";

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
}));

// Backward compatibility helpers, though components should migrate to useAuthStore
export function getStoredUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

export function setStoredAuth(data: LoginResponseData): void {
  useAuthStore.getState().setUser(data.user);
}

export function clearStoredAuth(): void {
  useAuthStore.getState().clearAuth();
}

export function getDashboardPath(role: Role | string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "FACULTY":
      return "/faculty/dashboard";
    case "STUDENT":
    default:
      return "/student/dashboard";
  }
}
