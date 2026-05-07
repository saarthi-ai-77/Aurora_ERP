"use client";

import { useState } from "react";
import { Plus, Search, Megaphone, Calendar, Pin } from "lucide-react";

const MOCK_NOTICES = [
  { id: "1", title: "System Maintenance Downtime", category: "GENERAL", date: "Oct 22, 2026", content: "The ERP portal will be down for scheduled maintenance from 2:00 AM to 4:00 AM on Oct 25th.", isPinned: true },
  { id: "2", title: "Mid-Term Examination Schedule", category: "EXAMS", date: "Oct 20, 2026", content: "Examinations will commence Nov 10th. Faculty must submit papers by Nov 1st.", isPinned: true },
];

export default function AdminNoticeboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Admin Noticeboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Post and manage campus-wide announcements.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Post Notice</span>
        </button>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_NOTICES.map((notice) => (
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
                    {notice.isPinned && <Pin className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
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
              <button className="btn-secondary text-xs px-3 py-1.5">Edit</button>
            </div>
            <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
              {notice.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
