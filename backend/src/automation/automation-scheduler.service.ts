import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AutomationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AutomationSchedulerService.name);

  constructor(
    @InjectQueue('assignments') private assignmentQueue: Queue,
    @InjectQueue('attendance') private attendanceQueue: Queue,
    @InjectQueue('notices') private noticeQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Background Job Schedulers...');
    await this.scheduleAssignmentCheck();
    await this.scheduleAttendanceAggregation();
    await this.scheduleNoticeExpiryCheck();
  }

  private async scheduleAssignmentCheck() {
    // Remove before re-adding to prevent duplicate repeatable jobs on restart
    await this.assignmentQueue.removeRepeatable('detect-overdue', {
      pattern: '0 * * * *',
    });
    await this.assignmentQueue.add(
      'detect-overdue',
      {},
      { repeat: { pattern: '0 * * * *' }, jobId: 'assignment-overdue-cron' },
    );
    this.logger.log('Scheduled: Assignment Overdue Detector (Hourly)');
  }

  private async scheduleAttendanceAggregation() {
    await this.attendanceQueue.removeRepeatable('aggregate-stats', {
      pattern: '0 0 * * *',
    });
    await this.attendanceQueue.add(
      'aggregate-stats',
      {},
      { repeat: { pattern: '0 0 * * *' }, jobId: 'attendance-aggregator-cron' },
    );
    this.logger.log('Scheduled: Attendance Aggregator (Daily)');
  }

  private async scheduleNoticeExpiryCheck() {
    await this.noticeQueue.removeRepeatable('check-expiry', {
      pattern: '0 1 * * *',
    });
    await this.noticeQueue.add(
      'check-expiry',
      {},
      { repeat: { pattern: '0 1 * * *' }, jobId: 'notice-expiry-cron' },
    );
    this.logger.log('Scheduled: Notice Expiry Check (Daily)');
  }
}
