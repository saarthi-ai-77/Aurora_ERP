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
import { Loader2, Plus, Search, FileText, ChevronRight, Users, Calendar, Trash2, Archive, ArrowLeft, RefreshCw, Rocket, X } from "lucide-react";
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
  // Prevents multi-tab session leakage (e.g., Admin login in another tab)
  const { data: userProfile } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  useEffect(() => {
    if (userProfile?.data && userProfile.data.role !== 'FACULTY') {
      toast.error("Session Conflict Detected: You are no longer logged in as Faculty.");
      setTimeout(() => window.location.href = '/login', 2000);
    }
  }, [userProfile]);

  // ─── Data Fetching ───────────────────────────────────────────────────────
  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: ['faculty-context'],
    queryFn: () => academicApi.getMyContext(),
  });

  const { data: assignments, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
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
      toast.success("Assignment assigned to students");
      setAssignmentToPublish(null);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.archiveAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment moved to archive");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment permanently deleted");
      setAssignmentToDelete(null);
    }
  });

  if (contextLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      <p className="text-gray-500 animate-pulse font-medium">Loading your academic workload...</p>
    </div>
  );

  const sections = context?.data?.assignments || [];

  // Handle section selection and auto-sync
  const handleSelectSection = (mapping: any) => {
    setSelectedSection(mapping);
  };

  // ─── View 1: Submission Review ───────────────────────────────────────────
  if (selectedAssignment) {
    return (
      <div className="container mx-auto py-8">
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
    
    // ─── Triple Zone Grouping ────────────────────────────────────────────────
    const templates = list.filter((a: any) => a.status === 'DRAFT');
    const ongoing = list.filter((a: any) => a.status === 'PUBLISHED' && !a.isPastDeadline);
    const completed = list.filter((a: any) => a.status === 'PUBLISHED' && a.isPastDeadline);

    const activeList = activeTab === 'templates' ? templates : activeTab === 'ongoing' ? ongoing : completed;
    const filtered = activeList.filter((a: any) => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderAssignmentCard = (assignment: any) => (
      <Card 
        key={assignment.id} 
        className={cn(
          "group cursor-pointer hover:shadow-xl transition-all duration-300 border-2",
          assignment.status === 'DRAFT' ? "border-amber-100" : "border-transparent"
        )}
        onClick={() => setSelectedAssignment(assignment)}
      >
        <CardContent className="p-0">
          <div className="flex h-full">
            <div className={cn(
              "w-2 transition-colors",
              assignment.status === 'DRAFT' ? "bg-amber-400" : 
              assignment.isPastDeadline ? "bg-gray-400" : "bg-emerald-500"
            )} />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={assignment.status === 'DRAFT' ? "outline" : "default"} className={cn(
                      "font-bold uppercase tracking-wider text-[10px]",
                      assignment.status === 'DRAFT' ? "text-amber-600 border-amber-200" : 
                      assignment.isPastDeadline ? "bg-gray-100 text-gray-600" : "bg-emerald-50/50 text-emerald-700 border-emerald-100"
                    )}>
                      {assignment.status === 'DRAFT' ? "Pre-saved Template" : assignment.isPastDeadline ? "Deadline Passed" : "Live / Ongoing"}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Users className="w-3.5 h-3.5" /> {assignment.submissionCount || 0} Submissions
                    </span>
                    {assignment.status === 'PUBLISHED' && (
                      <span className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full",
                        (assignment.missedCount || 0) > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"
                      )}>
                        <X className="w-3.5 h-3.5" /> {assignment.missedCount || 0} Missed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {assignment.status === 'DRAFT' && (
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 font-bold" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignmentToPublish(assignment);
                      }}
                    >
                      <Rocket className="w-4 h-4 mr-2" /> Assign Now
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="font-bold text-gray-500 hover:text-indigo-600">
                    Manage <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
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
          <div className="flex items-center gap-5">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSection(null)} 
              className="h-12 w-12 p-0 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight">
                {selectedSection.subject.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-indigo-600 font-bold px-3 py-1">Section {selectedSection.section.name}</Badge>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedSection.term.name}</span>
              </div>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner border-2 border-gray-100">
            <button 
              onClick={() => setActiveTab('templates')}
              className={cn(
                "px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'templates' ? "bg-white text-amber-600 shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Templates <Badge variant="secondary" className="bg-amber-100 text-amber-700">{templates.length}</Badge>
            </button>
            <button 
              onClick={() => setActiveTab('ongoing')}
              className={cn(
                "px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'ongoing' ? "bg-white text-indigo-600 shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Ongoing <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{ongoing.length}</Badge>
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={cn(
                "px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'completed' ? "bg-white text-gray-700 shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Completed <Badge variant="secondary" className="bg-gray-200 text-gray-700">{completed.length}</Badge>
            </button>
          </div>

          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 hover:bg-black text-white font-black shadow-xl h-12 px-8 rounded-2xl"
          >
            <Plus className="w-5 h-5 mr-2" /> New Custom
          </Button>
        </div>

        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight capitalize">
                {activeTab} {activeTab === 'templates' ? 'Spawner' : 'Assignments'}
              </h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                {activeTab === 'templates' ? 'Select a pre-saved template to spawn a new assignment set' : 
                 activeTab === 'ongoing' ? 'Active tasks currently visible to students' : 
                 'Review submissions and grade students for past tasks'}
              </p>
            </div>
            <div className="relative w-64 group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none text-sm font-bold shadow-sm"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filtered.map(renderAssignmentCard)}
            {filtered.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-100">
                <FileText className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                <p className="text-xl font-black text-gray-300 uppercase tracking-widest">No {activeTab} Found</p>
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

  // ─── View 3: Section Gallery (Initial Landing) ───────────────────────────
  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Assignment Manager</h1>
        <p className="text-gray-500 text-lg">Select a section to manage academic submissions and pre-saved drafts.</p>
      </div>

      <SectionGallery 
        sections={sections} 
        onSelect={handleSelectSection} 
      />

      <AlertDialog open={!!assignmentToDelete} onOpenChange={() => setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment and all associated student submissions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssignmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => assignmentToDelete && deleteMutation.mutate(assignmentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
