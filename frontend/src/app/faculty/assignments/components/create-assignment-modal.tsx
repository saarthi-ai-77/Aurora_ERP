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
    instructions: "",
    templateId: "",
    subjectId: "",
    sectionId: "",
    maxMarks: 100,
    dueDate: "",
    variant: 1,
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

  const { data: templatesRes } = useQuery({
    queryKey: ['assignment-templates'],
    queryFn: () => assignmentsApi.getTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => assignmentsApi.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      toast.success("Assignment created as draft");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create assignment");
    }
  });

  const templates = templatesRes?.data || [];
  const assignments = context?.assignments || [];

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        maxMarks: Number(template.maxMarks),
      });
    }
  };

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

  const handleSubmit = (status: "DRAFT" | "PUBLISHED") => {
    const selectedTemplate = templates.find((t: any) => t.id === formData.templateId);
    
    if (!formData.templateId || !formData.subjectId || !formData.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const title = `${selectedTemplate.name} ${formData.variant}`;

    createMutation.mutate({
      ...formData,
      title,
      status,
      dueDate: new Date(formData.dueDate),
    });
  };

  const selectedTemplate = templates.find((t: any) => t.id === formData.templateId);
  const generatedTitle = selectedTemplate ? `${selectedTemplate.name} ${formData.variant}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-extrabold text-gray-900">Create New Assignment</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-dashed border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Generated Title</p>
                <h3 className="text-xl font-black text-indigo-900">
                  {generatedTitle || "Select type & variant..."}
                </h3>
              </div>
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <BookOpen className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Assignment Type</label>
              <select 
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm bg-white text-gray-900 font-semibold"
                value={formData.templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
              >
                <option value="">Select type...</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Class & Subject</label>
              <select 
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm bg-white text-gray-900 font-semibold"
                value={assignments.find((a: any) => a.subjectId === formData.subjectId && a.sectionId === formData.sectionId)?.id || ""}
                onChange={(e) => handleAssignmentSelect(e.target.value)}
              >
                <option value="">Select class...</option>
                {assignments.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.subject.name} - {a.section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Due Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
                <input 
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-900 font-medium"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Max Marks</label>
              <input 
                type="number"
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-900 font-bold"
                value={formData.maxMarks}
                onChange={(e) => setFormData({...formData, maxMarks: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Variant / Set #</label>
              <input 
                type="number"
                min="1"
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-900 font-bold"
                value={formData.variant}
                onChange={(e) => setFormData({...formData, variant: Number(e.target.value)})}
              />
            </div>
            <div className="pt-8">
               <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                 Unique identifier for journals (1-10) or assignments (1-2).
               </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Instructions (Optional)</label>
            <textarea 
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none min-h-[100px] transition-all text-gray-900"
              placeholder="Provide clear steps for students..."
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="font-bold text-gray-600">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSubmit("DRAFT")}
              disabled={createMutation.isPending}
              className="border-2 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50"
            >
              Save as Draft
            </Button>
            <Button 
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 px-8"
            >
              {createMutation.isPending ? "Creating..." : "Publish Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
