import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AcademicStatus } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async enrollStudent(studentId: string, sectionId: string, termId: string) {
    return this.prisma.$transaction(async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.termId !== termId) {
        throw new BadRequestException('Invalid section or term mapping');
      }

      await tx.studentEnrollment.updateMany({
        where: { studentId, isCurrent: true },
        data: { isCurrent: false },
      });

      const enrollment = await tx.studentEnrollment.create({
        data: {
          studentId,
          sectionId,
          termId,
          status: AcademicStatus.ACTIVE,
          isCurrent: true,
        },
      });

      await tx.studentProfile.update({
        where: { id: studentId },
        data: { sectionId },
      });

      return enrollment;
    });
  }

  async addStudentsToSection(sectionId: string, studentIds: string[], termId: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, academicStatus: true, firstName: true, lastName: true },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException('One or more student IDs are invalid');
    }

    const inactive = students.filter((s) => s.academicStatus !== AcademicStatus.ACTIVE);
    if (inactive.length > 0) {
      throw new BadRequestException(
        `${inactive.length} student(s) are inactive and cannot be enrolled`,
      );
    }

    let enrolled = 0;
    for (const studentId of studentIds) {
      await this.enrollStudent(studentId, sectionId, termId);
      enrolled++;
    }

    return { enrolled };
  }

  async removeStudentFromSection(sectionId: string, studentId: string) {
    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: { studentId, sectionId, isCurrent: true },
    });

    if (!enrollment) {
      throw new NotFoundException('No active enrollment found for this student in this section');
    }

    return this.prisma.studentEnrollment.update({
      where: { id: enrollment.id },
      data: {
        isCurrent: false,
        status: AcademicStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });
  }

  async withdrawStudent(studentId: string) {
    return this.prisma.studentEnrollment.updateMany({
      where: { studentId, isCurrent: true },
      data: {
        isCurrent: false,
        status: AcademicStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });
  }
}
