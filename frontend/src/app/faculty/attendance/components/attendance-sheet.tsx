"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Clock, AlertCircle, Lock, ArrowLeft, Users } from "lucide-react";
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

  // 3. Mutation for Marking with Optimistic Updates
  const markMutation = useMutation({
    mutationFn: (records: any[]) => {
      if (!session?.data?.id) throw new Error("No session active");
      return attendanceApi.markAttendance(session.data.id, records);
    },
    onMutate: async (newRecords) => {
      await queryClient.cancelQueries({ queryKey: ['session-details', sessionData?.id] });
      const previousSession = queryClient.getQueryData(['session-details', sessionData?.id]);

      queryClient.setQueryData(['session-details', sessionData?.id], (old: any) => {
        if (!old || !old.data) return old;
        const updatedRecords = old.data.records.map((record: any) => {
          const match = newRecords.find((r) => r.studentEnrollmentId === record.studentEnrollmentId);
          if (match) {
            return {
              ...record,
              status: match.status,
              remarks: match.remarks !== undefined ? match.remarks : record.remarks,
            };
          }
          return record;
        });
        return {
          ...old,
          data: {
            ...old.data,
            records: updatedRecords,
          },
        };
      });

      return { previousSession };
    },
    onError: (err, newRecords, context: any) => {
      if (context?.previousSession) {
        queryClient.setQueryData(['session-details', sessionData?.id], context.previousSession);
      }
      toast.error("Failed to update attendance");
    },
    onSettled: () => {
      if (sessionData?.id) {
        queryClient.invalidateQueries({ queryKey: ['session-details', sessionData.id] });
      }
    },
  });

  const handleLock = async () => {
    if (!session?.data?.id) return;
    try {
      await attendanceApi.lockSession(session.data.id);
      queryClient.invalidateQueries({ queryKey: ['session-details', sessionData?.id] });
      toast.success("Session locked and attendance finalized");
    } catch (err) {
      toast.error("Failed to finalize attendance session");
    }
  };

  if (loadingSession || loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading attendance sheet...</p>
      </div>
    );
  }

  const records = session?.data?.records || [];
  const totalCount = records.length;
  const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
  const lateCount = records.filter((r: any) => r.status === 'LATE').length;
  const leaveCount = records.filter((r: any) => r.status === 'LEAVE').length;

  const attendancePercentage = totalCount > 0 
    ? (((presentCount + lateCount) / totalCount) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 rounded-lg" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
            <h2 className="text-xl font-bold text-slate-900">
              {assignment.subject.name}
            </h2>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-8">
            Section {assignment.section.name} • {sessionDate} • State:{" "}
            <Badge 
              variant="secondary" 
              className={cn(
                "px-2 py-0.5 ml-1 text-xs font-semibold rounded-md border",
                session?.data?.status === 'LOCKED' 
                  ? "bg-slate-100 text-slate-700 border-slate-200" 
                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
              )}
            >
              {session?.data?.status || 'DRAFT'}
            </Badge>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pl-8 md:pl-0">
          <Button 
            variant="outline"
            className="h-10 text-xs font-bold border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800" 
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
          <Button 
            variant="outline"
            className="h-10 text-xs font-bold border-red-200 hover:bg-red-50 text-red-700 hover:text-red-800" 
            onClick={() => {
              const allAbsent = records.map((r: any) => ({
                studentEnrollmentId: r.studentEnrollmentId,
                status: 'ABSENT'
              }));
              markMutation.mutate(allAbsent);
            }}
            disabled={session?.data?.status === 'LOCKED'}
          >
            Mark All Absent
          </Button>
          <Button 
            className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-100" 
            onClick={handleLock} 
            disabled={session?.data?.status === 'LOCKED'}
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Finalize & Lock
          </Button>
        </div>
      </div>

      {/* Live Roster Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Roster
          </span>
          <span className="text-2xl font-black text-slate-800 mt-2">{totalCount}</span>
        </div>
        <div className="bg-green-50/60 border border-green-100 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs text-green-700 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Present
          </span>
          <span className="text-2xl font-black text-green-800 mt-2">{presentCount}</span>
        </div>
        <div className="bg-red-50/60 border border-red-100 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs text-red-700 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Absent
          </span>
          <span className="text-2xl font-black text-red-800 mt-2">{absentCount}</span>
        </div>
        <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Late
          </span>
          <span className="text-2xl font-black text-amber-800 mt-2">{lateCount}</span>
        </div>
        <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs text-blue-700 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Leave
          </span>
          <span className="text-2xl font-black text-blue-800 mt-2">{leaveCount}</span>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col justify-between sm:col-span-1 md:col-span-1">
          <span className="text-xs text-indigo-700 font-bold">Attendance Rate</span>
          <span className="text-2xl font-black text-indigo-900 mt-2">{attendancePercentage}%</span>
        </div>
      </div>

      {/* Roster Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="w-32 font-bold text-slate-600">Reg No.</TableHead>
              <TableHead className="font-bold text-slate-600">Student Name</TableHead>
              <TableHead className="text-center w-72 font-bold text-slate-600">Mark Attendance</TableHead>
              <TableHead className="font-bold text-slate-600">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record: any) => (
              <TableRow 
                key={record.id} 
                className={cn(
                  "hover:bg-slate-50/50 transition-colors border-b border-slate-100",
                  record.status === 'ABSENT' && "bg-red-50/10 hover:bg-red-50/20"
                )}
              >
                <TableCell className="font-mono text-xs font-medium text-slate-500">
                  {record.enrollment.student.registrationNumber}
                </TableCell>
                <TableCell>
                  <p className="font-bold text-slate-800">
                    {record.enrollment.student.firstName} {record.enrollment.student.lastName}
                  </p>
                </TableCell>
                <TableCell className="text-center py-3">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={session?.data?.status === 'LOCKED'}
                      onClick={() => markMutation.mutate([{ studentEnrollmentId: record.studentEnrollmentId, status: 'PRESENT' }])}
                      title="Present"
                      className={cn(
                        "px-3 py-1.5 text-xs font-extrabold rounded-md transition-all w-10",
                        record.status === 'PRESENT'
                          ? "bg-green-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      P
                    </button>
                    <button
                      disabled={session?.data?.status === 'LOCKED'}
                      onClick={() => markMutation.mutate([{ studentEnrollmentId: record.studentEnrollmentId, status: 'ABSENT' }])}
                      title="Absent"
                      className={cn(
                        "px-3 py-1.5 text-xs font-extrabold rounded-md transition-all w-10",
                        record.status === 'ABSENT'
                          ? "bg-red-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      A
                    </button>
                    <button
                      disabled={session?.data?.status === 'LOCKED'}
                      onClick={() => markMutation.mutate([{ studentEnrollmentId: record.studentEnrollmentId, status: 'LATE' }])}
                      title="Late"
                      className={cn(
                        "px-3 py-1.5 text-xs font-extrabold rounded-md transition-all w-10",
                        record.status === 'LATE'
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      L
                    </button>
                    <button
                      disabled={session?.data?.status === 'LOCKED'}
                      onClick={() => markMutation.mutate([{ studentEnrollmentId: record.studentEnrollmentId, status: 'LEAVE' }])}
                      title="Leave"
                      className={cn(
                        "px-3 py-1.5 text-xs font-extrabold rounded-md transition-all w-10",
                        record.status === 'LEAVE'
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Lv
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    placeholder="Add remarks..."
                    disabled={session?.data?.status === 'LOCKED'}
                    defaultValue={record.remarks || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (record.remarks || "")) {
                        markMutation.mutate([{ 
                          studentEnrollmentId: record.studentEnrollmentId, 
                          status: record.status, 
                          remarks: e.target.value 
                        }]);
                      }
                    }}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    className="w-full max-w-[200px] bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white px-2 py-1 text-xs rounded transition-all outline-none"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
