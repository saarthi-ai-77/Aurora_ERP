"use client";

import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentAttendancePage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['student-attendance-summary'],
    queryFn: () => attendanceApi.getMySummary(),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['student-attendance-history'],
    queryFn: () => attendanceApi.getMyHistory({ limit: 10 }),
  });

  if (loadingSummary || loadingHistory) return <Loader2 className="animate-spin mx-auto my-12" />;

  const subjectStats = summary?.data || [];
  const historyRecords = history?.data || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Attendance</h1>
        <p className="text-gray-500">Track your academic presence and subject-wise health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjectStats.map((item: any) => (
          <SubjectAttendanceCard key={item.subject.id} item={item} />
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Recent Attendance History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase text-gray-500 border-b">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Faculty</th>
              </tr>
            </thead>
            <tbody>
              {historyRecords.map((record: any) => (
                <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">
                    {new Date(record.session.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {record.session.subject.name}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {record.session.faculty.firstName} {record.session.faculty.lastName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SubjectAttendanceCard({ item }: { item: any }) {
  const { standard, health } = item.health;

  const healthColors: any = {
    SAFE: "text-green-600",
    WARNING: "text-amber-600",
    CRITICAL: "text-red-600",
  };

  const progressColors: any = {
    SAFE: "bg-green-600",
    WARNING: "bg-amber-500",
    CRITICAL: "bg-red-600",
  };

  return (
    <Card className="border shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gray-50/50 pb-4">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2 font-mono text-[10px]">{item.subject.code}</Badge>
          <HealthIcon health={health} />
        </div>
        <CardTitle className="text-lg line-clamp-1">{item.subject.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-gray-500">Attendance</span>
          <span className={cn("text-2xl font-bold", healthColors[health])}>{standard}%</span>
        </div>
        <Progress value={standard} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-2">
          <div className="flex justify-between text-gray-500">
            <span>Present:</span>
            <span className="text-gray-900">{item.stats.present}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Absent:</span>
            <span className="text-gray-900">{item.stats.absent}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Late:</span>
            <span className="text-gray-900">{item.stats.late}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Total:</span>
            <span className="text-gray-900">{item.stats.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthIcon({ health }: { health: string }) {
  if (health === 'SAFE') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  if (health === 'WARNING') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  return <AlertTriangle className="w-5 h-5 text-red-600" />;
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    PRESENT: "bg-green-100 text-green-700 border-green-200",
    ABSENT: "bg-red-100 text-red-700 border-red-200",
    LATE: "bg-amber-100 text-amber-700 border-amber-200",
    LEAVE: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge className={cn("font-medium", variants[status] || "bg-gray-100")} variant="outline">
      {status}
    </Badge>
  );
}
