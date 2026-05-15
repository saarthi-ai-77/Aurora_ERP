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
  const [dueDate, setDueDate] = useState("");
  const [setNumber, setSetNumber] = useState<number | undefined>(undefined);

  // Mapping for multiple sets based on assignment name
  const getSetOptions = () => {
    const name = assignment.title;
    if (["Reflective Journal", "Lab Journal", "Quiz", "Lab Participation"].includes(name)) return 10;
    if (["Assignment", "Lab Quiz"].includes(name)) return 2;
    return 0;
  };

  const setOptionsCount = getSetOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;
    onConfirm(dueDate, setNumber);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-extrabold text-gray-900">Assign to Students</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">
              You are about to assign <span className="font-bold text-indigo-600">{assignment.title}</span> to Section <span className="font-bold text-indigo-600">{assignment.section.name}</span>.
            </p>
          </div>

          {setOptionsCount > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Select Set / Sequence</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-900 font-medium bg-white"
                value={setNumber || ""}
                onChange={(e) => setSetNumber(Number(e.target.value))}
              >
                <option value="" disabled>Select Set Number</option>
                {Array.from({ length: setOptionsCount }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Set {num}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-black text-gray-800 uppercase tracking-tight">Set Submission Deadline</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
              <input 
                type="datetime-local"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-900 font-medium"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">
              Students will not be able to submit after this date unless you manually reopen it for them.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit"
              disabled={isPending || !dueDate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 h-12 w-full"
            >
              {isPending ? "Assigning..." : (
                <div className="flex items-center gap-2">
                   <Rocket className="w-4 h-4" /> Assign Now
                </div>
              )}
            </Button>
            <Button variant="ghost" onClick={onClose} className="font-bold text-gray-500 h-12 w-full">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
