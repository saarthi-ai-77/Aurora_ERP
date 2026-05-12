"use client";

import { useState } from "react";
import { AttendanceSelection } from "./components/attendance-selection";
import { AttendanceSheet } from "./components/attendance-sheet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function FacultyAttendancePage() {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Breadcrumbs 
          items={[
            { label: "Faculty", href: "/faculty/dashboard" },
            { label: "Attendance marking", href: "/faculty/attendance" }
          ]} 
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Attendance Engine
        </h1>
        <p className="text-gray-500">Manage classroom attendance records with relational integrity.</p>
      </div>

      {!selectedAssignment ? (
        <div className="max-w-2xl mx-auto">
          <AttendanceSelection onSelected={setSelectedAssignment} />
        </div>
      ) : (
        <AttendanceSheet 
          assignment={selectedAssignment} 
          onBack={() => setSelectedAssignment(null)} 
        />
      )}
    </div>
  );
}
