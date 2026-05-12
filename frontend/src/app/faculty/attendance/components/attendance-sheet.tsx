"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Clock, AlertCircle, Save, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  assignment: any;
  onBack: () => void;
}

export function AttendanceSheet({ assignment, onBack }: Props) {
  const queryClient = useQueryClient();
  const [sessionDate] = useState(new Date().toISOString().split('T')[0]);

  // 1. Fetch or Create Session
  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['attendance-session', assignment.id, sessionDate],
    queryFn: async () => {
      try {
        const res = await attendanceApi.createSession({
          sectionId: assignment.sectionId,
          subjectId: assignment.subjectId,
          date: sessionDate,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          sessionTitle: `Class: ${assignment.subject.name}`,
        });
        return res.data;
      } catch (err: any) {
        throw err;
      }
    },
    retry: false,
  });

  // 2. Fetch Session Details (to get records)
  const { data: session, isLoading: loadingDetails } = useQuery({
    queryKey: ['session-details', sessionData?.id],
    queryFn: () => {
      if (!sessionData?.id) throw new Error("No session data");
      return attendanceApi.getSession(sessionData.id);
    },
    enabled: !!sessionData?.id,
  });

  // 3. Mutation for Marking
  const markMutation = useMutation({
    mutationFn: (records: any[]) => {
      if (!session?.data?.id) throw new Error("No session active");
      return attendanceApi.markAttendance(session.data.id, records);
    },
    onSuccess: () => {
      if (sessionData?.id) {
        queryClient.invalidateQueries({ queryKey: ['session-details', sessionData.id] });
      }
      toast.success("Attendance updated");
    }
  });

  if (loadingSession || loadingDetails) return <Loader2 className="animate-spin mx-auto my-12" />;

  const records = session?.data?.records || [];

  const handleStatusToggle = (studentEnrollmentId: string, currentStatus: string) => {
    if (session?.data?.status === 'LOCKED') return;

    const statuses = ['ABSENT', 'PRESENT', 'LATE', 'LEAVE'];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    markMutation.mutate([{ studentEnrollmentId, status: nextStatus }]);
  };

  const handleLock = async () => {
    if (!session?.data?.id) return;
    try {
      await attendanceApi.lockSession(session.data.id);
      queryClient.invalidateQueries({ queryKey: ['session-details', sessionData?.id] });
      toast.success("Session locked");
    } catch (err) {
      toast.error("Failed to lock session");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-lg font-bold">{assignment.subject.name} - Section {assignment.section.name}</h2>
          <p className="text-sm text-gray-500">Date: {sessionDate} | Status: <Badge variant="outline">{session?.data?.status || 'DRAFT'}</Badge></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button 
            className="bg-indigo-600" 
            onClick={() => {
              const allPresent = records.map((r: any) => ({
                studentEnrollmentId: r.studentEnrollmentId,
                status: 'PRESENT'
              }));
              markMutation.mutate(allPresent);
            }}
            disabled={session?.data?.status === 'LOCKED'}
          >
            Mark All Present
          </Button>
          <Button variant="destructive" onClick={handleLock} disabled={session?.data?.status === 'LOCKED'}>
            <Lock className="w-4 h-4 mr-2" /> Finalize & Lock
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-24">Reg No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record: any) => (
              <TableRow key={record.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => handleStatusToggle(record.studentEnrollmentId, record.status)}>
                <TableCell className="font-mono text-xs">{record.enrollment.student.registrationNumber}</TableCell>
                <TableCell className="font-medium">
                  {record.enrollment.student.firstName} {record.enrollment.student.lastName}
                </TableCell>
                <TableCell className="text-center">
                  <StatusChip status={record.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-400 italic">
                  {record.remarks || "No remarks"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const configs: any = {
    PRESENT: { color: "bg-green-100 text-green-700 border-green-200", icon: Check },
    ABSENT: { color: "bg-red-100 text-red-700 border-red-200", icon: X },
    LATE: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    LEAVE: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
  };

  const config = configs[status] || configs.ABSENT;
  const Icon = config.icon;

  return (
    <Badge className={cn("px-2 py-1 flex items-center gap-1 w-24 justify-center border", config.color)} variant="outline">
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
}
