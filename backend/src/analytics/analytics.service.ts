import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { GradingStatus, AttendanceStatus, AssignmentStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
  ) {}

  async getStudentAnalytics(userId: string) {
    const context = await this.academicContext.resolveStudentContext(userId);
    const enrollmentId = context.enrollment?.id;

    if (!enrollmentId) return null;

    const [attendanceRecords, submissions, upcomingDeadlines] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: { studentEnrollmentId: enrollmentId },
        select: { status: true },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { studentEnrollmentId: enrollmentId },
        include: { assignment: { select: { title: true, dueDate: true } } },
      }),
      this.prisma.assignment.findMany({
        where: {
          sectionId: context.section.id,
          dueDate: { gt: new Date() },
          status: AssignmentStatus.PUBLISHED,
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: { id: true, title: true, dueDate: true, maxMarks: true },
      }),
    ]);

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;

    const gradedSubmissions = submissions.filter(
      (s) => s.gradingStatus === GradingStatus.GRADED,
    );
    const pendingSubmissions = submissions.filter(
      (s) => s.gradingStatus !== GradingStatus.GRADED,
    );

    return {
      attendance: {
        percentage:
          totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0,
        totalSessions: totalAttendance,
        present: presentCount,
      },
      assignments: {
        total: submissions.length,
        graded: gradedSubmissions.length,
        pending: pendingSubmissions.length,
      },
      upcomingDeadlines,
    };
  }

  async getFacultyAnalytics(userId: string) {
    const context = await this.academicContext.resolveFacultyContext(userId);
    const facultyId = context.profile.id;

    const assignmentIds = context.assignments.map((a: any) => a.id);

    // Single query instead of N+1 per assignment
    const allSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignment: { facultyAssignmentId: { in: assignmentIds } },
      },
      select: {
        gradingStatus: true,
        assignment: {
          select: {
            facultyAssignmentId: true,
            sectionId: true,
            subjectId: true,
          },
        },
      },
    });

    // Aggregate in JS per (sectionId, subjectId)
    const statsMap = new Map<
      string,
      { totalSubmissions: number; pendingGrading: number }
    >();

    for (const sub of allSubmissions) {
      const key = `${sub.assignment.sectionId}__${sub.assignment.subjectId}`;
      const entry = statsMap.get(key) ?? { totalSubmissions: 0, pendingGrading: 0 };
      entry.totalSubmissions++;
      if (sub.gradingStatus === GradingStatus.SUBMITTED) entry.pendingGrading++;
      statsMap.set(key, entry);
    }

    const sections = context.assignments.map((mapping: any) => {
      const key = `${mapping.sectionId}__${mapping.subjectId}`;
      const stats = statsMap.get(key) ?? { totalSubmissions: 0, pendingGrading: 0 };
      return {
        sectionName: mapping.section.name,
        subjectName: mapping.subject.name,
        ...stats,
      };
    });

    const pendingGradingSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        gradingStatus: GradingStatus.SUBMITTED,
        assignment: { facultyAssignment: { facultyId } },
      },
      include: {
        assignment: { select: { title: true } },
        enrollment: { include: { student: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { submittedAt: 'asc' },
      take: 10,
    });

    return {
      sections,
      pendingTasks: pendingGradingSubmissions.map((s) => ({
        id: s.id,
        studentName: `${s.enrollment.student.firstName} ${s.enrollment.student.lastName}`,
        assignmentTitle: s.assignment.title,
        submittedAt: s.submittedAt,
      })),
      stats: {
        activeSections: context.accessibleSections.length,
        totalStudents: await this.prisma.studentProfile.count({
          where: { sectionId: { in: context.accessibleSections } },
        }),
      },
    };
  }

  async getAdminAnalytics() {
    const [
      studentCount,
      facultyCount,
      sectionCount,
      departmentCount,
      courseCount,
      activeAssignmentCount,
      recentLogs,
    ] = await Promise.all([
      this.prisma.studentProfile.count(),
      this.prisma.facultyProfile.count(),
      this.prisma.section.count({ where: { isArchived: false } }),
      this.prisma.department.count(),
      this.prisma.course.count(),
      this.prisma.assignment.count({ where: { status: AssignmentStatus.PUBLISHED } }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: {
            select: {
              email: true,
              facultyProfile: { select: { firstName: true, lastName: true } },
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    return {
      counts: {
        students: studentCount,
        faculty: facultyCount,
        sections: sectionCount,
        departments: departmentCount,
        courses: courseCount,
        activeAssignments: activeAssignmentCount,
      },
      recentActivity: recentLogs.map((log) => {
        const p = log.actor.facultyProfile ?? log.actor.adminProfile;
        const actorName = p ? `${p.firstName} ${p.lastName}` : log.actor.email;
        return {
          id: log.id,
          actor: actorName,
          action: log.action,
          entityType: log.entityType,
          time: log.createdAt,
        };
      }),
    };
  }
}
