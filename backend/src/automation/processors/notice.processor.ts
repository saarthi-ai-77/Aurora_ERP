import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { NoticeStatus } from '@prisma/client';

@Processor('notices')
export class NoticeAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(NoticeAutomationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-expiry':
        return this.handleNoticeExpiry();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleNoticeExpiry() {
    this.logger.log('Running Notice Expiry Check...');

    const now = new Date();

    const expiredNotices = await this.prisma.notice.findMany({
      where: {
        status: NoticeStatus.PUBLISHED,
        expiresAt: { lt: now },
      } as any,
      select: { id: true },
    });

    if (expiredNotices.length === 0) {
      this.logger.log('No expired notices detected.');
      return;
    }

    this.logger.log(`Found ${expiredNotices.length} expired notices. Archiving...`);

    const updated = await this.prisma.notice.updateMany({
      where: {
        id: { in: expiredNotices.map((n: any) => n.id) },
      },
      data: {
        status: NoticeStatus.ARCHIVED,
        archivedAt: now,
      } as any,
    });

    this.logger.log(`Successfully archived ${updated.count} notices.`);
    return { archived: updated.count };
  }
}
