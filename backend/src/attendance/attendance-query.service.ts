import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceQueryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches sessions for a faculty member.
   */
  async getFacultySessions(facultyId: string, limit = 20, offset = 0) {
    return this.prisma.attendanceSession.findMany({
      where: { facultyId },
      include: {
        section: true,
        subject: true,
        _count: { select: { records: true } }
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Fetches full session details including records and summary stats.
   */
  async getSessionDetails(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        section: true,
        subject: true,
        records: {
          include: {
            enrollment: {
              include: { student: true }
            }
          },
          orderBy: { enrollment: { student: { registrationNumber: 'asc' } } }
        }
      }
    });

    if (!session) throw new NotFoundException('Session not found');

    // Aggregate stats for this session
    const stats = {
      present: session.records.filter(r => r.status === AttendanceStatus.PRESENT).length,
      absent: session.records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      leave: session.records.filter(r => r.status === AttendanceStatus.LEAVE).length,
      late: session.records.filter(r => r.status === AttendanceStatus.LATE).length,
      total: session.records.length,
    };

    return { ...session, stats };
  }

  /**
   * Fetches attendance history for a specific student enrollment.
   * This ensures historical data is term-specific.
   */
  async getStudentHistory(enrollmentId: string, limit = 50, offset = 0) {
    return this.prisma.attendanceRecord.findMany({
      where: { studentEnrollmentId: enrollmentId },
      include: {
        session: {
          include: { subject: true, faculty: true }
        }
      },
      orderBy: { session: { date: 'desc' } },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Fetches subject-wise summaries for an enrollment.
   */
  async getStudentSubjectSummaries(enrollmentId: string) {
    // 1. Get all subjects for this enrollment's term
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { term: { include: { subjects: true } } }
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const subjects = enrollment.term.subjects;

    // 2. Aggregate records per subject
    const summaries = await Promise.all(subjects.map(async (subject) => {
      const records = await this.prisma.attendanceRecord.findMany({
        where: {
          studentEnrollmentId: enrollmentId,
          session: { subjectId: subject.id }
        }
      });

      const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
      const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
      const leave = records.filter(r => r.status === AttendanceStatus.LEAVE).length;
      const late = records.filter(r => r.status === AttendanceStatus.LATE).length;
      const total = records.length;

      return {
        subject,
        stats: { present, absent, leave, late, total }
      };
    }));

    return summaries;
  }
}
