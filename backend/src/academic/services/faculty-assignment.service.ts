import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LifecycleStatus } from '@prisma/client';

@Injectable()
export class FacultyAssignmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assigns a faculty to a subject in a specific section for a term.
   */
  async assignFaculty(data: {
    facultyId: string;
    sectionId: string;
    subjectId: string;
    termId: string;
    yearId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Validate relationship: Subject and Section must belong to the same Term
      const [section, subject] = await Promise.all([
        tx.section.findUnique({ where: { id: data.sectionId } }),
        tx.subject.findUnique({ where: { id: data.subjectId } })
      ]);

      if (!section || !subject || section.termId !== data.termId || subject.termId !== data.termId) {
        throw new BadRequestException('Relational integrity check failed: Section and Subject must belong to the target Term');
      }

      // Create or reactivate assignment
      return tx.facultyAssignment.upsert({
        where: {
          facultyId_sectionId_subjectId_termId: {
            facultyId: data.facultyId,
            sectionId: data.sectionId,
            subjectId: data.subjectId,
            termId: data.termId,
          }
        },
        update: {
          status: LifecycleStatus.ACTIVE,
          isArchived: false,
          deletedAt: null
        },
        create: {
          ...data,
          status: LifecycleStatus.ACTIVE
        }
      });
    });
  }

  async revokeAssignment(id: string) {
    return this.prisma.facultyAssignment.update({
      where: { id },
      data: {
        status: LifecycleStatus.ARCHIVED,
        isArchived: true,
        deletedAt: new Date()
      }
    });
  }
}
