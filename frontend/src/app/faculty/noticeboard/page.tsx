"use client";

import { useState } from "react";
import { Search, Megaphone, Calendar, Pin } from "lucide-react";

const MOCK_NOTICES = [
  {
    id: "1",
    title: "Mid-Term Examination Schedule Announced",
    category: "EXAMS",
    date: "Oct 20, 2026",
    content: "The mid-term examinations for all B.Tech branches will commence from November 10th. Please submit your question papers to the examination branch by Nov 1st.",
    isPinned: true,
  },
  {
    id: "2",
    title: "Faculty Development Program on AI",
    category: "WORKSHOPS",
    date: "Oct 18, 2026",
    content: "A 3-day FDP on Artificial Intelligence and its applications in modern education will be held in the main seminar hall starting Oct 25th.",
    isPinned: false,
  },
  {
    id: "3",
    title: "Update regarding Biometric Attendance",
    category: "GENERAL",
    date: "Oct 15, 2026",
    content: "All faculty are requested to ensure their biometric attendance is marked before 9:00 AM daily. Any discrepancies should be reported to HR immediately.",
    isPinned: false,
  },
];

export default function FacultyNoticeboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_NOTICES.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="card p-4 flex items-center justify-between">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="hidden md:flex gap-2">
           <select className="erp-input w-40 bg-gray-50">
             <option value="all">All Categories</option>
             <option value="EXAMS">Exams</option>
             <option value="WORKSHOPS">Workshops</option>
             <option value="GENERAL">General</option>
           </select>
        </div>
      </div>

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
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {notice.date}
                      </span>
                      <span className="badge badge-under-review">{notice.category}</span>
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
            No notices found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
