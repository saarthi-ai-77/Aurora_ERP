import { Module, Global } from '@nestjs/common';
import { AcademicContextService } from './academic-context.service';
import { AcademicController } from './academic.controller';
import { AcademicEngineService } from './services/academic-engine.service';
import { EnrollmentService } from './services/enrollment.service';
import { FacultyAssignmentService } from './services/faculty-assignment.service';

@Global()
@Module({
  controllers: [AcademicController],
  providers: [
    AcademicContextService, 
    AcademicEngineService,
    EnrollmentService,
    FacultyAssignmentService
  ],
  exports: [
    AcademicContextService, 
    AcademicEngineService,
    EnrollmentService,
    FacultyAssignmentService
  ],
})
export class AcademicModule {}
