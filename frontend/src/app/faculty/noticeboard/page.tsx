"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Megaphone, Calendar, Pin } from "lucide-react";
import { noticeboardApi } from "@/lib/api/noticeboard.api";

const CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: "Academic",
  EVENTS: "Events",
  WORKSHOPS: "Workshops",
  HACKATHONS: "Hackathons",
  EXAMS: "Exams",
  GENERAL: "General",
};

export default function FacultyNoticeboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["noticeboard", "faculty"],
    queryFn: () => noticeboardApi.getMyNotices(),
  });

  const notices: any[] = data?.data ?? [];

  const filtered = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Noticeboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Important announcements and updates for faculty members.
          </p>
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="search-bar flex-1 max-w-sm">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="erp-input w-44"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading notices…
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((notice) => (
              <div key={notice.id} className="card p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                    >
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        {notice.title}
                        {notice.isPinned && (
                          <Pin className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                        )}
                      </h3>
                      <div
                        className="flex items-center gap-3 mt-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {notice.publishedAt
                            ? new Date(notice.publishedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Draft"}
                        </span>
                        <span className="badge badge-under-review">
                          {CATEGORY_LABELS[notice.category] ?? notice.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {notice.content}
                </p>
              </div>
            ))
          ) : (
            <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
              No notices found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
