import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentsQueryService } from './assignments-query.service';
import { AssignmentsAnalyticsService } from './assignments-analytics.service';
import { AcademicModule } from '../academic/academic.module';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [AcademicModule, StorageModule],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    AssignmentsQueryService,
    AssignmentsAnalyticsService,
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
