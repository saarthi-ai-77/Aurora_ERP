"use client";

import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, GraduationCap, ChevronRight } from "lucide-react";

interface SectionGalleryProps {
  sections: any[];
  onSelect: (section: any) => void;
}

export function SectionGallery({ sections, onSelect }: SectionGalleryProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl text-center">
        <div className="p-4 bg-slate-50 rounded-2xl mb-4">
          <GraduationCap className="w-8 h-8 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-500">No teaching assignments found</p>
        <p className="text-sm text-slate-400 mt-1">Contact the administrator to assign sections to your profile.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {sections.map((mapping, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(mapping)}
          className="group text-left bg-white border-2 border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 rounded-2xl p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div className="flex items-start justify-between mb-5">
            <Badge className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1">
              {mapping.subject?.code || "N/A"}
            </Badge>
            <div className="p-2 bg-slate-50 group-hover:bg-blue-50 rounded-xl transition-colors">
              <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
              {mapping.subject?.name}
            </h3>
            <p className="text-sm text-slate-500">
              Section {mapping.section?.name}
              {mapping.term?.name ? ` · ${mapping.term.name}` : ""}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>Open workspace</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-500 group-hover:translate-x-0.5 transition-transform">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
