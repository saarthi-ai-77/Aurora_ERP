export type Role = "ADMIN" | "FACULTY" | "STUDENT";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredAuth(data: LoginResponse): void {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function getDashboardPath(role: Role): string {
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
