import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceQueryService {
  constructor(private prisma: PrismaService) {}

  async getFacultySessions(facultyId: string, limit = 20, offset = 0) {
    return this.prisma.attendanceSession.findMany({
      where: { facultyId },
      include: {
        section: true,
        subject: true,
        _count: { select: { records: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getSessionDetails(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        section: true,
        subject: true,
        records: {
          include: {
            enrollment: { include: { student: true } },
          },
          orderBy: { enrollment: { student: { registrationNumber: 'asc' } } },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    const stats = {
      present: session.records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      absent: session.records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
      leave: session.records.filter((r) => r.status === AttendanceStatus.LEAVE).length,
      late: session.records.filter((r) => r.status === AttendanceStatus.LATE).length,
      total: session.records.length,
    };

    return { ...session, stats };
  }

  async getStudentHistory(enrollmentId: string, limit = 50, offset = 0) {
    return this.prisma.attendanceRecord.findMany({
      where: { studentEnrollmentId: enrollmentId },
      include: {
        session: { include: { subject: true, faculty: true } },
      },
      orderBy: { session: { date: 'desc' } },
      take: limit,
      skip: offset,
    });
  }

  async getStudentSubjectSummaries(enrollmentId: string) {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { term: { include: { subjects: { where: { isArchived: false } } } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Single query for all records, then aggregate in JS (was N+1 per subject)
    const allRecords = await this.prisma.attendanceRecord.findMany({
      where: { studentEnrollmentId: enrollmentId },
      include: { session: { select: { subjectId: true } } },
    });

    const recordsBySubject = new Map<string, typeof allRecords>();
    for (const record of allRecords) {
      const sid = record.session.subjectId;
      const existing = recordsBySubject.get(sid) ?? [];
      existing.push(record);
      recordsBySubject.set(sid, existing);
    }

    return enrollment.term.subjects.map((subject) => {
      const records = recordsBySubject.get(subject.id) ?? [];
      return {
        subject,
        stats: {
          present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
          absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
          leave: records.filter((r) => r.status === AttendanceStatus.LEAVE).length,
          late: records.filter((r) => r.status === AttendanceStatus.LATE).length,
          total: records.length,
        },
      };
    });
  }
}
