import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LifecycleStatus, Prisma } from '@prisma/client';
import { PaginationQueryDto, createPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AcademicEngineService {
  constructor(private prisma: PrismaService) {}

  async getAcademicTree() {
    const [departments, courses, years, terms, sections, subjects] = await Promise.all([
      this.prisma.department.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.course.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.year.findMany({
        orderBy: [{ courseId: 'asc' }, { number: 'asc' }],
      }),
      this.prisma.term.findMany({
        orderBy: [{ yearId: 'asc' }, { number: 'asc' }],
      }),
      this.prisma.section.findMany({
        where: { isArchived: false },
        orderBy: [{ termId: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { studentProfiles: true } },
        },
      }),
      this.prisma.subject.findMany({
        where: { isArchived: false },
        orderBy: [{ termId: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const sectionsByTerm = new Map<string, any[]>();
    for (const section of sections) {
      const bucket = sectionsByTerm.get(section.termId) ?? [];
      bucket.push(section);
      sectionsByTerm.set(section.termId, bucket);
    }

    const subjectsByTerm = new Map<string, any[]>();
    for (const subject of subjects) {
      const bucket = subjectsByTerm.get(subject.termId) ?? [];
      bucket.push(subject);
      subjectsByTerm.set(subject.termId, bucket);
    }

    const termsByYear = new Map<string, any[]>();
    for (const term of terms) {
      const bucket = termsByYear.get(term.yearId) ?? [];
      bucket.push({
        ...term,
        sections: sectionsByTerm.get(term.id) ?? [],
        subjects: subjectsByTerm.get(term.id) ?? [],
      });
      termsByYear.set(term.yearId, bucket);
    }

    const yearsByCourse = new Map<string, any[]>();
    for (const year of years) {
      const bucket = yearsByCourse.get(year.courseId) ?? [];
      bucket.push({
        ...year,
        terms: termsByYear.get(year.id) ?? [],
      });
      yearsByCourse.set(year.courseId, bucket);
    }

    const coursesByDepartment = new Map<string, any[]>();
    for (const course of courses) {
      const bucket = coursesByDepartment.get(course.departmentId) ?? [];
      bucket.push({
        ...course,
        years: yearsByCourse.get(course.id) ?? [],
      });
      coursesByDepartment.set(course.departmentId, bucket);
    }

    return departments.map((department) => ({
      ...department,
      courses: coursesByDepartment.get(department.id) ?? [],
    }));
  }

  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCourses(departmentId: string) {
    return this.prisma.course.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
  }

  async getYears(courseId: string) {
    return this.prisma.year.findMany({
      where: { courseId },
      orderBy: { number: 'asc' },
    });
  }

  async getTerms(yearId: string) {
    return this.prisma.term.findMany({
      where: { yearId },
      orderBy: { number: 'asc' },
    });
  }

  async getSections(termId: string) {
    return this.prisma.section.findMany({
      where: { termId, isArchived: false },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { studentProfiles: true } }
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
          _count: { select: { studentProfiles: true } },
          term: {
            select: {
              id: true,
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
        facultyAssignments: {
          where: { isArchived: false },
          include: {
            faculty: { select: { id: true, firstName: true, lastName: true, staffId: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
        sectionSubjects: {
          where: { isActive: true },
          include: {
            subject: { select: { id: true, name: true, code: true, credits: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async getSectionStudents(sectionId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = query;

    const [students, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where: { sectionId },
        take: limit,
        skip,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          registrationNumber: true,
          academicStatus: true,
        },
      }),
      this.prisma.studentProfile.count({ where: { sectionId } }),
    ]);

    return createPaginatedResponse(students, total, page || 1, limit || 20);
  }

  // ─── Section-Subject Mapping ──────────────────────────────────────────────────

  async assignSubjectToSection(sectionId: string, subjectId: string) {
    const [section, subject] = await Promise.all([
      this.prisma.section.findUnique({ where: { id: sectionId } }),
      this.prisma.subject.findUnique({ where: { id: subjectId } }),
    ]);

    if (!section) throw new NotFoundException('Section not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (subject.isArchived) throw new BadRequestException('Cannot assign an archived subject');
    if (section.termId !== subject.termId) {
      throw new BadRequestException('Subject must belong to the same term as the section');
    }

    try {
      return await this.prisma.sectionSubject.create({
        data: {
          sectionId,
          subjectId,
          termId: section.termId,
          isActive: true,
        },
        include: {
          subject: { select: { id: true, name: true, code: true, credits: true } },
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Subject is already assigned to this section');
      }
      throw e;
    }
  }

  async removeSubjectFromSection(sectionId: string, subjectId: string) {
    const mapping = await this.prisma.sectionSubject.findFirst({
      where: { sectionId, subjectId },
    });

    if (!mapping) {
      throw new NotFoundException('Subject is not assigned to this section');
    }

    return this.prisma.sectionSubject.delete({ where: { id: mapping.id } });
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
