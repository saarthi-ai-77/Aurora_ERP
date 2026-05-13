"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, academicApi } from "@/lib/api";
import { SubmissionReviewGrid } from "./components/submission-review-grid";
import { GradingPanel } from "./components/grading-panel";
import { CreateAssignmentModal } from "./components/create-assignment-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, FileText, ChevronRight, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function FacultyAssignmentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['faculty-assignments'],
    queryFn: () => assignmentsApi.getFacultyAssignments(),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.publishAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment published to students");
    }
  });

  if (isLoading) return <Loader2 className="animate-spin mx-auto my-12" />;

  const list = assignments?.data || [];
  const filtered = list.filter((a: any) => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assignments Engine</h1>
          <p className="text-gray-500">Manage, review, and grade academic submissions with version control.</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 shadow-lg shadow-indigo-200"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Assignment
        </Button>
      </div>

      {showCreateModal && (
        <CreateAssignmentModal onClose={() => setShowCreateModal(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="border shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  className="w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Workload Overview</p>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 text-sm">
                  <span className="text-gray-600">Active</span>
                  <Badge variant="secondary">{list.filter((a: any) => a.status === 'PUBLISHED').length}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 text-sm">
                  <span className="text-gray-600">Drafts</span>
                  <Badge variant="outline">{list.filter((a: any) => a.status === 'DRAFT').length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 gap-4">
          {filtered.map((assignment: any) => (
            <Card key={assignment.id} className="group hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedAssignment(assignment)}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={cn(
                    "w-1.5",
                    assignment.status === 'PUBLISHED' ? "bg-green-500" : "bg-amber-400"
                  )} />
                  <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">{assignment.subject.code}</Badge>
                        <span className="text-xs text-gray-400">Section {assignment.section.name}</span>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {assignment._count.submissions} Submissions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {assignment.status === 'DRAFT' && (
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          publishMutation.mutate(assignment.id);
                        }}>Publish</Button>
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
              <p className="text-gray-500">No assignments found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
