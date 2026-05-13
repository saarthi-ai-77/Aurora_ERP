import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AssignmentsService } from './assignments.service';
import { AssignmentsQueryService } from './assignments-query.service';
import { AssignmentsAnalyticsService } from './assignments-analytics.service';
import { AuditInterceptor } from '../common/audit-log/audit.interceptor';
import { Audit } from '../common/audit-log/audit.decorator';
import { Role, AuditAction } from '@prisma/client';
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
} from './dto/assignments.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(
    private assignmentsService: AssignmentsService,
    private queryService: AssignmentsQueryService,
    private analyticsService: AssignmentsAnalyticsService,
  ) {}

  // ─── Faculty Endpoints ──────────────────────────────────────────────────

  @Post()
  @Roles(Role.FACULTY)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.ASSIGNMENT_CREATED)
  createAssignment(
    @GetUser('facultyProfileId') facultyId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.createAssignment(facultyId, dto);
  }

  @Patch(':id/publish')
  @Roles(Role.FACULTY)
  publishAssignment(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.publishAssignment(id);
  }

  @Get('faculty/me')
  @Roles(Role.FACULTY)
  getFacultyAssignments(
    @GetUser('facultyProfileId') facultyId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.queryService.getFacultyAssignments(facultyId, { limit, offset });
  }

  @Get(':id/submissions')
  @Roles(Role.FACULTY)
  getSubmissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.queryService.getAssignmentSubmissions(id, { limit, offset });
  }

  @Patch('submissions/:id/grade')
  @Roles(Role.FACULTY)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.MARKS_ASSIGNED)
  gradeSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('facultyProfileId') facultyId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(id, facultyId, dto);
  }

  @Post('submissions/:id/reopen')
  @Roles(Role.FACULTY)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.ASSIGNMENT_REOPENED)
  reopenSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('facultyProfileId') facultyId: string,
    @Body('reason') reason?: string,
  ) {
    return this.assignmentsService.reopenSubmission(id, facultyId, reason);
  }

  // ─── Student Endpoints ──────────────────────────────────────────────────

  @Get('student/me')
  @Roles(Role.STUDENT)
  getStudentAssignments(@GetUser('userId') userId: string) {
    return this.queryService.getStudentAssignments(userId);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  submitAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentsService.submitAssignment(id, userId, file);
  }

  // ─── Shared Endpoints ───────────────────────────────────────────────────

  @Get('submissions/:id/details')
  getSubmissionDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryService.getSubmissionDetails(id);
  }

  @Get(':id/stats')
  @Roles(Role.FACULTY, Role.ADMIN)
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getAssignmentStats(id);
  }
}
