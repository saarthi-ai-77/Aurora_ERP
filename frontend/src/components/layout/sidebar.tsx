"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Users,
  Bell,
  Settings,
  LogOut,
  User,
  BarChart3,
  FileText,
  Building2,
  Menu,
  X,
  Calendar,
  BookMarked,
  GraduationCap,
  Library,
  UserCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearStoredAuth, getStoredUser, Role } from "@/lib/auth";
import { authApi } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Profile",        href: "profile",      icon: User,           roles: ["STUDENT"] },
  { label: "Dashboard",      href: "dashboard",    icon: LayoutDashboard, roles: ["FACULTY", "ADMIN"] },
  { label: "Courses",        href: "courses",      icon: BookMarked,     roles: ["STUDENT"] },
  { label: "Assessments",    href: "assignments",  icon: BookOpen,       roles: ["STUDENT"] },
  { label: "Calendar",       href: "calendar",     icon: Calendar,       roles: ["STUDENT"] },
  { label: "Course Catalog", href: "catalog",      icon: GraduationCap,  roles: ["STUDENT"] },
  { label: "Attendance",     href: "attendance",   icon: ClipboardList,  roles: ["STUDENT", "FACULTY"] },
  { label: "Assignments",    href: "assignments",  icon: BookOpen,       roles: ["FACULTY"] },
  { label: "Noticeboard",    href: "noticeboard",  icon: Bell,           roles: ["STUDENT", "FACULTY", "ADMIN"] },
  { label: "Analytics",      href: "analytics",    icon: BarChart3,      roles: ["FACULTY", "ADMIN"] },
  { label: "Users",          href: "users",        icon: Users,          roles: ["ADMIN"] },
  { label: "Sections",            href: "sections",            icon: Building2,  roles: ["ADMIN"] },
  { label: "Subjects",            href: "subjects",            icon: Library,    roles: ["ADMIN"] },
  { label: "Faculty Assignments", href: "faculty-assignments", icon: UserCheck,  roles: ["ADMIN"] },
  { label: "Audit Logs",          href: "audit-logs",          icon: FileText,   roles: ["ADMIN"] },
  { label: "Settings",       href: "settings",     icon: Settings,       roles: ["ADMIN"] },
  { label: "Security",       href: "settings/security", icon: Shield,   roles: ["ADMIN", "FACULTY", "STUDENT"] },
];

interface SidebarProps {
  role: Role;
  basePath: string;
}

export default function Sidebar({ role, basePath }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearStoredAuth();
    router.push("/login");
  };

  // Generate avatar initials from name, but wait for mount to prevent hydration mismatch
  const initials = mounted && user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const displayName = mounted && user?.name ? user.name : "User";

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        width: "var(--sidebar-width)",
      }}
    >
      {/* User profile section */}
      <div
        className="flex flex-col items-center py-6 px-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Avatar circle */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-3 text-white font-semibold text-lg"
          style={{ background: "var(--accent)" }}
        >
          {initials}
        </div>
        <p
          className="text-sm font-semibold text-center leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {displayName}
        </p>
        <span
          className="text-xs mt-1 px-2 py-0.5 rounded-full"
          style={{
            background: "var(--bg-surface-2)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            fontSize: "10px",
            fontWeight: 500,
          }}
        >
          Active
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const href = `${basePath}/${item.href}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn("nav-item", isActive && "active")}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "8px 0" }}>
        <button
          id="logout-button"
          onClick={handleLogout}
          className="nav-item w-full text-left"
          style={{ color: "var(--red)" }}
        >
          <LogOut style={{ width: "15px", height: "15px", flexShrink: 0 }} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        id="mobile-menu-toggle"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative h-full">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 z-10 p-1"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
