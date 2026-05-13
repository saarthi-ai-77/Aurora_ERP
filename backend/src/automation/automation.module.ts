import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AssignmentAutomationProcessor } from './processors/assignment.processor';
import { AttendanceAutomationProcessor } from './processors/attendance.processor';
import { NoticeAutomationProcessor } from './processors/notice.processor';
import { AutomationSchedulerService } from './automation-scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'assignments' },
      { name: 'attendance' },
      { name: 'notices' },
    ),
  ],
  providers: [
    AssignmentAutomationProcessor,
    AttendanceAutomationProcessor,
    NoticeAutomationProcessor,
    AutomationSchedulerService,
  ],
  exports: [AutomationSchedulerService],
})
export class AutomationModule {}
