import { Injectable, Scope, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, LifecycleStatus } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class AcademicContextService {
  private memoizedStudentContext: any = null;
  private memoizedFacultyContext: any = null;
  private memoizedActiveSession: any = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Resolves the globally active academic session (Year & Term).
   * Enforces integrity: Only one active year and one active term per year.
   */
  async getActiveAcademicSession() {
    if (this.memoizedActiveSession) return this.memoizedActiveSession;

    const activeYear = await this.prisma.year.findFirst({
      where: { isCurrent: true },
      include: {
        course: {
          include: { department: true }
        }
      }
    });

    if (!activeYear) return null;

    const activeTerm = await this.prisma.term.findFirst({
      where: { yearId: activeYear.id, isCurrent: true },
    });

    this.memoizedActiveSession = {
      year: activeYear,
      term: activeTerm,
      label: `${activeYear.academicYear || 'Unknown'} - ${activeTerm?.name || 'No Active Term'}`
    };

    return this.memoizedActiveSession;
  }

  /**
   * Resolves full academic context for a student.
   */
  async resolveStudentContext(userId: string) {
    if (this.memoizedStudentContext) return this.memoizedStudentContext;

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        section: {
          include: {
            term: {
              include: {
                year: {
                  include: {
                    course: { include: { department: true } }
                  }
                }
              }
            }
          }
        },
        enrollments: {
          where: { isCurrent: true },
          include: { section: true, term: true }
        },
        mentor: true,
      }
    });

    if (!student) throw new NotFoundException('Student profile not found');

    // Fetch enrolled subjects for the student's current term
    const enrolledSubjects = await this.prisma.subject.findMany({
      where: {
        termId: student.section.termId,
        status: LifecycleStatus.ACTIVE,
        isArchived: false
      }
    });

    this.memoizedStudentContext = {
      profile: student,
      department: student.section.term.year.course.department,
      course: student.section.term.year.course,
      year: student.section.term.year,
      term: student.section.term,
      section: student.section,
      enrollment: student.enrollments[0] || null,
      subjects: enrolledSubjects,
      mentor: student.mentor,
    };

    return this.memoizedStudentContext;
  }

  /**
   * Resolves all teaching mappings for a faculty member.
   */
  async resolveFacultyContext(userId: string) {
    if (this.memoizedFacultyContext) return this.memoizedFacultyContext;

    const faculty = await this.prisma.facultyProfile.findUnique({
      where: { userId },
    });

    if (!faculty) throw new NotFoundException('Faculty profile not found');

    const assignments = await this.prisma.facultyAssignment.findMany({
      where: {
        facultyId: faculty.id,
        status: LifecycleStatus.ACTIVE,
        isArchived: false
      },
      include: {
        section: { include: { term: true } },
        subject: true,
        term: true,
        year: true
      }
    });

    this.memoizedFacultyContext = {
      profile: faculty,
      assignments: assignments,
      accessibleSections: Array.from(new Set(assignments.map(a => a.sectionId))),
      accessibleSubjects: Array.from(new Set(assignments.map(a => a.subjectId))),
      teachingMappings: assignments.map(a => ({
        section: a.section,
        subject: a.subject,
        term: a.term
      }))
    };

    return this.memoizedFacultyContext;
  }

  /**
   * Centralized ownership validator.
   * Enforces dual-level (Section + Subject) authorization for Faculty.
   */
  async validateOwnership(
    userId: string,
    role: Role,
    resource: { 
      sectionId?: string; 
      subjectId?: string; 
      sessionId?: string;
      assignmentId?: string;
      submissionId?: string;
      recordId?: string;
      fallbackId?: string;
    }
  ) {
    if (role === Role.ADMIN) return true;

    // Resolve IDs from session/assignment/record if provided
    let { sectionId, subjectId } = resource;
    const resolvingSpecificResource = Boolean(
      resource.sessionId ||
        resource.assignmentId ||
        resource.submissionId ||
        resource.recordId ||
        resource.fallbackId,
    );

    // Try to resolve from recordId first
    if (resource.recordId) {
      const record = await this.prisma.attendanceRecord.findUnique({
        where: { id: resource.recordId },
        select: { session: { select: { sectionId: true, subjectId: true } } },
      });
      if (record) {
        sectionId = record.session.sectionId;
        subjectId = record.session.subjectId;
      }
    }

    // Try to resolve from sessionId
    const sid = resource.sessionId || resource.fallbackId;
    if (sid && (!sectionId || !subjectId)) {
      const session = await this.prisma.attendanceSession.findUnique({
        where: { id: sid },
        select: { sectionId: true, subjectId: true },
      });
      if (session) {
        sectionId = session.sectionId;
        subjectId = session.subjectId;
      }
    }

    // Try to resolve from assignmentId
    const aid = resource.assignmentId || resource.fallbackId;
    if (aid && (!sectionId || !subjectId)) {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: aid },
        select: { sectionId: true, subjectId: true },
      });
      if (assignment) {
        sectionId = assignment.sectionId;
        subjectId = assignment.subjectId;
      }
    }

    const subId = resource.submissionId || resource.fallbackId;
    if (subId && (!sectionId || !subjectId)) {
      const submission = await this.prisma.assignmentSubmission.findUnique({
        where: { id: subId },
        select: {
          assignment: {
            select: {
              sectionId: true,
              subjectId: true,
            },
          },
        },
      });
      if (submission) {
        sectionId = submission.assignment.sectionId;
        subjectId = submission.assignment.subjectId;
      }
    }

    if (resolvingSpecificResource && (!sectionId || !subjectId)) {
      return false;
    }

    if (role === Role.STUDENT) {
      const context = await this.resolveStudentContext(userId);
      if (sectionId && context.section.id !== sectionId) return false;
      if (subjectId) {
        const isAssignedSubject = await this.prisma.sectionSubject.findFirst({
          where: {
            sectionId: context.section.id,
            subjectId,
            termId: context.term.id,
            isActive: true,
          },
          select: { id: true },
        });
        if (!isAssignedSubject) return false;
      }
      // Students can see all subjects in their section
      return true;
    }

    if (role === Role.FACULTY) {
      const context = await this.resolveFacultyContext(userId);

      // Faculty MUST have mapping for BOTH section and subject
      if (sectionId && subjectId) {
        const hasMapping = context.assignments.some(
          (a: any) => a.sectionId === sectionId && a.subjectId === subjectId
        );
        if (hasMapping) return true;

        // Fallback: a faculty member always has access to assignments they directly own,
        // even if the FacultyAssignment mapping lifecycle status changed after creation.
        if (resource.assignmentId) {
          const owned = await this.prisma.assignment.findFirst({
            where: { id: resource.assignmentId, facultyAssignment: { facultyId: context.profile.id } },
            select: { id: true },
          });
          if (owned) return true;
        }

        // Fallback via submission: for grading/reopen routes where the URL carries a submission UUID.
        const resolvedSubmissionId = resource.submissionId || resource.fallbackId;
        if (resolvedSubmissionId) {
          const submissionOwned = await this.prisma.assignmentSubmission.findFirst({
            where: {
              id: resolvedSubmissionId,
              assignment: { facultyAssignment: { facultyId: context.profile.id } },
            },
            select: { id: true },
          });
          if (submissionOwned) return true;
        }

        return false;
      }

      // Fallback for single-resource checks (less secure, but sometimes needed for general views)
      if (sectionId && !context.accessibleSections.includes(sectionId)) return false;
      if (subjectId && !context.accessibleSubjects.includes(subjectId)) return false;

      return true;
    }

    return false;
  }
}
