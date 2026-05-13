import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LifecycleStatus, Prisma } from '@prisma/client';

@Injectable()
export class AcademicEngineService {
  constructor(private prisma: PrismaService) {}

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

  async getStructure() {
    const [departments, sections] = await Promise.all([
      this.prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.section.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          name: true,
          term: {
            select: {
              name: true,
              year: {
                select: {
                  course: {
                    select: { name: true, department: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { departments, sections };
  }

  // ─── E1: Section Management ──────────────────────────────────────────────────

  async createSection(dto: { name: string; termId: string }) {
    try {
      return await this.prisma.section.create({
        data: {
          name: dto.name,
          termId: dto.termId,
          status: LifecycleStatus.ACTIVE,
        },
        include: {
          term: {
            include: {
              year: { include: { course: { include: { department: true } } } },
            },
          },
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException(`Section "${dto.name}" already exists in this term`);
      }
      throw e;
    }
  }

  async getSectionDetail(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        term: {
          include: {
            year: { include: { course: { include: { department: true } } } },
          },
        },
        studentProfiles: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
            academicStatus: true,
          },
          orderBy: { lastName: 'asc' },
        },
        facultyAssignments: {
          where: { isArchived: false },
          include: {
            faculty: { select: { id: true, firstName: true, lastName: true, staffId: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  // ─── E2: Subject Management ──────────────────────────────────────────────────

  async createSubject(dto: { name: string; code: string; termId: string; credits?: number }) {
    try {
      return await this.prisma.subject.create({
        data: {
          name: dto.name,
          code: dto.code.toUpperCase(),
          termId: dto.termId,
          credits: dto.credits ?? 3,
          status: LifecycleStatus.ACTIVE,
        },
        include: {
          term: {
            include: { year: { include: { course: true } } },
          },
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException(`Subject code "${dto.code}" already exists in this term`);
      }
      throw e;
    }
  }

  async updateSubject(id: string, dto: { name?: string; credits?: number }) {
    try {
      return await this.prisma.subject.update({
        where: { id },
        data: dto,
      });
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('Subject not found');
      throw e;
    }
  }

  async archiveSubject(id: string) {
    try {
      return await this.prisma.subject.update({
        where: { id },
        data: {
          status: LifecycleStatus.ARCHIVED,
          isArchived: true,
          deletedAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('Subject not found');
      throw e;
    }
  }

  async getTermSubjects(termId: string) {
    return this.prisma.subject.findMany({
      where: { termId, isArchived: false },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Existing lifecycle methods ───────────────────────────────────────────────

  async rotateActiveSession(yearId: string, termId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.year.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      const year = await tx.year.update({ where: { id: yearId }, data: { isCurrent: true } });
      await tx.term.updateMany({ where: { yearId, isCurrent: true }, data: { isCurrent: false } });
      const term = await tx.term.update({ where: { id: termId }, data: { isCurrent: true } });
      return { year, term };
    });
  }

  async archiveSection(id: string) {
    return this.prisma.section.update({
      where: { id },
      data: {
        status: LifecycleStatus.ARCHIVED,
        isArchived: true,
        deletedAt: new Date(),
      },
    });
  }
}
