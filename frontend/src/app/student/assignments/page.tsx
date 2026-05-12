"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { StudentAssignmentModal } from "./components/student-assignment-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, FileText, Clock, CheckCircle, AlertTriangle, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => assignmentsApi.getStudentAssignments(),
  });

  if (isLoading) return <Loader2 className="animate-spin mx-auto my-12" />;

  const list = assignments?.data || [];
  const filtered = list.filter((a: any) => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Assessments</h1>
        <p className="text-gray-500">Track your academic submissions, grades, and feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  className="w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Search by subject or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="pt-2 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Quick Stats</p>
                <StatRow label="Pending" value={list.filter((a: any) => !a.submissions?.[0]).length} color="text-amber-600" />
                <StatRow label="Graded" value={list.filter((a: any) => a.submissions?.[0]?.gradingStatus === 'GRADED').length} color="text-green-600" />
                <StatRow label="Total" value={list.length} color="text-gray-900" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-4">
          {filtered.map((assignment: any) => (
            <AssignmentRow 
              key={assignment.id} 
              assignment={assignment} 
              onClick={() => setSelectedAssignment(assignment)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No assessments found.</p>
            </div>
          )}
        </div>
      </div>

      {selectedAssignment && (
        <StudentAssignmentModal 
          assignment={selectedAssignment} 
          onClose={() => setSelectedAssignment(null)} 
        />
      )}
    </div>
  );
}

function AssignmentRow({ assignment, onClick }: { assignment: any, onClick: () => void }) {
  const submission = assignment.submissions?.[0];
  const status = submission?.gradingStatus || 'NOT_SUBMITTED';
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = !submission && new Date() > dueDate;

  return (
    <Card 
      className="group hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer overflow-hidden border-l-4"
      style={{ borderLeftColor: getStatusColor(status, isOverdue) }}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono">{assignment.subject.code}</Badge>
              <span className="text-xs text-gray-400">{assignment.subject.name}</span>
            </div>
            <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
            <div className="flex items-center gap-4 text-xs pt-1">
              <span className={cn("flex items-center gap-1", isOverdue ? "text-red-500 font-bold" : "text-gray-500")}>
                <Clock className="w-3 h-3" /> Due {dueDate.toLocaleDateString()}
              </span>
              <StatusBadge status={status} isOverdue={isOverdue} />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {status === 'GRADED' && (
              <div className="text-right pr-4 border-r">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Grade</p>
                <p className="text-xl font-black text-indigo-600">{submission.finalMarks}/{assignment.maxMarks}</p>
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn("text-sm font-bold", color)}>{value}</span>
    </div>
  );
}

function StatusBadge({ status, isOverdue }: { status: string, isOverdue: boolean }) {
  if (isOverdue) return <Badge className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>;
  
  const variants: any = {
    NOT_SUBMITTED: "bg-gray-100 text-gray-600",
    SUBMITTED: "bg-blue-100 text-blue-700",
    UNDER_REVIEW: "bg-amber-100 text-amber-700",
    GRADED: "bg-green-100 text-green-700",
    REOPENED: "bg-purple-100 text-purple-700",
    MISSED: "bg-red-100 text-red-700",
  };

  return (
    <Badge className={cn("capitalize border-transparent", variants[status])} variant="outline">
      {status.replace('_', ' ').toLowerCase()}
    </Badge>
  );
}

function getStatusColor(status: string, isOverdue: boolean) {
  if (isOverdue) return "#ef4444";
  switch (status) {
    case 'GRADED': return "#22c55e";
    case 'SUBMITTED': return "#3b82f6";
    case 'UNDER_REVIEW': return "#f59e0b";
    case 'REOPENED': return "#a855f7";
    default: return "#e5e7eb";
  }
}
