"use client";

import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Loader2 } from "lucide-react";
import { assignmentsApi } from "@/lib/api/assignments.api";

export default function StudentCalendar() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: () => assignmentsApi.getStudentAssignments(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--topbar-height))]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const assignments = response?.data || [];
  const events = assignments.map((a: any) => {
    const dueDate = new Date(a.dueDate);
    return {
      id: a.id,
      title: a.title,
      date: dueDate.getDate().toString(),
      month: dueDate.toLocaleDateString("en-US", { month: "short" }),
      time: dueDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      type: a.displayStatus || "Deadline",
      location: a.subject ? `${a.subject.code} - ${a.subject.name}` : "Online",
      rawDate: dueDate,
    };
  }).sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());

  const currentMonthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <Topbar title="Calendar" breadcrumb={["Calendar"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between card p-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{currentMonthYear}</h2>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
              <button className="text-sm font-medium px-2 py-1 rounded hover:bg-gray-100">Today</button>
              <button className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary">Month View</button>
            <button className="btn-primary">Agenda View</button>
          </div>
        </div>

        {/* Agenda View */}
        <div className="card overflow-hidden">
          <div className="p-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface-2)" }}>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Upcoming Deadlines</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {events.map((event: any) => (
              <div key={event.id} className="p-5 flex items-start gap-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500 uppercase">{event.month}</span>
                  <span className="text-xl font-bold" style={{ color: "var(--accent)" }}>{event.date}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{event.title}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-8 text-center text-gray-500">No upcoming events this month.</div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
