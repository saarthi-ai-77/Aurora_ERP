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
import { Loader2, Plus, Search, FileText, ChevronRight, Users, Calendar, Trash2, Archive, ArrowLeft, RefreshCw, Rocket } from "lucide-react";
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
  const syncDraftsMutation = useMutation({
    mutationFn: (mapping: any) => assignmentsApi.syncDrafts({
      sectionId: mapping.section.id,
      subjectId: mapping.subject.id
    }),
    onSuccess: () => {
      refetchAssignments();
      toast.success("Assignment drafts updated");
    }
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) => 
      assignmentsApi.publishAssignment(id, dueDate),
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
    syncDraftsMutation.mutate(mapping);
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
    const filtered = list.filter((a: any) => 
      a.status !== 'ARCHIVED' && 
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="container mx-auto py-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSection(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {selectedSection.subject.name}
              </h1>
              <p className="text-gray-500 text-sm">
                Section {selectedSection.section.name} • {selectedSection.term.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => syncDraftsMutation.mutate(selectedSection)} disabled={syncDraftsMutation.isPending}>
              <RefreshCw className={cn("w-4 h-4 mr-2", syncDraftsMutation.isPending && "animate-spin")} />
              Sync Templates
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Custom
            </Button>
          </div>
        </div>

        {showCreateModal && (
          <CreateAssignmentModal 
            onClose={() => setShowCreateModal(false)} 
            defaultSectionId={selectedSection.section.id}
            defaultSubjectId={selectedSection.subject.id}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
             <Card className="border shadow-sm sticky top-24">
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Search in this section..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 text-sm">
                    <span className="text-gray-600">Active Assignments</span>
                    <Badge variant="secondary">{list.filter((a: any) => a.status === 'PUBLISHED').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 text-sm">
                    <span className="text-gray-600">Pending Drafts</span>
                    <Badge variant="outline">{list.filter((a: any) => a.status === 'DRAFT').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 space-y-4">
            {filtered.map((assignment: any) => (
              <Card key={assignment.id} className="group hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedAssignment(assignment)}>
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={cn(
                      "w-1.5",
                      assignment.status === 'PUBLISHED' ? "bg-green-500" : "bg-amber-400"
                    )} />
                    <div className="flex-1 p-6 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">{assignment.status}</Badge>
                          {assignment.status === 'DRAFT' && <span className="text-[10px] text-amber-600 font-bold uppercase">Pre-saved Draft</span>}
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {assignment._count?.submissions || 0} Submissions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {assignment.status === 'DRAFT' && (
                          <Button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignmentToPublish(assignment);
                            }}
                          >
                            <Rocket className="w-4 h-4 mr-2" /> Assign
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                          Review <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No assignments found for this section.</p>
              </div>
            )}
          </div>
        </div>

        {assignmentToPublish && (
          <PublishAssignmentModal 
            assignment={assignmentToPublish}
            onClose={() => setAssignmentToPublish(null)}
            onConfirm={(dueDate) => publishMutation.mutate({ id: assignmentToPublish.id, dueDate })}
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
