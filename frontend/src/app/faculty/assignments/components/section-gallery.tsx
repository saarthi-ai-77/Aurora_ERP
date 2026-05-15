"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, ArrowRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionGalleryProps {
  sections: any[];
  onSelect: (section: any) => void;
}

export function SectionGallery({ sections, onSelect }: SectionGalleryProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No teaching assignments found.</p>
        <p className="text-sm text-gray-400">Contact the administrator to assign sections to your profile.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {sections.map((mapping, idx) => (
        <Card 
          key={idx} 
          className="group hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer overflow-hidden border-2"
          onClick={() => onSelect(mapping)}
        >
          <CardHeader className="bg-gray-50/50 group-hover:bg-indigo-50/30 transition-colors">
            <div className="flex justify-between items-start">
              <Badge className="bg-indigo-600 mb-2">{mapping.subject.code}</Badge>
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-xl group-hover:text-indigo-700 transition-colors">
              {mapping.subject.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 font-medium">
              Section {mapping.section.name} • {mapping.term.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Class Record</span>
                </div>
              </div>
              <div className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Manager <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
