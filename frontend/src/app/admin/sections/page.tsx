"use client";

import { useState } from "react";
import { Plus, Search, Building2, Book, Users } from "lucide-react";

const MOCK_SECTIONS = [
  { id: "1", name: "Section A", course: "B.Tech CSE", term: "Semester 1", students: 60, facultyCount: 4 },
  { id: "2", name: "Section B", course: "B.Tech CSE", term: "Semester 1", students: 58, facultyCount: 4 },
  { id: "3", name: "Section A", course: "B.Tech ECE", term: "Semester 3", students: 45, facultyCount: 3 },
];

export default function AdminSectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_SECTIONS.filter((s) =>
    s.course.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Academic Sections
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage courses, terms, and sections.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search course or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((section) => (
          <div key={section.id} className="card p-5 hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-surface-2)" }}>
                  <Building2 className="w-5 h-5" style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{section.name}</h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{section.course}</p>
                </div>
              </div>
              <span className="badge badge-under-review">{section.term}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-medium">{section.students} Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-medium">{section.facultyCount} Faculty</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between" style={{ borderColor: "var(--border)" }}>
              <button className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>Manage Subjects</button>
              <button className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>Edit Details</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full card p-8 text-center" style={{ color: "var(--text-muted)" }}>
            No sections found.
          </div>
        )}
      </div>
    </div>
  );
}
