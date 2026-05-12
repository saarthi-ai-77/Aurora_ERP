import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { AttendanceStatus, AttendanceSessionStatus, LifecycleStatus, Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
  ) {}

  /**
   * Creates an attendance session in DRAFT state and initializes records for all enrolled students.
   * Transactional to ensure integrity.
   */
  async createSession(
    facultyId: string,
    data: {
      sectionId: string;
      subjectId: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      sessionTitle?: string;
      notes?: string;
    }
  ) {
    // 1. Resolve Active Session & Validate
    const activeSession = await this.academicContext.getActiveAcademicSession();
    if (!activeSession) {
      throw new BadRequestException('No active academic session found');
    }

    // 2. Validate Academic Integrity (Term match)
    // We already resolved active term from context, but let's be explicit
    
    // 3. Prevent Duplicates (Section, Subject, Date, StartTime)
    const existing = await this.prisma.attendanceSession.findFirst({
      where: {
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        date: data.date,
        startTime: data.startTime,
      },
    });
    if (existing) {
      throw new BadRequestException('A session already exists for this section, subject, and time slot');
    }

    // 4. Validate Faculty Assignment Ownership (MUST BE ACTIVE)
    const assignment = await this.prisma.facultyAssignment.findFirst({
      where: {
        facultyId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        termId: activeSession.term.id,
        status: LifecycleStatus.ACTIVE,
        isArchived: false,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You do not have an active teaching assignment for this section/subject in the current term');
    }

    // 5. Transactional Creation
    return this.prisma.$transaction(async (tx) => {
      // Create Session (DRAFT by default)
      const session = await tx.attendanceSession.create({
        data: {
          ...data,
          facultyId,
          termId: activeSession.term.id,
          yearId: activeSession.year.id,
          status: AttendanceSessionStatus.DRAFT,
        },
      });

      // Fetch enrolled students
      const enrollments = await tx.studentEnrollment.findMany({
        where: {
          sectionId: data.sectionId,
          termId: activeSession.term.id,
          isCurrent: true,
        },
      });

      if (enrollments.length === 0) {
        throw new BadRequestException('Relational Integrity Failure: No active enrollments found for this section/term');
      }

      // Initialize all records as ABSENT (Bulk creation)
      await tx.attendanceRecord.createMany({
        data: enrollments.map((e) => ({
          sessionId: session.id,
          studentEnrollmentId: e.id,
          status: AttendanceStatus.ABSENT,
        })),
      });

      return session;
    });
  }

  /**
   * Bulk marks attendance for a session.
   */
  async markAttendance(
    sessionId: string,
    records: { studentEnrollmentId: string; status: AttendanceStatus; remarks?: string }[]
  ) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.status === AttendanceSessionStatus.LOCKED) {
      throw new BadRequestException('Attendance is locked for this session');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update session status to ACTIVE if it was DRAFT
      if (session.status === AttendanceSessionStatus.DRAFT) {
        await tx.attendanceSession.update({
          where: { id: sessionId },
          data: { status: AttendanceSessionStatus.ACTIVE }
        });
      }

      const updates = records.map((r) =>
        tx.attendanceRecord.update({
          where: {
            sessionId_studentEnrollmentId: {
              sessionId,
              studentEnrollmentId: r.studentEnrollmentId,
            },
          },
          data: {
            status: r.status,
            remarks: r.remarks,
          },
        })
      );

      return Promise.all(updates);
    });
  }

  /**
   * Updates a single record with enhanced audit logging.
   */
  async updateRecord(
    recordId: string,
    editorId: string,
    data: { status: AttendanceStatus; remarks?: string; reason?: string }
  ) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { session: true },
    });

    if (!record) throw new NotFoundException('Attendance record not found');
    if (record.session.status === AttendanceSessionStatus.LOCKED) {
      throw new BadRequestException('Operational Constraint: Session is locked');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Granular Audit
      await tx.attendanceAudit.create({
        data: {
          attendanceRecordId: record.id,
          sessionId: record.sessionId,
          studentEnrollmentId: record.studentEnrollmentId,
          previousStatus: record.status,
          newStatus: data.status,
          changedField: 'status',
          editedById: editorId,
          reason: data.reason,
          metadata: {
            oldRemarks: record.remarks,
            newRemarks: data.remarks,
            ip: 'system', // Could be added from request
          } as any,
        },
      });

      // 2. Update Record
      return tx.attendanceRecord.update({
        where: { id: recordId },
        data: {
          status: data.status,
          remarks: data.remarks,
        },
      });
    });
  }

  /**
   * Finalizes and locks an attendance session.
   */
  async lockSession(id: string) {
    return this.prisma.attendanceSession.update({
      where: { id },
      data: { status: AttendanceSessionStatus.LOCKED },
    });
  }

  /**
   * Unlocks an attendance session (Admin/Super-Faculty only).
   */
  async unlockSession(id: string) {
    return this.prisma.attendanceSession.update({
      where: { id },
      data: { status: AttendanceSessionStatus.ACTIVE },
    });
  }
}
