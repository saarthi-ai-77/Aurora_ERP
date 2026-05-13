"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import Topbar from "@/components/layout/topbar";
import { Users, Building2, Bell, FileText, Shield, Activity, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => analyticsApi.getAdminSummary(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--topbar-height))]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const data = analytics?.data || { counts: { students: 0, faculty: 0, sections: 0 }, recentActivity: [] };
  
  const STATS = [
    { id: "stat-students", label: "Total Students",    value: data.counts.students,  icon: Users,     color: "#3b82f6" },
    { id: "stat-faculty",  label: "Faculty Members",   value: data.counts.faculty,   icon: Shield,    color: "#10b981" },
    { id: "stat-sections", label: "Active Sections",   value: data.counts.sections,  icon: Building2, color: "#8b5cf6" },
    { id: "stat-activity", label: "Global Activity",   value: data.recentActivity.length, icon: Bell,  color: "#f59e0b" },
  ];

  const QUICK_ACTIONS = [
    { id: "action-add-user",       label: "Add User",       icon: Users,     href: "/admin/users" },
    { id: "action-post-notice",    label: "Post Notice",    icon: Bell,      href: "/admin/noticeboard" },
    { id: "action-create-section", label: "Manage Sections", icon: Building2, href: "/admin/sections" },
    { id: "action-audit-logs",     label: "Audit Logs",     icon: FileText,  href: "/admin/audit-logs" },
  ];

  return (
    <>
      <Topbar title="Admin Dashboard" breadcrumb={["Dashboard"]} />
      <div className="p-6 space-y-6 bg-gray-50 min-h-[calc(100vh-var(--topbar-height))] animate-in fade-in duration-500">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.id} className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-default">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</span>
                <s.icon className="w-5 h-5 opacity-40" style={{ color: s.color }} />
              </div>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border shadow-sm h-fit">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-all text-center group shadow-sm"
                >
                  <a.icon className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600 uppercase tracking-wider">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-5 border-b bg-gray-50/50">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-900">Recent System Activity</h2>
            </div>
            <div className="divide-y">
              {data.recentActivity.map((r: any) => (
                <div key={r.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-indigo-600 border border-indigo-100">
                    {r.actor.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900">{r.actor}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight">{r.action.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{new Date(r.time).toLocaleString()}</span>
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <div className="py-20 text-center text-gray-400 italic">No recent activity found.</div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-center">
              <Link href="/admin/audit-logs" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                View All Audit Logs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
