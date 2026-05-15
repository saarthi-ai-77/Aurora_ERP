import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { StorageService } from '../common/storage/storage.service';
import { AssignmentStatus, GradingStatus, Role } from '@prisma/client';
import { PaginationQueryDto, createPaginatedResponse } from '../common/dto/pagination.dto';
import { FacultyAssignmentsQueryDto } from './dto/assignments.dto';

import { AssignmentsService } from './assignments.service';

type RequestUser = {
  userId: string;
  role: Role;
};

@Injectable()
export class AssignmentsQueryService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
    private storage: StorageService,
    private assignmentsService: AssignmentsService,
  ) {}

  private mapVersions(versions: any[]) {
    return versions.map(v => ({
      ...v,
      storageKey: v.storageKey && v.storageKey !== 'marks-only' 
        ? this.storage.getFileUrl(v.storageKey) 
        : v.storageKey
    }));
  }

  private async ensureAssignmentAccess(
    requester: RequestUser,
    resource: { assignmentId?: string; submissionId?: string },
  ) {
    if (requester.role === Role.ADMIN) return;

    const hasAccess = await this.academicContext.validateOwnership(
      requester.userId,
      requester.role,
      resource,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this assignment resource');
    }
  }

  /**
   * Returns assignments for a faculty based on their assignments.
   */
  async getFacultyAssignments(facultyId: string, query: FacultyAssignmentsQueryDto) {
    const { page, limit, skip } = query;
    const { sectionId, subjectId } = query as any;

    // AUTOMATIC SYNC: Ensure all 11 drafts exist every time this section is viewed
    if (sectionId && subjectId) {
      await this.assignmentsService.syncDraftsForSection(facultyId, sectionId, subjectId);
    }

    const where = {
      facultyAssignment: { facultyId },
      status: { not: AssignmentStatus.ARCHIVED },
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
    };

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: {
          section: {
            include: {
              _count: {
                select: { studentEnrollments: true }
              }
            }
          },
          subject: { select: { name: true, code: true } },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.assignment.count({ where }),
    ]);

    // Calculate missed counts for each assignment
    const enhancedAssignments = assignments.map(a => {
      const totalStudents = a.section._count.studentEnrollments;
      const submissionCount = a._count.submissions;
      return {
        ...a,
        totalStudents,
        submissionCount,
        missedCount: Math.max(0, totalStudents - submissionCount),
        isPastDeadline: new Date() > new Date(a.dueDate)
      };
    });

    return createPaginatedResponse(enhancedAssignments, total, page, limit);
  }

  /**
   * Returns student list and their submission status for an assignment.
   * Every student in the section is returned, even if they haven't submitted.
   */
  async getAssignmentSubmissions(assignmentId: string, requester: RequestUser) {
    await this.ensureAssignmentAccess(requester, { assignmentId });

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { sectionId: true, termId: true }
    });

    if (!assignment) return { data: [] };

    // 1. Fetch ALL students enrolled in this section
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        sectionId: assignment.sectionId,
        termId: assignment.termId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            registrationNumber: true,
          }
        }
      },
      orderBy: { student: { registrationNumber: 'asc' } }
    });

    // 2. Fetch existing submissions
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        }
      }
    });

    // 3. Merge: Every student gets a row
    const fullList = enrollments.map(enrollment => {
      const submission = submissions.find(s => s.studentEnrollmentId === enrollment.id);
      
      return {
        id: submission?.id || `pending-${enrollment.id}`,
        enrollment,
        gradingStatus: submission?.gradingStatus || 'NOT_SUBMITTED',
        finalMarks: submission?.finalMarks || null,
        submittedAt: submission?.submittedAt || null,
        isLateSubmission: submission?.isLateSubmission || false,
        versions: submission ? this.mapVersions(submission.versions) : [],
        latestVersionId: submission?.latestVersionId || null,
        hasSubmission: !!submission
      };
    });

    return { data: fullList };
  }

  /**
   * Extends the deadline for a specific assignment.
   */
  async extendDeadline(assignmentId: string, newDueDate: Date, requester: RequestUser) {
    await this.ensureAssignmentAccess(requester, { assignmentId });
    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { dueDate: newDueDate }
    });
  }

  /**
   * Returns assignments for the current student.
   */
  async getStudentAssignments(userId: string) {
    const context = await this.academicContext.resolveStudentContext(userId);
    
    const assignments = await this.prisma.assignment.findMany({
      where: {
        sectionId: context.enrollment.sectionId,
        termId: context.enrollment.termId,
        status: AssignmentStatus.PUBLISHED,
      },
      include: {
        subject: { select: { name: true, code: true } },
        submissions: {
          where: { studentEnrollmentId: context.enrollment.id },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return assignments.map(a => {
      const submission = a.submissions[0];
      const isPastDeadline = new Date() > new Date(a.dueDate);
      
      let displayStatus = 'ONGOING';
      if (submission) {
        displayStatus = 'SUBMITTED';
      } else if (isPastDeadline) {
        displayStatus = 'MISSED';
      }

      return {
        ...a,
        displayStatus,
        isPastDeadline,
        submissions: a.submissions.map(s => ({
          ...s,
          versions: this.mapVersions(s.versions)
        }))
      };
    });
  }

  /**
   * Returns a detailed submission with all version history.
   */
  async getSubmissionDetails(submissionId: string, requester: RequestUser) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            subject: true,
          }
        },
        enrollment: {
          include: {
            student: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                registrationNumber: true,
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        audits: {
          include: {
            editedBy: {
              select: {
                role: true,
                facultyProfile: { select: { firstName: true, lastName: true } },
              }
            }
          },
          orderBy: { editedAt: 'desc' },
        }
      }
    });

    if (!submission) return null;

    if (requester.role === Role.STUDENT) {
      const isOwner = submission.enrollment.student.userId === requester.userId;
      if (!isOwner) {
        throw new ForbiddenException('You can only view your own submission details');
      }
    } else {
      await this.ensureAssignmentAccess(requester, { submissionId });
    }

    return {
      ...submission,
      versions: this.mapVersions(submission.versions)
    };
  }
}
