"use client";

import Topbar from "@/components/layout/topbar";
import { Search, Filter, BookOpen } from "lucide-react";
import { useState } from "react";

const CATALOG = [
  { id: "AI401", name: "Artificial Intelligence Ethics", credits: 3, faculty: "Dr. R. Singh", seats: 12, totalSeats: 60, dept: "Computer Science", term: "Term 5", preReq: "None" },
  { id: "MG305", name: "Principles of Management", credits: 3, faculty: "Prof. L. Menon", seats: 45, totalSeats: 120, dept: "Business Admin", term: "Term 5", preReq: "None" },
  { id: "CS412", name: "Cloud Computing Architectures", credits: 4, faculty: "Sai Rahul Mallidi", seats: 0, totalSeats: 60, dept: "Computer Science", term: "Term 5", preReq: "CS303" },
];

export default function StudentCatalog() {
  const [search, setSearch] = useState("");

  const filtered = CATALOG.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Topbar title="Course Catalog" breadcrumb={["Catalog"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Controls */}
        <div className="flex items-center justify-between card p-4">
          <div className="search-bar w-full max-w-md">
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="search"
              placeholder="Search by course name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <button className="btn-secondary">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Catalog List */}
        <div className="space-y-4">
          {filtered.map(course => {
            const isFull = course.seats === 0;
            return (
              <div key={course.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{course.id}</span>
                    <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{course.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{course.dept} • {course.credits} Credits • {course.faculty}</p>
                  <p className="text-xs text-gray-400">Prerequisites: {course.preReq}</p>
                </div>
                
                <div className="flex flex-col md:items-end gap-3 md:w-48 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Seats Available</p>
                    <p className={`text-lg font-bold ${isFull ? "text-red-500" : "text-green-600"}`}>
                      {course.seats} <span className="text-sm font-normal text-gray-400">/ {course.totalSeats}</span>
                    </p>
                  </div>
                  <button 
                    disabled={isFull}
                    className="btn-primary w-full md:w-auto"
                    style={{ opacity: isFull ? 0.5 : 1, cursor: isFull ? "not-allowed" : "pointer" }}
                  >
                    {isFull ? "Waitlist" : "Register"}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 card text-center text-gray-500">No courses match your search.</div>
          )}
        </div>

      </div>
    </>
  );
}
