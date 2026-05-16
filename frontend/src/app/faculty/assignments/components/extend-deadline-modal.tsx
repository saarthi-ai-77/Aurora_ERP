"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Clock, Loader2, Save, Calendar as CalendarIcon } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  currentDueDate: string;
  isPending: boolean;
}

export function ExtendDeadlineModal({ isOpen, onClose, onConfirm, currentDueDate, isPending }: Props) {
  const [date, setDate] = useState<string>(
    currentDueDate ? new Date(currentDueDate).toISOString().split('T')[0] : ""
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Extend Deadline">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-50">
          <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Target Date Adjustment</p>
            <p className="text-sm font-bold text-slate-700">Set a new completion deadline</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">New Due Date</label>
          <div className="relative group">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="date" 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            Extending the deadline will automatically republish this assignment if it was previously closed.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => date && onConfirm(date)}
            disabled={isPending || !date}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-4 h-4 mr-2" /> Save Extension</>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
