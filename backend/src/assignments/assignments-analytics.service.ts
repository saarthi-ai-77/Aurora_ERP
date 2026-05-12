import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradingStatus } from '@prisma/client';

@Injectable()
export class AssignmentsAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Analytics for a specific assignment.
   */
  async getAssignmentStats(assignmentId: string) {
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
