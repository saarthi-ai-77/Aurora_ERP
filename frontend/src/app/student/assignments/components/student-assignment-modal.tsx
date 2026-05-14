"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, FileText, X, CheckCircle, Clock, AlertTriangle, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  assignment: any;
  onClose: () => void;
}

export function StudentAssignmentModal({ assignment, onClose }: Props) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: details, isLoading } = useQuery({
    queryKey: ['submission-details', assignment.submissions?.[0]?.id],
    queryFn: () => assignmentsApi.getSubmissionDetails(assignment.submissions[0].id),
    enabled: !!assignment.submissions?.[0]?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => assignmentsApi.submitAssignment(assignment.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['submission-details'] });
      toast.success("Assignment submitted successfully");
      setFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  });

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const submission = details?.data || assignment.submissions?.[0];
  const versions = submission?.versions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{assignment.title}</h2>
            <p className="text-indigo-100 text-sm">{assignment.subject.name} • Due {new Date(assignment.dueDate).toLocaleString()}</p>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/20" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="md:col-span-2 p-8 space-y-8 border-r">
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Instructions</h3>
              <div className="prose prose-indigo max-w-none text-gray-600">
                {assignment.instructions || "No specific instructions provided."}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Upload Submission</h3>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                  file ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
                )}
                onClick={() => document.getElementById('assignment-file')?.click()}
              >
                <input 
                  id="assignment-file" 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 text-indigo-600" />
                    <p className="font-bold text-indigo-900">{file.name}</p>
                    <p className="text-xs text-indigo-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">Click or drag PDF to upload</p>
                    <p className="text-[10px] text-gray-400">PDF only • Max 5MB</p>
                  </div>
                )}
              </div>
              <Button 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                disabled={!file || uploadMutation.isPending}
                onClick={handleUpload}
              >
                {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : "Submit Assignment"}
              </Button>
            </section>
          </div>

          <div className="bg-gray-50 p-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <History className="w-4 h-4" /> Version History
              </h3>
              <div className="space-y-3">
                {versions.map((v: any) => (
                  <div key={v.id} className="bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="h-6">v{v.versionNumber}</Badge>
                      <div className="text-xs truncate max-w-[120px]">
                        <p className="font-bold truncate">{v.originalFilename}</p>
                        <p className="text-gray-400">{new Date(v.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a
                      href={v.storageKey}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-8 w-8 opacity-0 group-hover:opacity-100",
                      )}
                    >
                      <Upload className="w-4 h-4 rotate-180" />
                    </a>
                  </div>
                ))}
                {versions.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs italic">No previous versions</div>
                )}
              </div>
            </section>

            {submission?.gradingStatus === 'GRADED' && (
              <section className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Grade & Feedback
                </h3>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-green-800">SCORE</span>
                    <span className="text-2xl font-black text-green-900">{submission.finalMarks}/{assignment.maxMarks}</span>
                  </div>
                  <p className="text-xs text-green-700 italic border-t border-green-200 pt-2 mt-2">
                    "{submission.feedback || "Great work!"}"
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
