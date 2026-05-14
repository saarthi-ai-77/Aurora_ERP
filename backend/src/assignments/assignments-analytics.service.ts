import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { GradingStatus, Role } from '@prisma/client';

type RequestUser = {
  userId: string;
  role: Role;
};

@Injectable()
export class AssignmentsAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
  ) {}

  /**
   * Analytics for a specific assignment.
   */
  async getAssignmentStats(assignmentId: string, requester: RequestUser) {
    if (requester.role !== Role.ADMIN) {
      const hasAccess = await this.academicContext.validateOwnership(
        requester.userId,
        requester.role,
        { assignmentId },
      );

      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to access this assignment resource');
      }
    }

    const stats = await this.prisma.assignmentSubmission.groupBy({
      by: ['gradingStatus'],
      where: { assignmentId },
      _count: true,
    });

    const marks = await this.prisma.assignmentSubmission.aggregate({
      where: { 
        assignmentId,
        gradingStatus: GradingStatus.GRADED,
      },
      _avg: { finalMarks: true },
      _max: { finalMarks: true },
      _min: { finalMarks: true },
    });

    return {
      distribution: stats,
      performance: marks,
    };
  }

  /**
   * Faculty workload: How many submissions are pending review across all assignments.
   */
  async getFacultyGradingBacklog(facultyId: string) {
    return this.prisma.assignmentSubmission.count({
      where: {
        gradingStatus: GradingStatus.SUBMITTED,
        assignment: {
          facultyAssignment: {
            facultyId,
          },
        },
      },
    });
  }

  /**
   * Section-wide completion metrics.
   */
  async getSectionCompletionRates(sectionId: string) {
    // This could be more complex, but for now we'll sum up counts
    return this.prisma.assignment.findMany({
      where: { sectionId },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            submissions: {
              where: { 
                gradingStatus: { in: [GradingStatus.SUBMITTED, GradingStatus.GRADED] } 
              }
            }
          }
        }
      }
    });
  }
}
