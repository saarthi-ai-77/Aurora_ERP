"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, X, Rocket } from "lucide-react";

interface Props {
  assignment: any;
  onClose: () => void;
  onConfirm: (dueDate: string, setNumber?: number) => void;
  isPending: boolean;
}

export function PublishAssignmentModal({ assignment, onClose, onConfirm, isPending }: Props) {
  const isMarkOnly = assignment.isMarkOnly || assignment.template?.isMarkOnly;
  const [dueDate, setDueDate] = useState(isMarkOnly ? new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 16) : "");
  const [setNumber, setSetNumber] = useState<number | undefined>(undefined);

  // Mapping for multiple sets based on assignment name
  const getSetOptions = () => {
    const title = assignment.title;
    if (["Reflective Journal", "Lab Journal", "Quiz", "Lab Participation"].some(s => title.includes(s))) return 10;
    if (["Assignment", "Lab Quiz"].some(s => title.includes(s))) return 2;
    return 0;
  };

  const setOptionsCount = getSetOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate && !isMarkOnly) return;
    onConfirm(dueDate, setNumber);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-slate-100">
        <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isMarkOnly ? "Direct Grading" : "Set Deadline"}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigning to Section {assignment.section.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white hover:shadow-md transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Task Title</p>
            <p className="text-lg font-black text-slate-800 tracking-tight">{assignment.title}</p>
          </div>

          {setOptionsCount > 0 && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sequence / Set Number</label>
              <select 
                required
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-slate-900 font-black text-sm shadow-sm transition-all"
                value={setNumber || ""}
                onChange={(e) => setSetNumber(Number(e.target.value))}
              >
                <option value="" disabled>Select Set...</option>
                {Array.from({ length: setOptionsCount }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Sequence Set {num}</option>
                ))}
              </select>
            </div>
          )}

          {isMarkOnly ? (
            <div className="p-6 bg-blue-50/50 rounded-[2rem] border-2 border-blue-100/50 space-y-3">
              <div className="flex items-center gap-3 text-blue-600">
                <Rocket className="w-6 h-6" />
                <span className="text-sm font-black uppercase tracking-tight">Direct Grade Mode Active</span>
              </div>
              <p className="text-xs font-bold text-blue-600/70 leading-relaxed">
                This assignment is set to "Marks Only". It will bypass the student ongoing list and go directly to your Grading Zone for mark entry.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Submission Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                <input 
                  type="datetime-local"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-slate-900 font-black text-sm shadow-sm transition-all"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit"
              disabled={isPending || (!dueDate && !isMarkOnly)}
              className="bg-slate-900 hover:bg-black text-white font-black shadow-2xl shadow-slate-200 h-14 w-full rounded-2xl transition-all active:scale-95"
            >
              {isPending ? "Assigning..." : (
                <div className="flex items-center gap-3">
                   <Rocket className="w-5 h-5" /> 
                   {isMarkOnly ? "Publish to Grading Zone" : "Confirm & Assign"}
                </div>
              )}
            </Button>
            <Button variant="ghost" onClick={onClose} className="font-black text-slate-400 uppercase tracking-widest text-[10px] h-12 w-full hover:bg-slate-50 rounded-2xl">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
