import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryService } from './attendance-query.service';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { AttendanceController } from './attendance.controller';

@Module({
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceQueryService,
    AttendanceAnalyticsService,
  ],
  exports: [
    AttendanceService,
    AttendanceQueryService,
    AttendanceAnalyticsService,
  ],
})
export class AttendanceModule {}
