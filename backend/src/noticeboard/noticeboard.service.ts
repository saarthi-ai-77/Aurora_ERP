import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { Role, NoticeStatus } from '@prisma/client';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';

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
      OR: [
        { targetRoles: { has: role } },
        { targetRoles: { isEmpty: true } },
      ],
    };

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
    return this.prisma.notice.create({
      data: {
        ...dto,
        postedById: userId,
        status: NoticeStatus.DRAFT,
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

  async getAllNotices() {
    return this.prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { postedBy: POSTED_BY_SELECT },
    });
  }
}
