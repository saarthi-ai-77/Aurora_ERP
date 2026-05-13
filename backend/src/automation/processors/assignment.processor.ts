import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { AssignmentStatus } from '@prisma/client';

@Processor('assignments')
export class AssignmentAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AssignmentAutomationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'detect-overdue':
        return this.handleOverdueDetection();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleOverdueDetection() {
    this.logger.log('Running Overdue Assignment Detection...');
    
    const now = new Date();
    
    // Find published assignments past due date
    const overdueAssignments = await this.prisma.assignment.findMany({
      where: {
        status: AssignmentStatus.PUBLISHED,
        dueDate: { lt: now },
      },
    });

    if (overdueAssignments.length === 0) {
      this.logger.log('No new overdue assignments detected.');
      return;
    }

    this.logger.log(`Found ${overdueAssignments.length} overdue assignments. Updating status to CLOSED...`);

    const updated = await this.prisma.assignment.updateMany({
      where: {
        id: { in: overdueAssignments.map(a => a.id) },
      },
      data: {
        status: AssignmentStatus.CLOSED,
      },
    });

    this.logger.log(`Successfully closed ${updated.count} assignments.`);
    
    // Future: Trigger notifications for students who haven't submitted
    return { updated: updated.count };
  }
}
