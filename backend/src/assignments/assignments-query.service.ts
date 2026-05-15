import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { StorageService } from '../common/storage/storage.service';
import { AssignmentStatus, GradingStatus, Role } from '@prisma/client';
import { PaginationQueryDto, createPaginatedResponse } from '../common/dto/pagination.dto';

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
  async getFacultyAssignments(facultyId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = query;
    const { sectionId, subjectId } = query as any;

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where: {
          facultyAssignment: { facultyId },
          status: { not: AssignmentStatus.ARCHIVED },
          ...(sectionId && { sectionId }),
          ...(subjectId && { subjectId }),
        },
        include: {
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.assignment.count({
        where: {
          facultyAssignment: { facultyId },
          status: { not: AssignmentStatus.ARCHIVED },
          ...(sectionId && { sectionId }),
          ...(subjectId && { subjectId }),
        },
      }),
    ]);

    return createPaginatedResponse(assignments, total, page || 1, limit || 20);
  }

  /**
   * Returns student list and their submission status for an assignment.
   */
  async getAssignmentSubmissions(
    assignmentId: string,
    query: PaginationQueryDto,
    requester: RequestUser,
  ) {
    await this.ensureAssignmentAccess(requester, { assignmentId });

    const { page, limit, skip } = query;

    const [submissions, total] = await Promise.all([
      this.prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          enrollment: {
            include: {
              student: {
                select: {
                  registrationNumber: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
        orderBy: { enrollment: { student: { registrationNumber: 'asc' } } },
        take: limit,
        skip,
      }),
      this.prisma.assignmentSubmission.count({ where: { assignmentId } }),
    ]);

    const mapped = submissions.map(s => ({
      ...s,
      versions: this.mapVersions(s.versions)
    }));

    return createPaginatedResponse(mapped, total, page || 1, limit || 20);
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

    return assignments.map(a => ({
      ...a,
      submissions: a.submissions.map(s => ({
        ...s,
        versions: this.mapVersions(s.versions)
      }))
    }));
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
