"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle, Save, RotateCcw, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l-2 border-slate-100">
        <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-2 py-0.5">Evaluation Portal</Badge>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">v2.0 Stable</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Review Submission</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
              Student: {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-12 w-12 rounded-2xl hover:bg-slate-50 transition-all"
          >
            <X className="w-6 h-6 text-slate-400" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* PDF Previewer */}
          {submission.versions?.[0]?.storageKey ? (
            <div className="rounded-[2rem] overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-2xl shadow-slate-200/20 h-[600px] relative group">
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <Loader2 className="w-10 h-10 text-slate-200 animate-spin" />
              </div>
              <iframe 
                src={`${submission.versions[0].storageKey}#toolbar=0`}
                className="w-full h-full relative z-10"
                title="Submission Preview"
              />
              <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                <a
                  href={submission.versions[0].storageKey}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "bg-white text-slate-900 font-black shadow-xl rounded-xl border-2 border-slate-100 px-6 h-10")}
                >
                  View Full Screen
                </a>
              </div>
            </div>
          ) : (
            <div className="h-[400px] rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-12">
              <AlertTriangle className="w-16 h-16 text-slate-100 mb-4" />
              <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No Digital Document Attached</p>
            </div>
          )}

          {/* Submission Info Card */}
          {submission.versions?.[0] && (
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white text-slate-400 rounded-2xl group-hover:text-blue-500 transition-colors shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm truncate max-w-[300px] tracking-tight">
                    {submission.versions?.[0]?.originalFilename || "submission.pdf"}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {(submission.versions?.[0]?.fileSize / 1024 / 1024).toFixed(2)} MB • Build v{submission.versions?.[0]?.versionNumber}
                  </p>
                </div>
              </div>
              <a
                href={submission.versions?.[0]?.storageKey}
                download
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-black text-[10px] uppercase tracking-widest text-blue-600 hover:bg-white hover:shadow-md transition-all rounded-xl h-10 px-6")}
              >
                Download File
              </a>
            </div>
          )}

          {/* Grading Form */}
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Marks Obtained</label>
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Max Allowed: {assignment.maxMarks}</span>
              </div>
              <div className="relative group">
                <input 
                  type="number" 
                  className="w-full pl-6 pr-12 py-5 rounded-3xl border-2 border-slate-100 focus:border-blue-500 outline-none text-4xl font-black text-slate-900 shadow-sm transition-all"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  min={0}
                  max={assignment.maxMarks}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-200 text-2xl group-focus-within:text-blue-200 transition-colors">
                  / {assignment.maxMarks}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Evaluator Feedback</label>
              <textarea 
                className="w-full p-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 outline-none h-44 text-sm font-bold text-slate-600 shadow-sm transition-all resize-none"
                placeholder="Provide constructive feedback for the student here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t-2 border-slate-50 flex gap-4">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95"
            onClick={handleGrade}
            disabled={gradeMutation.isPending}
          >
            {gradeMutation.isPending ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5 mr-3" /> Publish Grade</>}
          </Button>
          <Button 
            variant="ghost" 
            className="h-14 px-8 rounded-2xl text-slate-400 font-black hover:bg-rose-50 hover:text-rose-600 transition-all group"
            onClick={() => {
              const reason = window.prompt("State reason for reassignment:");
              if (reason !== null) reopenMutation.mutate(reason);
            }}
            disabled={reopenMutation.isPending}
          >
            <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" /> 
            Reopen
          </Button>
        </div>
      </div>
    </div>
  );
}
