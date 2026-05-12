import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AcademicStatus } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enrolls a student into a section for a specific term.
   * Transactional: Updates StudentProfile and creates StudentEnrollment.
   */
  async enrollStudent(studentId: string, sectionId: string, termId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify section exists and belongs to the term
      const section = await tx.section.findUnique({
        where: { id: sectionId },
      });
      if (!section || section.termId !== termId) {
        throw new BadRequestException('Invalid section or term mapping');
      }

      // 2. Deactivate current enrollments for this student
      await tx.studentEnrollment.updateMany({
        where: { studentId, isCurrent: true },
        data: { isCurrent: false }
      });

      // 3. Create new enrollment
      const enrollment = await tx.studentEnrollment.create({
        data: {
          studentId,
          sectionId,
          termId,
          status: AcademicStatus.ACTIVE,
          isCurrent: true,
        },
      });

      // 4. Update current pointer on StudentProfile
      await tx.studentProfile.update({
        where: { id: studentId },
        data: { sectionId }
      });

      return enrollment;
    });
  }

  async withdrawStudent(studentId: string) {
    return this.prisma.studentEnrollment.updateMany({
      where: { studentId, isCurrent: true },
      data: { 
        isCurrent: false, 
        status: AcademicStatus.WITHDRAWN,
        withdrawnAt: new Date()
      }
    });
  }
}
