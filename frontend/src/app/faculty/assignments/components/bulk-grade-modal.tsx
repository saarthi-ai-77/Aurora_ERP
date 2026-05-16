"use client";

import { useState, useEffect } from "react";
import { academicApi, assignmentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Loader2, Save, X, User, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  sectionId: string;
  subjectId: string;
  onSuccess: () => void;
}

export function BulkGradeModal({ isOpen, onClose, template, sectionId, subjectId, onSuccess }: Props) {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await academicApi.getSectionStudents(sectionId, { limit: 200 });
      // Ensure we handle the potentially wrapped data correctly
      const studentList = Array.isArray(response) ? response : (response as any).data || [];
      setStudents(studentList);
      
      // Prefill grades with 0 or empty
      const initialGrades: Record<string, number> = {};
      studentList.forEach((s: any) => {
        initialGrades[s.id] = 0;
      });
      setGrades(initialGrades);
    } catch (error) {
      toast.error("Failed to fetch student roster");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (enrollmentId: string, value: string) => {
    const numValue = Math.min(template.maxMarks, Math.max(0, Number(value) || 0));
    setGrades(prev => ({ ...prev, [enrollmentId]: numValue }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        templateId: template.id,
        sectionId,
        subjectId,
        title: template.name,
        maxMarks: template.maxMarks,
        grades: Object.entries(grades).map(([enrollmentId, marks]) => ({
          studentEnrollmentId: enrollmentId,
          marks
        }))
      };

      // Since we haven't implemented the backend endpoint yet, I'll mock the call structure
      // We will implement the backend next
      await (assignmentsApi as any).bulkGradeAndPublish(payload);
      
      toast.success("Assignment published with grades successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to publish grades");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Grade: ${template?.name}`}>
      <div className="flex flex-col h-[70vh]">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-6 border-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grading Standard</p>
              <p className="text-sm font-bold text-slate-700">Max Marks: {template?.maxMarks}</p>
            </div>
          </div>
          <Badge className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-xl">
            {students.length} Students
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Roster...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((enrollment) => (
                <div 
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {enrollment.student.registrationNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input 
                      type="number"
                      min={0}
                      max={template.maxMarks}
                      className="w-24 px-4 py-2 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none text-right font-black text-slate-900 transition-all bg-white"
                      value={grades[enrollment.id] ?? 0}
                      onChange={(e) => handleMarkChange(enrollment.id, e.target.value)}
                    />
                    <span className="text-xs font-black text-slate-300 w-12">/ {template.maxMarks}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 mt-4 border-t-2 border-slate-50 flex gap-4">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase tracking-widest text-[10px] hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-4 h-4 mr-2" /> Finish & Publish</>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
