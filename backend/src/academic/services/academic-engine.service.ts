import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LifecycleStatus, Prisma } from '@prisma/client';

@Injectable()
export class AcademicEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the entire academic hierarchy for admin management.
   */
  async getAcademicTree() {
    return this.prisma.department.findMany({
      include: {
        courses: {
          include: {
            years: {
              include: {
                terms: {
                  include: {
                    sections: {
                      where: { isArchived: false },
                      include: {
                        _count: { select: { studentProfiles: true } }
                      }
                    },
                    subjects: {
                      where: { isArchived: false }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Transactional session rotation.
   * Ensures only one active term per year and one active year.
   */
  async rotateActiveSession(yearId: string, termId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Deactivate all years
      await tx.year.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      });

      // 2. Activate target year
      const year = await tx.year.update({
        where: { id: yearId },
        data: { isCurrent: true }
      });

      // 3. Deactivate all terms in this year
      await tx.term.updateMany({
        where: { yearId, isCurrent: true },
        data: { isCurrent: false }
      });

      // 4. Activate target term
      const term = await tx.term.update({
        where: { id: termId },
        data: { isCurrent: true }
      });

      return { year, term };
    });
  }

  /**
   * Safe archival of academic entities.
   */
  async archiveSection(id: string) {
    return this.prisma.section.update({
      where: { id },
      data: { 
        status: LifecycleStatus.ARCHIVED,
        isArchived: true,
        deletedAt: new Date()
      }
    });
  }
}
