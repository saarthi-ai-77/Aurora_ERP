"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Eye, FileText, CheckCircle, Clock,
  AlertTriangle, Lock, RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { ExtendDeadlineModal } from "./extend-deadline-modal";

interface Props {
  assignment: any;
  onBack: () => void;
  onReviewStudent: (submission: any) => void;
}

export function SubmissionReviewGrid({ assignment, onBack, onReviewStudent }: Props) {
  const queryClient = useQueryClient();
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const { data: submissions, isLoading, isError } = useQuery({
    queryKey: ["assignment-submissions", assignment.id],
    queryFn: () => assignmentsApi.getAssignmentSubmissions(assignment.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    retry: 1,
  });

  const extendMutation = useMutation({
    mutationFn: (newDate: string) => assignmentsApi.extendDeadline(assignment.id, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", assignment.id] });
      toast.success("Deadline extended");
      setIsExtendModalOpen(false);
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px] gap-3">
      <Loader2 className="animate-spin w-6 h-6 text-slate-400" />
      <span className="text-sm font-medium text-slate-400">Loading roster...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="p-4 bg-rose-50 rounded-2xl">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
      </div>
      <div className="text-center max-w-xs">
        <p className="font-semibold text-slate-800">Could not load submissions</p>
        <p className="text-sm text-slate-400 mt-1">
          Your access mapping for this section may be inactive. Contact your administrator.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
      </Button>
    </div>
  );

  const list: any[] = Array.isArray(submissions?.data) ? submissions.data : [];
  const submittedCount = list.filter((s) => s.hasSubmission).length;

  return (
    <div className="bg-white min-h-screen">

      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{assignment.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {assignment.subject?.name}
              {assignment.subject?.code ? ` (${assignment.subject.code})` : ""}
              {" | "}Section {assignment.section?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!assignment.template?.isMarkOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExtendModalOpen(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Extend Deadline
            </Button>
          )}
          <div className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg">
            {submittedCount} Submission{submittedCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
            <TableHead className="py-3 px-8 text-xs font-semibold uppercase tracking-wider text-slate-500 w-36">Reg No.</TableHead>
            <TableHead className="py-3 px-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Student Name</TableHead>
            <TableHead className="py-3 px-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="py-3 px-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Latest Version</TableHead>
            <TableHead className="py-3 px-8 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Marks</TableHead>
            <TableHead className="py-3 px-8 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((submission) => {
            const canReview = submission.hasSubmission || assignment.template?.isMarkOnly;
            return (
              <TableRow key={submission.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                <TableCell className="py-4 px-8 font-mono text-xs text-slate-500">
                  {submission.enrollment.student.registrationNumber}
                </TableCell>
                <TableCell className="py-4 px-8">
                  <span className="font-semibold text-slate-800 text-sm">
                    {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
                  </span>
                </TableCell>
                <TableCell className="py-4 px-8">
                  <GradingStatusBadge status={submission.gradingStatus} isLate={submission.isLateSubmission} />
                </TableCell>
                <TableCell className="py-4 px-8 text-sm text-slate-500">
                  {submission.hasSubmission && submission.versions?.[0] ? (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      v{submission.versions[0].versionNumber} —{" "}
                      {new Date(submission.submittedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  ) : assignment.template?.isMarkOnly ? (
                    <span className="text-slate-300">—</span>
                  ) : (
                    <span className="text-slate-400 text-xs">Not submitted</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-8 text-center">
                  {submission.finalMarks !== null ? (
                    <span className="text-blue-600 font-bold text-sm">
                      {submission.finalMarks}/{assignment.maxMarks}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-8 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold gap-1.5 transition-colors",
                      canReview
                        ? "hover:bg-blue-600 hover:text-white hover:border-blue-600"
                        : "opacity-30 pointer-events-none"
                    )}
                    onClick={() => canReview && onReviewStudent(submission)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {assignment.template?.isMarkOnly ? "Enter Marks" : "Review"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {list.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-20 text-center text-slate-400 text-sm">
                No students found for this assignment.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ExtendDeadlineModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        currentDueDate={assignment.dueDate}
        isPending={extendMutation.isPending}
        onConfirm={(date) => extendMutation.mutate(date)}
      />
    </div>
  );
}

function GradingStatusBadge({ status, isLate }: { status: string; isLate?: boolean }) {
  const configs: Record<string, { label: string; className: string; Icon: any }> = {
    NOT_SUBMITTED: { label: "Not Submitted", className: "text-slate-500 bg-white border-slate-200", Icon: Clock },
    SUBMITTED:     { label: "Submitted",     className: "text-blue-600 bg-blue-50 border-blue-200", Icon: FileText },
    UNDER_REVIEW:  { label: "Under Review",  className: "text-amber-600 bg-amber-50 border-amber-200", Icon: Eye },
    GRADED:        { label: "Graded",        className: "text-emerald-600 bg-emerald-50 border-emerald-200", Icon: CheckCircle },
    MISSED:        { label: "Missed",        className: "text-red-500 bg-red-50 border-red-200", Icon: AlertTriangle },
    REOPENED:      { label: "Reopened",      className: "text-purple-600 bg-purple-50 border-purple-200", Icon: Lock },
  };

  const cfg = configs[status] || configs.NOT_SUBMITTED;
  const Icon = cfg.Icon;

  return (
    <div className="flex flex-col gap-1 items-start">
      <Badge
        variant="outline"
        className={cn("text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1 border", cfg.className)}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
      {isLate && (
        <span className="text-[10px] text-red-400 font-semibold ml-0.5">Late</span>
      )}
    </div>
  );
}
