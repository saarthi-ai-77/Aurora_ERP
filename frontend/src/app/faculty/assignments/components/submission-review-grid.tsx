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
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['assignment-submissions', assignment.id],
    queryFn: () => assignmentsApi.getAssignmentSubmissions(assignment.id),
  });

  if (isLoading) return <Loader2 className="animate-spin mx-auto my-12" />;

  const list = submissions?.data || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{assignment.title}</h2>
            <p className="text-sm text-gray-500">
              {assignment.subject.name} ({assignment.subject.code}) | Section {assignment.section.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8">{list.length} Submissions</Badge>
          {assignment.status === 'DRAFT' && (
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Publish to Students</Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-24">Reg No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latest Version</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((submission: any) => (
              <TableRow key={submission.id} className="hover:bg-indigo-50/20 transition-colors">
                <TableCell className="font-mono text-xs">{submission.enrollment.student.registrationNumber}</TableCell>
                <TableCell className="font-medium">
                  {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
                </TableCell>
                <TableCell>
                  <GradingStatusBadge status={submission.gradingStatus} isLate={submission.isLateSubmission} />
                </TableCell>
                <TableCell>
                  {submission.versions?.[0] ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      v{submission.versions[0].versionNumber} - {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs italic">No file</span>
                  )}
                </TableCell>
                <TableCell>
                  {submission.finalMarks !== null ? (
                    <span className="font-bold text-indigo-600">{submission.finalMarks}/{assignment.maxMarks}</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!submission.latestVersionId}
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
