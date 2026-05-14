import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LifecycleStatus } from '@prisma/client';

@Injectable()
export class FacultyAssignmentService {
  constructor(private prisma: PrismaService) {}

  async assignFaculty(data: {
    facultyId: string;
    sectionId: string;
    subjectId: string;
    termId: string;
    yearId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const [section, subject] = await Promise.all([
        tx.section.findUnique({ where: { id: data.sectionId } }),
        tx.subject.findUnique({ where: { id: data.subjectId } }),
      ]);

      if (!section || !subject || section.termId !== data.termId || subject.termId !== data.termId) {
        throw new BadRequestException(
          'Relational integrity check failed: Section and Subject must belong to the target Term',
        );
      }

      const term = await tx.term.findUnique({
        where: { id: data.termId },
        select: { yearId: true },
      });

      if (!term || term.yearId !== data.yearId) {
        throw new BadRequestException('Relational integrity check failed: Term and Year do not match');
      }

      const sectionSubject = await tx.sectionSubject.findFirst({
        where: {
          sectionId: data.sectionId,
          subjectId: data.subjectId,
          termId: data.termId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!sectionSubject) {
        throw new BadRequestException(
          'Relational integrity check failed: Subject must be assigned to the section before faculty mapping',
        );
      }

      // Enforce one faculty per (section, subject, term)
      const existing = await tx.facultyAssignment.findFirst({
        where: {
          sectionId: data.sectionId,
          subjectId: data.subjectId,
          termId: data.termId,
          isArchived: false,
        },
        include: { faculty: { select: { firstName: true, lastName: true } } },
      });

      if (existing) {
        throw new BadRequestException(
          `This section-subject slot is already assigned to ${existing.faculty.firstName} ${existing.faculty.lastName}`,
        );
      }

      return tx.facultyAssignment.upsert({
        where: {
          facultyId_sectionId_subjectId_termId: {
            facultyId: data.facultyId,
            sectionId: data.sectionId,
            subjectId: data.subjectId,
            termId: data.termId,
          },
        },
        update: {
          status: LifecycleStatus.ACTIVE,
          isArchived: false,
          deletedAt: null,
        },
        create: {
          ...data,
          status: LifecycleStatus.ACTIVE,
        },
        include: {
          faculty: { select: { firstName: true, lastName: true, staffId: true } },
          section: { select: { name: true } },
          subject: { select: { name: true, code: true } },
        },
      });
    });
  }

  async revokeAssignment(id: string) {
    try {
      return await this.prisma.facultyAssignment.update({
        where: { id },
        data: {
          status: LifecycleStatus.ARCHIVED,
          isArchived: true,
          deletedAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('Faculty assignment not found');
      throw e;
    }
  }

  async getFacultyAssignments(facultyId: string) {
    return this.prisma.facultyAssignment.findMany({
      where: { facultyId, isArchived: false },
      include: {
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        term: { select: { id: true, name: true } },
        year: { select: { id: true, number: true, academicYear: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllActiveAssignments() {
    return this.prisma.facultyAssignment.findMany({
      where: { isArchived: false },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, staffId: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        term: { select: { id: true, name: true } },
        year: { select: { id: true, number: true, academicYear: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
