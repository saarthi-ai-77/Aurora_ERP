"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, academicApi, authApi } from "@/lib/api";
import { SubmissionReviewGrid } from "./components/submission-review-grid";
import { GradingPanel } from "./components/grading-panel";
import { SectionGallery } from "./components/section-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, FileText, ChevronRight, Users, Calendar,
  ArrowLeft, Rocket, X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

import { PublishAssignmentModal } from "./components/publish-modal";
import { BulkGradeModal } from "./components/bulk-grade-modal";

type Tab = "templates" | "ongoing" | "completed";

export default function FacultyAssignmentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);
  const [assignmentToPublish, setAssignmentToPublish] = useState<any>(null);
  const [templateToBulkGrade, setTemplateToBulkGrade] = useState<any>(null);

  // ─── Role guard ────────────────────────────────────────────────────────────
  const { data: userProfile } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe(),
  });

  useEffect(() => {
    if (userProfile?.data && userProfile.data.role !== "FACULTY") {
      toast.error("Session conflict detected");
      setTimeout(() => (window.location.href = "/login"), 2000);
    }
  }, [userProfile]);

  // ─── Faculty context (sections) ────────────────────────────────────────────
  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: ["faculty-context"],
    queryFn: () => academicApi.getMyContext(),
  });

  // ─── Assignments for selected section ──────────────────────────────────────
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["faculty-assignments", selectedSection?.section.id, selectedSection?.subject.id],
    queryFn: () =>
      assignmentsApi.getFacultyAssignments({
        sectionId: selectedSection?.section.id,
        subjectId: selectedSection?.subject.id,
      }),
    enabled: !!selectedSection,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: ({ id, dueDate, setNumber }: { id: string; dueDate: string; setNumber?: number }) =>
      assignmentsApi.publishAssignment(id, dueDate, setNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-assignments"] });
      toast.success("Assignment is now live for students");
      setAssignmentToPublish(null);
    },
  });

  if (contextLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="animate-spin w-6 h-6 text-slate-400" />
      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Syncing academic data...</p>
    </div>
  );

  const sections = context?.data?.assignments || [];

  // ─── View: submission review + grading panel ───────────────────────────────
  if (selectedAssignment) {
    return (
      <div className="animate-in fade-in duration-300">
        <SubmissionReviewGrid
          assignment={selectedAssignment}
          onBack={() => { setSelectedAssignment(null); setReviewingSubmission(null); }}
          onReviewStudent={(sub) => setReviewingSubmission(sub)}
        />
        {reviewingSubmission && (
          <GradingPanel
            submission={reviewingSubmission}
            assignment={selectedAssignment}
            onClose={() => setReviewingSubmission(null)}
          />
        )}
      </div>
    );
  }

  // ─── View: section assignment workspace ────────────────────────────────────
  if (selectedSection) {
    const list: any[] = assignments?.data || [];

    // Templates: DRAFT assignment instances (auto-created by syncDraftsForSection)
    const templates = list.filter((a) => a.status === "DRAFT");
    // Ongoing: published, not past deadline, not marks-only
    const ongoing = list.filter(
      (a) => a.status === "PUBLISHED" && !a.isPastDeadline && !a.template?.isMarkOnly
    );
    // Completed: past deadline OR marks-only (grading zone)
    const completed = list.filter(
      (a) => a.status === "PUBLISHED" && (a.isPastDeadline || a.template?.isMarkOnly)
    );

    const tabList: { id: Tab; label: string; count: number }[] = [
      { id: "templates", label: "Templates", count: templates.length },
      { id: "ongoing",   label: "Ongoing",   count: ongoing.length },
      { id: "completed", label: "Completed", count: completed.length },
    ];

    const activeList =
      activeTab === "templates" ? templates :
      activeTab === "ongoing"   ? ongoing   : completed;

    return (
      <div className="min-h-screen bg-slate-50/30">
        {/* Section workspace header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSection(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedSection.subject.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5">
                    {selectedSection.subject.code}
                  </Badge>
                  <span className="text-sm text-slate-500">Section {selectedSection.section.name}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{selectedSection.term.name}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
              {tabList.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                    activeTab === tab.id ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assignment list */}
        <div className="px-8 py-6">
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">Loading assignments...</span>
            </div>
          ) : activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl text-center">
              <FileText className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Empty workspace</p>
              <p className="text-xs text-slate-300 mt-1">
                {activeTab === "templates"
                  ? "No assignment templates found for this section."
                  : activeTab === "ongoing"
                  ? "No active assignments at the moment."
                  : "No completed assignments yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeList.map((assignment: any) =>
                activeTab === "templates" ? (
                  <TemplateCard
                    key={assignment.id}
                    assignment={assignment}
                    onAssign={() => {
                      if (assignment.template?.isMarkOnly) {
                        setTemplateToBulkGrade(assignment);
                      } else {
                        setAssignmentToPublish(assignment);
                      }
                    }}
                  />
                ) : (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onClick={() => setSelectedAssignment(assignment)}
                  />
                )
              )}
            </div>
          )}
        </div>

        {assignmentToPublish && (
          <PublishAssignmentModal
            assignment={assignmentToPublish}
            onClose={() => setAssignmentToPublish(null)}
            onConfirm={(dueDate, setNumber) =>
              publishMutation.mutate({ id: assignmentToPublish.id, dueDate, setNumber })
            }
            isPending={publishMutation.isPending}
          />
        )}

        {templateToBulkGrade && (
          <BulkGradeModal
            isOpen={!!templateToBulkGrade}
            onClose={() => setTemplateToBulkGrade(null)}
            template={templateToBulkGrade.template}
            sectionId={selectedSection.section.id}
            subjectId={selectedSection.subject.id}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["faculty-assignments"] });
              setTemplateToBulkGrade(null);
            }}
          />
        )}
      </div>
    );
  }

  // ─── View: section gallery (home) ──────────────────────────────────────────
  return (
    <div className="px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a section to manage assignments, review submissions, and grade students.
        </p>
      </div>
      <SectionGallery sections={sections} onSelect={(mapping) => setSelectedSection(mapping)} />
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────
// Clicking anywhere on the card opens the assign/publish flow (not the review grid).
function TemplateCard({
  assignment,
  onAssign,
}: {
  assignment: any;
  onAssign: () => void;
}) {
  const isMarkOnly = assignment.template?.isMarkOnly;

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
      onClick={onAssign}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl flex-shrink-0",
          isMarkOnly ? "bg-violet-50 text-violet-500" : "bg-blue-50 text-blue-500"
        )}>
          {isMarkOnly ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
            {assignment.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-md",
              isMarkOnly ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
            )}>
              {isMarkOnly ? "Marks Only" : "File Submission"}
            </span>
            <span className="text-xs text-slate-400">Max: {assignment.maxMarks} marks</span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        className="bg-slate-900 hover:bg-black text-white font-bold gap-1.5 flex-shrink-0"
        onClick={onAssign}
      >
        <Rocket className="w-3.5 h-3.5" />
        {isMarkOnly ? "Direct Publish" : "Assign Now"}
      </Button>
    </div>
  );
}

// ─── Assignment Card (Ongoing / Completed) ────────────────────────────────────
function AssignmentCard({
  assignment,
  onClick,
}: {
  assignment: any;
  onClick: () => void;
}) {
  const isPastDeadline = assignment.isPastDeadline;
  const isMarkOnly = assignment.template?.isMarkOnly;
  const submissionCount = assignment.submissionCount || 0;
  const missedCount = assignment.missedCount || 0;

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-1.5 self-stretch rounded-full flex-shrink-0",
          isPastDeadline || isMarkOnly ? "bg-slate-300" : "bg-emerald-400"
        )} />
        <div>
          <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
            {assignment.title}
          </h3>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
            {!isMarkOnly && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Due {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            )}
            <span className="flex items-center gap-1 text-blue-500">
              <Users className="w-3.5 h-3.5" />
              {submissionCount} Submission{submissionCount !== 1 ? "s" : ""}
            </span>
            {!isMarkOnly && missedCount > 0 && (
              <span className="flex items-center gap-1 text-rose-400">
                <X className="w-3.5 h-3.5" />
                {missedCount} Missed
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge variant="outline" className={cn(
          "text-[11px] font-semibold px-2.5 py-0.5",
          isPastDeadline || isMarkOnly
            ? "text-slate-400 border-slate-200"
            : "text-emerald-600 border-emerald-200 bg-emerald-50"
        )}>
          {isMarkOnly ? "Grading Zone" : isPastDeadline ? "Deadline Passed" : "Live"}
        </Badge>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  );
}
