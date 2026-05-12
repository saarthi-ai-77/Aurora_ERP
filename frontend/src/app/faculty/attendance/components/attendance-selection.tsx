"use client";

import { useState, useEffect } from "react";
import { academicApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Users, Calendar } from "lucide-react";

interface Props {
  onSelected: (assignment: any) => void;
}

export function AttendanceSelection({ onSelected }: Props) {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<any>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await academicApi.getMyContext();
        if (res.success) {
          setContext(res.data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchContext();
  }, []);

  if (loading) return <Loader2 className="animate-spin mx-auto my-8" />;

  const assignments = context?.assignments || [];

  return (
    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Select Class for Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teaching Assignment</label>
            <Select 
              value={selectedAssignmentId} 
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
            >
              <option value="" disabled>Select a subject & section</option>
              {assignments.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.subject.name} - Section {a.section.name} ({a.term.name})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700" 
          disabled={!selectedAssignmentId}
          onClick={() => {
            const assignment = assignments.find((a: any) => a.id === selectedAssignmentId);
            onSelected(assignment);
          }}
        >
          Load Attendance Sheet
        </Button>
      </CardContent>
    </Card>
  );
}
