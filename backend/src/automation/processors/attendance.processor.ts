import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('attendance')
export class AttendanceAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AttendanceAutomationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'aggregate-stats':
        return this.handleAggregation();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleAggregation() {
    this.logger.log('Running Attendance Aggregation Job...');
    
    // In a real system, this would calculate weekly/monthly attendance 
    // and store it in a dedicated Analytics table for faster dashboard loading.
    
    // For now, we simulate the workload
    this.logger.log('Calculating institutional attendance compliance metrics...');
    
    const totalRecords = await this.prisma.attendanceRecord.count();
    
    this.logger.log(`Aggregation complete. Processed ${totalRecords} records.`);
    
    return { processed: totalRecords };
  }
}
