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
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-xl shadow-gray-100/50 border-2 border-gray-50 gap-6">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-12 w-12 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{assignment?.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="font-bold text-indigo-600 border-indigo-100 bg-indigo-50/50">
                {assignment?.subject?.name}
              </Badge>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section {assignment?.section?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right pr-6 border-r-2 border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Students</p>
            <p className="text-2xl font-black text-gray-900">{list.length}</p>
          </div>
          <Button 
            onClick={() => {
              const newDate = prompt("Enter new deadline (YYYY-MM-DD):", new Date(assignment.dueDate).toISOString().split('T')[0]);
              if (newDate) extendMutation.mutate(newDate);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 px-8 rounded-2xl shadow-lg shadow-indigo-100"
          >
            <Clock className="w-5 h-5 mr-2" /> Extend Deadline
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-gray-50 shadow-2xl shadow-gray-100/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-50">
              <TableHead className="w-32 font-black uppercase text-[10px] tracking-widest p-6 text-gray-500">Reg No.</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-gray-500">Student Name</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-gray-500">Status</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-gray-500">Submission Details</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-gray-500 text-center">Marks</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] tracking-widest p-6 text-gray-500">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((submission: any) => (
              <TableRow key={submission.id} className="hover:bg-indigo-50/20 transition-colors border-b border-gray-50 group">
                <TableCell className="p-6 font-black text-gray-500 text-xs">{submission.enrollment.student.registrationNumber}</TableCell>
                <TableCell className="p-6">
                  <p className="font-black text-gray-900 leading-none">
                    {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
                  </p>
                </TableCell>
                <TableCell className="p-6">
                  <GradingStatusBadge 
                    status={submission.gradingStatus} 
                    isLate={submission.isLateSubmission} 
                  />
                </TableCell>
                <TableCell className="p-6">
                  {submission.hasSubmission ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Latest Upload</p>
                        <p className="text-xs font-bold text-gray-700">v{submission.versions?.[0]?.versionNumber} - {new Date(submission.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-rose-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">No Submission</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-6 text-center">
                  {submission.finalMarks !== null ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black px-3 py-1">
                      {submission.finalMarks}/{assignment.maxMarks}
                    </Badge>
                  ) : (
                    <span className="text-gray-300 font-black">-</span>
                  )}
                </TableCell>
                <TableCell className="p-6 text-right">
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "font-black text-xs uppercase tracking-widest",
                      submission.hasSubmission ? "text-indigo-600 hover:bg-indigo-50" : "text-gray-300 pointer-events-none"
                    )}
                    onClick={() => onReviewStudent(submission)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Review
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
