"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, FileText, AlertTriangle, Save, RotateCcw, X, Maximize2, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  submission: any;
  assignment: any;
  onClose: () => void;
}

// Normalizes storageKey URLs — strips localhost origin so the Vercel proxy handles routing.
// Files uploaded from local dev get stored as absolute http://localhost:PORT/... URLs.
function resolveFileUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey || storageKey === "marks-only") return null;
  try {
    const url = new URL(storageKey);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return url.pathname;
    }
    return storageKey;
  } catch {
    return storageKey; // already a relative path like /api/v1/storage/...
  }
}

export function GradingPanel({ submission, assignment, onClose }: Props) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<number>(submission.finalMarks ?? 0);
  const [feedback, setFeedback] = useState<string>(submission.feedback ?? "");

  const version = submission.versions?.[0];
  const fileUrl = resolveFileUrl(version?.storageKey);

  const gradeMutation = useMutation({
    mutationFn: (data: any) => assignmentsApi.gradeSubmission(submission.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", assignment.id] });
      toast.success("Grade saved");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save grade");
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (reason?: string) => assignmentsApi.reopenSubmission(submission.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", assignment.id] });
      toast.success("Assignment reopened for student");
      onClose();
    },
  });

  const handleGrade = () => {
    if (marks > assignment.maxMarks) {
      toast.error(`Marks cannot exceed ${assignment.maxMarks}`);
      return;
    }
    gradeMutation.mutate({ marks, feedback });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Review Submission
            </p>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              {submission.enrollment.student.firstName} {submission.enrollment.student.lastName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {submission.enrollment.student.registrationNumber}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-700 mt-0.5"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* PDF Viewer */}
          <div className="relative bg-slate-50 border-b border-slate-100" style={{ height: 380 }}>
            {fileUrl ? (
              <>
                {/* embed avoids X-Frame-Options restrictions that affect iframes */}
                <embed
                  src={fileUrl}
                  type="application/pdf"
                  className="w-full h-full block"
                />
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Full Screen
                </a>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
                <FileText className="w-12 h-12" />
                <p className="text-sm font-medium text-slate-400">No document attached</p>
              </div>
            )}
          </div>

          {/* File Info Bar */}
          {version && fileUrl && (
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-red-50 rounded-md flex-shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {version.originalFilename || "submission.pdf"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(version.fileSize / 1024 / 1024).toFixed(2)} MB • Version {version.versionNumber}
                  </p>
                </div>
              </div>
              <a
                href={fileUrl}
                download
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "flex-shrink-0 text-xs font-semibold gap-1.5"
                )}
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          )}

          {/* Grading Controls */}
          <div className="px-6 py-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
                Marks (Max: {assignment.maxMarks})
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-3xl font-bold text-slate-900 transition-all"
                value={marks}
                onChange={(e) =>
                  setMarks(Math.min(assignment.maxMarks, Math.max(0, Number(e.target.value) || 0)))
                }
                min={0}
                max={assignment.maxMarks}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
                Feedback & Remarks
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm text-slate-700 transition-all resize-none h-28"
                placeholder="Optional feedback for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-white">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl gap-2"
            onClick={handleGrade}
            disabled={gradeMutation.isPending}
          >
            {gradeMutation.isPending ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Grade
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="h-11 px-5 rounded-xl font-semibold text-slate-500 border-slate-200 gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
            onClick={() => {
              const reason = window.prompt("Reason for reopening (optional):");
              if (reason !== null) reopenMutation.mutate(reason);
            }}
            disabled={reopenMutation.isPending}
          >
            {reopenMutation.isPending ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <RotateCcw className="w-4 h-4" /> Reopen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
