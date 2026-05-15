"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Eye, FileText, CheckCircle, Clock, AlertTriangle, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  assignment: any;
  onBack: () => void;
  onReviewStudent: (submission: any) => void;
}

export function SubmissionReviewGrid({ assignment, onBack, onReviewStudent }: Props) {
  const queryClient = useQueryClient();
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['assignment-submissions', assignment.id],
    queryFn: () => assignmentsApi.getAssignmentSubmissions(assignment.id),
  });

  const extendMutation = useMutation({
    mutationFn: (newDate: string) => assignmentsApi.extendDeadline(assignment.id, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignment.id] });
      toast.success("Deadline extended successfully");
      setExtendingId(null);
    }
  });

  if (isLoading) return <Loader2 className="animate-spin mx-auto my-12" />;

  const list = submissions?.data || [];

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border-2 border-slate-50 gap-6">
        <div className="flex items-center gap-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-14 w-14 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-slate-100"
          >
            <ArrowLeft className="w-8 h-8 text-slate-500" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{assignment?.title}</h2>
              {assignment?.template?.isMarkOnly && (
                <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black uppercase tracking-widest text-[10px] px-3 border-2">Direct Grade Mode</Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="font-black text-slate-400 border-slate-100 bg-slate-50/50 uppercase tracking-widest text-[9px] px-2 py-0.5">
                {assignment?.subject?.name}
              </Badge>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Section {assignment?.section?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right pr-8 border-r-2 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Roster Size</p>
            <p className="text-3xl font-black text-slate-900 leading-none">{list.length}</p>
          </div>
          {!assignment?.template?.isMarkOnly && (
            <Button 
              onClick={() => {
                const newDate = prompt("Enter extension date (YYYY-MM-DD):", new Date(assignment.dueDate).toISOString().split('T')[0]);
                if (newDate) extendMutation.mutate(newDate);
              }}
              className="bg-slate-900 hover:bg-black text-white font-black h-12 px-8 rounded-2xl shadow-xl shadow-slate-100 transition-all hover:scale-105"
            >
              <Clock className="w-5 h-5 mr-2" /> Extend Deadline
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-2 border-slate-100">
              <TableHead className="w-40 font-black uppercase text-[10px] tracking-widest p-8 text-slate-400">Student ID</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-8 text-slate-400">Full Name</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-8 text-slate-400">Status</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-8 text-slate-400">Submission Details</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-8 text-slate-400 text-center">Marks Obtained</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] tracking-widest p-8 text-slate-400">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((submission: any) => (
              <TableRow key={submission.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-50 group">
                <TableCell className="p-8 font-black text-slate-400 text-xs tracking-widest">{submission.enrollment.student.registrationNumber}</TableCell>
                <TableCell className="p-8">
                  <p className="font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                    {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
                  </p>
                </TableCell>
                <TableCell className="p-8">
                  <GradingStatusBadge 
                    status={submission.gradingStatus} 
                    isLate={submission.isLateSubmission} 
                  />
                </TableCell>
                <TableCell className="p-8">
                  {submission.hasSubmission ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-blue-50 transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Version v{submission.versions?.[0]?.versionNumber}</p>
                        <p className="text-xs font-black text-slate-600">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : assignment?.template?.isMarkOnly ? (
                    <div className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Entry Only</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-rose-300">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting File</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-8 text-center">
                  {submission.finalMarks !== null ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black px-4 py-1.5 border-2 rounded-xl">
                      {submission.finalMarks} / {assignment.maxMarks}
                    </Badge>
                  ) : (
                    <span className="text-slate-200 font-black tracking-widest">- / -</span>
                  )}
                </TableCell>
                <TableCell className="p-8 text-right">
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl transition-all",
                      (submission.hasSubmission || assignment?.template?.isMarkOnly) 
                        ? "bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white" 
                        : "bg-slate-50 text-slate-200 pointer-events-none"
                    )}
                    onClick={() => onReviewStudent(submission)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> 
                    {assignment?.template?.isMarkOnly ? "Enter Marks" : "Review"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GradingStatusBadge({ status, isLate }: { status: string, isLate?: boolean }) {
  const configs: any = {
    NOT_SUBMITTED: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
    SUBMITTED: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText },
    UNDER_REVIEW: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Eye },
    GRADED: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    MISSED: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
    REOPENED: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Lock },
  };

  const config = configs[status] || configs.NOT_SUBMITTED;
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-1">
      <Badge className={cn("px-2 py-0.5 flex items-center gap-1 w-max border", config.color)} variant="outline">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
      {isLate && <span className="text-[10px] text-red-500 font-bold uppercase ml-1">Late Submission</span>}
    </div>
  );
}
