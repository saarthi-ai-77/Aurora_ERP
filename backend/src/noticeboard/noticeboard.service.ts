import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { Role, NoticeStatus } from '@prisma/client';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';
import { PaginationQueryDto, createPaginatedResponse } from '../common/dto/pagination.dto';

const POSTED_BY_SELECT = {
  select: {
    email: true,
    facultyProfile: { select: { firstName: true, lastName: true } },
    adminProfile: { select: { firstName: true, lastName: true } },
  },
};

@Injectable()
export class NoticeboardService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
  ) {}

  async getMyNotices(userId: string, role: Role) {
    const where: any = {
      status: NoticeStatus.PUBLISHED,
      OR: [],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      ],
    };

    where.OR = [
      { targetRoles: { has: role } },
      { targetRoles: { isEmpty: true } },
    ];

    if (role === Role.STUDENT) {
      const context = await this.academicContext.resolveStudentContext(userId);
      const deptName = context.department.name;
      const sectionId = context.section.id;

      where.OR.push(
        { targetDepartments: { has: deptName } },
        { targetSections: { has: sectionId } },
      );
    }

    return this.prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      include: { postedBy: POSTED_BY_SELECT },
    });
  }

  async createNotice(userId: string, dto: CreateNoticeDto) {
    const status = dto.status || NoticeStatus.DRAFT;
    const publishedAt = status === NoticeStatus.PUBLISHED ? new Date() : null;

    return this.prisma.notice.create({
      data: {
        ...dto,
        postedById: userId,
        status,
        publishedAt,
      } as any,
    });
  }

  async updateNotice(id: string, userId: string, dto: UpdateNoticeDto) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found');
    if (notice.postedById !== userId) {
      throw new ForbiddenException('You do not own this notice');
    }
    if ((notice as any).status === NoticeStatus.ARCHIVED) {
      throw new ForbiddenException('Archived notices cannot be edited');
    }

    return this.prisma.notice.update({
      where: { id },
      data: { ...dto } as any,
    });
  }

  async publishNotice(id: string, userId: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found');
    if (notice.postedById !== userId) {
      throw new ForbiddenException('You do not own this notice');
    }

    return this.prisma.notice.update({
      where: { id },
      data: {
        status: NoticeStatus.PUBLISHED,
        publishedAt: new Date(),
      } as any,
    });
  }

  async archiveNotice(id: string, userId: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found');
    if (notice.postedById !== userId) {
      throw new ForbiddenException('You do not own this notice');
    }

    return this.prisma.notice.update({
      where: { id },
      data: {
        status: NoticeStatus.ARCHIVED,
        archivedAt: new Date(),
      } as any,
    });
  }

  async getAllNotices(query: PaginationQueryDto) {
    const { page, limit, skip } = query;

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where: { status: { not: NoticeStatus.ARCHIVED } },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { postedBy: POSTED_BY_SELECT },
      }),
      this.prisma.notice.count({ where: { status: { not: NoticeStatus.ARCHIVED } } }),
    ]);

    return createPaginatedResponse(notices, total, page || 1, limit || 20);
  }
}
