"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle, Save, RotateCcw, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  submission: any;
  assignment: any;
  onClose: () => void;
}

export function GradingPanel({ submission, assignment, onClose }: Props) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<number>(submission.finalMarks || 0);
  const [feedback, setFeedback] = useState<string>(submission.feedback || "");

  const gradeMutation = useMutation({
    mutationFn: (data: any) => assignmentsApi.gradeSubmission(submission.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignment.id] });
      toast.success("Submission graded successfully");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to grade submission");
    }
  });

  const reopenMutation = useMutation({
    mutationFn: (reason?: string) => assignmentsApi.reopenSubmission(submission.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignment.id] });
      toast.success("Assignment reopened for student");
      onClose();
    }
  });

  const handleGrade = () => {
    if (marks > assignment.maxMarks) {
      toast.error(`Marks cannot exceed max ${assignment.maxMarks}`);
      return;
    }
    gradeMutation.mutate({ marks, feedback });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-6 bg-white border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Review Submission</h2>
            <p className="text-sm text-gray-500">
              {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Submission Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-gray-500 tracking-wider">Latest Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">
                      {submission.versions?.[0]?.originalFilename || "submission.pdf"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(submission.versions?.[0]?.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <a href={submission.versions?.[0]?.storageKey} target="_blank" rel="noreferrer">Download</a>
                </Button>
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Submitted at: {new Date(submission.submittedAt).toLocaleString()}</span>
                <span className="font-bold text-indigo-600 uppercase">Version {submission.versions?.[0]?.versionNumber}</span>
              </div>
            </CardContent>
          </Card>

          {/* Grading Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Marks (Max: {assignment.maxMarks})</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none text-2xl font-bold"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                min={0}
                max={assignment.maxMarks}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Feedback & Remarks</label>
              <textarea 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                placeholder="Good work! Focus on normalization rules..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t flex gap-3">
          <Button 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12"
            onClick={handleGrade}
            disabled={gradeMutation.isPending}
          >
            {gradeMutation.isPending ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Grade</>}
          </Button>
          <Button 
            variant="outline" 
            className="h-12 text-purple-600 border-purple-200 hover:bg-purple-50"
            onClick={() => {
              const reason = window.prompt("Reason for reopening:");
              if (reason !== null) reopenMutation.mutate(reason);
            }}
            disabled={reopenMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reopen
          </Button>
        </div>
      </div>
    </div>
  );
}
