"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, academicApi, authApi } from "@/lib/api";
import { SubmissionReviewGrid } from "./components/submission-review-grid";
import { GradingPanel } from "./components/grading-panel";
import { CreateAssignmentModal } from "./components/create-assignment-modal";
import { SectionGallery } from "./components/section-gallery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, FileText, ChevronRight, Users, Calendar, Trash2, Archive, ArrowLeft, RefreshCw, Rocket, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PublishAssignmentModal } from "./components/publish-modal";

export default function FacultyAssignmentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'ongoing' | 'completed'>('templates');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignmentToPublish, setAssignmentToPublish] = useState<any>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  // ─── Session Role Guard ──────────────────────────────────────────────────
  const { data: userProfile } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  useEffect(() => {
    if (userProfile?.data && userProfile.data.role !== 'FACULTY') {
      toast.error("Session Conflict Detected");
      setTimeout(() => window.location.href = '/login', 2000);
    }
  }, [userProfile]);

  // ─── Data Fetching ───────────────────────────────────────────────────────
  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: ['faculty-context'],
    queryFn: () => academicApi.getMyContext(),
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['faculty-assignments', selectedSection?.section.id, selectedSection?.subject.id],
    queryFn: () => assignmentsApi.getFacultyAssignments({
      sectionId: selectedSection?.section.id,
      subjectId: selectedSection?.subject.id
    }),
    enabled: !!selectedSection,
  });

  // ─── Mutations ───────────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: ({ id, dueDate, setNumber }: { id: string; dueDate: string; setNumber?: number }) => 
      assignmentsApi.publishAssignment(id, dueDate, setNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment live for students");
      setAssignmentToPublish(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment removed");
      setAssignmentToDelete(null);
    }
  });

  if (contextLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin w-8 h-8 text-slate-400" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Academic Data...</p>
    </div>
  );

  const sections = context?.data?.assignments || [];

  // ─── View 1: Submission Review ───────────────────────────────────────────
  if (selectedAssignment) {
    return (
      <div className="container mx-auto py-8 animate-in fade-in duration-500">
        <SubmissionReviewGrid 
          assignment={selectedAssignment} 
          onBack={() => setSelectedAssignment(null)} 
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

  // ─── View 2: Section Assignment Manager ──────────────────────────────────
  if (selectedSection) {
    const list = assignments?.data || [];
    
    const templates = list.filter((a: any) => a.status === 'DRAFT');
    const ongoing = list.filter((a: any) => 
      a.status === 'PUBLISHED' && !a.isPastDeadline && !a.template?.isMarkOnly
    );
    const completed = list.filter((a: any) => 
      a.status === 'PUBLISHED' && (a.isPastDeadline || a.template?.isMarkOnly)
    );

    const activeList = activeTab === 'templates' ? templates : activeTab === 'ongoing' ? ongoing : completed;
    const filtered = activeList.filter((a: any) => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderAssignmentCard = (assignment: any) => (
      <Card 
        key={assignment.id} 
        className={cn(
          "group cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border-2",
          assignment.status === 'DRAFT' ? "border-slate-100 bg-white" : "border-slate-50 bg-slate-50/20"
        )}
        onClick={() => setSelectedAssignment(assignment)}
      >
        <CardContent className="p-0">
          <div className="flex h-full">
            <div className={cn(
              "w-1.5 transition-all duration-500 group-hover:w-2",
              assignment.status === 'DRAFT' ? "bg-amber-300" : 
              (assignment.isPastDeadline || assignment.template?.isMarkOnly) ? "bg-slate-300" : "bg-emerald-400"
            )} />
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "font-black uppercase tracking-widest text-[9px] px-2 py-0.5 border-2",
                      assignment.status === 'DRAFT' ? "text-amber-600 border-amber-100" : 
                      (assignment.isPastDeadline || assignment.template?.isMarkOnly) ? "text-slate-400 border-slate-100" : "text-emerald-600 border-emerald-100"
                    )}>
                      {assignment.status === 'DRAFT' ? "Pre-saved Template" : (assignment.isPastDeadline || assignment.template?.isMarkOnly) ? "Grading Zone" : "Ongoing Task"}
                    </Badge>
                    {assignment.template?.isMarkOnly && (
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-black uppercase tracking-widest px-2 border-2">Direct Grade</Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-6 text-[11px] font-black text-slate-400">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-300" /> 
                      {assignment.template?.isMarkOnly ? "Marks Entry" : `Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                    </span>
                    <span className="flex items-center gap-2 text-blue-600/60">
                      <Users className="w-4 h-4" /> {assignment.submissionCount || 0} Submissions
                    </span>
                    {assignment.status === 'PUBLISHED' && !assignment.template?.isMarkOnly && (
                      <span className={cn(
                        "flex items-center gap-2",
                        (assignment.missedCount || 0) > 0 ? "text-rose-500" : "text-emerald-500"
                      )}>
                        <X className="w-4 h-4" /> {assignment.missedCount || 0} Missed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {assignment.status === 'DRAFT' && (
                    <Button 
                      className="bg-slate-900 hover:bg-black text-white font-black h-10 px-6 rounded-xl transition-all" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignmentToPublish(assignment);
                      }}
                    >
                      <Rocket className="w-4 h-4 mr-2" /> 
                      {assignment.template?.isMarkOnly ? "Direct Publish" : "Assign Now"}
                    </Button>
                  )}
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSection(null)} 
              className="h-12 w-12 p-0 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border-2 border-transparent hover:border-slate-100"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                {selectedSection.subject.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-slate-900 text-white font-black px-3 py-1">Section {selectedSection.section.name}</Badge>
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{selectedSection.term.name}</span>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-100">
            {[
              { id: 'templates', label: 'Templates', count: templates.length, color: 'text-amber-600', bg: 'bg-amber-50' },
              { id: 'ongoing', label: 'Ongoing', count: ongoing.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'completed', label: 'Completed', count: completed.length, color: 'text-slate-600', bg: 'bg-slate-100' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3",
                  activeTab === tab.id ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label} 
                <Badge variant="secondary" className={cn("font-black px-1.5 min-w-[20px] justify-center", activeTab === tab.id ? tab.bg + " " + tab.color : "bg-slate-200 text-slate-500")}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-100 h-12 px-8 rounded-2xl"
          >
            <Plus className="w-5 h-5 mr-2" /> New Task
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">
                {activeTab} {activeTab === 'templates' ? 'Manager' : 'Workflow'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {activeTab === 'templates' ? 'Select a pre-saved template to spawn a new assignment set' : 
                 activeTab === 'ongoing' ? 'Tasks currently visible in student dashboard' : 
                 'Deadlines passed or marks-only tasks ready for final grading'}
              </p>
            </div>
            <div className="relative w-72 group">
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input 
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-xs font-black shadow-sm transition-all"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filtered.map(renderAssignmentCard)}
            {filtered.length === 0 && (
              <div className="text-center py-32 bg-slate-50/50 rounded-[2rem] border-4 border-dashed border-slate-100">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Empty Workspace</p>
              </div>
            )}
          </div>
        </div>

        {assignmentToPublish && (
          <PublishAssignmentModal 
            assignment={assignmentToPublish}
            onClose={() => setAssignmentToPublish(null)}
            onConfirm={(dueDate, setNumber) => publishMutation.mutate({ id: assignmentToPublish.id, dueDate, setNumber })}
            isPending={publishMutation.isPending}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="space-y-3">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Faculty Hub</h1>
        <p className="text-slate-500 font-bold text-lg max-w-2xl">Select a section to manage assignments, track student submissions, and perform direct grading.</p>
      </div>

      <SectionGallery 
        sections={sections} 
        onSelect={(mapping) => setSelectedSection(mapping)} 
      />

      <AlertDialog open={!!assignmentToDelete} onOpenChange={() => setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the assignment and its submissions from students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => assignmentToDelete && deleteMutation.mutate(assignmentToDelete)}
            >
              {deleteMutation.isPending ? "Archiving..." : "Confirm Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
