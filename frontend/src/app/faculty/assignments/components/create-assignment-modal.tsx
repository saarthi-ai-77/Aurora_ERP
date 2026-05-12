"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, academicApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X, Save, Calendar, BookOpen, Users } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  onClose: () => void;
}

export function CreateAssignmentModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    subjectId: "",
    sectionId: "",
    maxMarks: 100,
    dueDate: "",
    allowResubmissions: true,
  });

  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await academicApi.getMyContext();
        if (res.success) setContext(res.data);
      } finally {
        setLoading(false);
      }
    }
    fetchContext();
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: any) => assignmentsApi.createAssignment({
      ...data,
      templateId: "00000000-0000-0000-0000-000000000000", // Default template for now
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment created as draft");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create assignment");
    }
  });

  const assignments = context?.assignments || [];

  const handleAssignmentSelect = (id: string) => {
    const selected = assignments.find((a: any) => a.id === id);
    if (selected) {
      setFormData({
        ...formData,
        subjectId: selected.subjectId,
        sectionId: selected.sectionId,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId || !formData.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Assignment</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Assignment Title</label>
            <input 
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Database Normalization Project"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Class & Subject</label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                onChange={(e) => handleAssignmentSelect(e.target.value)}
              >
                <option value="">Select class...</option>
                {assignments.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.subject.name} - Section {a.section.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Max Marks</label>
              <input 
                type="number"
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.maxMarks}
                onChange={(e) => setFormData({...formData, maxMarks: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Due Date & Time</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input 
                type="datetime-local"
                className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Instructions (Optional)</label>
            <textarea 
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none h-32"
              placeholder="Provide clear steps for students..."
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700"
              disabled={createMutation.isPending || loading}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Save as Draft"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
