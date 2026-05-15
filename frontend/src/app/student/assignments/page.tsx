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
  const [view, setView] = useState<'ONGOING' | 'ALL'>('ONGOING');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => assignmentsApi.getStudentAssignments(),
  });

  const list = assignments?.data || [];
  
  const ongoing = list.filter((a: any) => a.displayStatus === 'ONGOING');
  const filtered = view === 'ONGOING' ? ongoing : list;

  const displayList = filtered.filter((a: any) => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">My Assessments</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Track your academic journey and deadlines</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner border-2 border-gray-100">
          <button 
            onClick={() => setView('ONGOING')}
            className={cn(
              "px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
              view === 'ONGOING' ? "bg-white text-indigo-600 shadow-md" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Ongoing ({ongoing.length})
          </button>
          <button 
            onClick={() => setView('ALL')}
            className={cn(
              "px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
              view === 'ALL' ? "bg-white text-indigo-600 shadow-md" : "text-gray-400 hover:text-gray-600"
            )}
          >
            All History ({list.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1 space-y-8">
          <div className="relative group">
            <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-sm outline-none font-bold placeholder:text-gray-300"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card className="border-2 border-gray-100 shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-500">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <StatRow label="Ongoing" value={ongoing.length} color="text-indigo-600" />
              <StatRow label="Missed" value={list.filter((a: any) => a.displayStatus === 'MISSED').length} color="text-rose-600" />
              <StatRow label="Submitted" value={list.filter((a: any) => a.displayStatus === 'SUBMITTED').length} color="text-emerald-600" />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-6">
          {displayList.map((assignment: any) => (
            <AssignmentRow 
              key={assignment.id} 
              assignment={assignment} 
              onClick={() => setSelectedAssignment(assignment)}
            />
          ))}
          {displayList.length === 0 && (
            <div className="text-center py-24 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-100">
              <BookOpen className="w-20 h-20 text-gray-200 mx-auto mb-4" />
              <p className="text-xl font-black text-gray-300 uppercase tracking-widest">No Assessments Found</p>
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
