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
   */
  async validateOwnership(userId: string, role: Role, resource: { sectionId?: string; subjectId?: string }) {
    if (role === Role.ADMIN) return true;

    if (role === Role.STUDENT) {
      const context = await this.resolveStudentContext(userId);
      if (resource.sectionId && context.section.id !== resource.sectionId) return false;
      if (resource.subjectId && !context.subjects.some((s: any) => s.id === resource.subjectId)) return false;
      return true;
    }

    if (role === Role.FACULTY) {
      const context = await this.resolveFacultyContext(userId);
      if (resource.sectionId && !context.accessibleSections.includes(resource.sectionId)) return false;
      if (resource.subjectId && !context.accessibleSubjects.includes(resource.subjectId)) return false;
      return true;
    }

    return false;
  }
}
