import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { AssignmentStatus, GradingStatus, Role } from '@prisma/client';

@Injectable()
export class AssignmentsQueryService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
  ) {}

  /**
   * Returns assignments for a faculty based on their assignments.
   */
  async getFacultyAssignments(facultyId: string, params: { limit?: number; offset?: number } = {}) {
    return this.prisma.assignment.findMany({
      where: {
        facultyAssignment: {
          facultyId,
        },
      },
      include: {
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 20,
      skip: params.offset || 0,
    });
  }

  /**
   * Returns student list and their submission status for an assignment.
   */
  async getAssignmentSubmissions(assignmentId: string, params: { limit?: number; offset?: number } = {}) {
    return this.prisma.assignmentSubmission.findMany({
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
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  /**
   * Returns assignments for the current student.
   */
  async getStudentAssignments(userId: string) {
    const context = await this.academicContext.resolveStudentContext(userId);
    
    return this.prisma.assignment.findMany({
      where: {
        sectionId: context.enrollment.sectionId,
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
  }

  /**
   * Returns a detailed submission with all version history.
   */
  async getSubmissionDetails(submissionId: string) {
    return this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            subject: true,
          }
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
  }
}
