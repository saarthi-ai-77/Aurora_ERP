"use client";

import Topbar from "@/components/layout/topbar";
import { Search, Pin, Calendar, Paperclip } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["All", "Academic", "Events", "Workshops", "Exams", "General"];

const NOTICES = [
  { id: 1, title: "Mid-Term Examination Schedule Released", category: "Exams", postedBy: "Examinations Branch", date: "Feb 18, 2026", expiry: "Feb 28, 2026", pinned: true, hasAttachment: true },
  { id: 2, title: "Guest Lecture on AI Ethics", category: "Events", postedBy: "Computer Science Dept", date: "Feb 17, 2026", expiry: "Feb 28, 2026", pinned: false, hasAttachment: false },
  { id: 3, title: "Last Date for Fee Payment", category: "General", postedBy: "Finance Office", date: "Feb 15, 2026", expiry: "Mar 01, 2026", pinned: false, hasAttachment: true },
  { id: 4, title: "Library Timings Extension during Exams", category: "Academic", postedBy: "Chief Librarian", date: "Feb 10, 2026", expiry: "Mar 10, 2026", pinned: false, hasAttachment: false },
];

export default function StudentNoticeboard() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const filtered = NOTICES.filter(n => 
    (activeCat === "All" || n.category === activeCat) &&
    (n.title.toLowerCase().includes(search.toLowerCase()) || n.postedBy.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Topbar title="Noticeboard" breadcrumb={["Noticeboard"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Controls */}
        <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCat === cat 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeCat === cat ? { background: "var(--accent-light)", color: "var(--accent)" } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="search-bar w-full md:w-64">
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="search"
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Notices */}
        <div className="space-y-4">
          {filtered.map(notice => (
            <div key={notice.id} className="card p-5 hover:border-indigo-300 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {notice.pinned && <Pin className="w-4 h-4 text-orange-500 fill-orange-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      {notice.category}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold group-hover:text-indigo-600 transition-colors" style={{ color: "var(--text-primary)" }}>
                    {notice.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Posted by <span className="font-medium">{notice.postedBy}</span>
                  </p>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{notice.date}</span>
                  </div>
                  {notice.hasAttachment && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                      <Paperclip className="w-3 h-3" /> Attachment
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 card text-center text-gray-500">No notices match your criteria.</div>
          )}
        </div>

      </div>
    </>
  );
}
