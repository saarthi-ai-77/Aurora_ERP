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
  Req,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AssignmentsService } from './assignments.service';
import { AssignmentsQueryService } from './assignments-query.service';
import { AssignmentsAnalyticsService } from './assignments-analytics.service';
import { AcademicAccessGuard } from '../common/guards/academic-access.guard';
import { AuditInterceptor } from '../common/audit-log/audit.interceptor';
import { Audit } from '../common/audit-log/audit.decorator';
import { Role, AuditAction } from '@prisma/client';
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
} from './dto/assignments.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

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

  @Get('templates')
  getTemplates() {
    return this.assignmentsService.getTemplates();
  }

  @Patch(':id/publish')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  publishAssignment(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.publishAssignment(id, req.user);
  }

  @Patch(':id/archive')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  archiveAssignment(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.archiveAssignment(id, req.user);
  }

  @Delete(':id')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  deleteAssignment(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.deleteAssignment(id, req.user);
  }

  @Get('faculty/me')
  @Roles(Role.FACULTY)
  getFacultyAssignments(
    @GetUser('facultyProfileId') facultyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.queryService.getFacultyAssignments(facultyId, query);
  }

  @Get(':id/submissions')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  getSubmissions(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.queryService.getAssignmentSubmissions(id, query, req.user);
  }

  @Patch('submissions/:id/grade')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.MARKS_ASSIGNED)
  gradeSubmission(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(id, req.user, dto);
  }

  @Post('submissions/:id/reopen')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.ASSIGNMENT_REOPENED)
  reopenSubmission(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.assignmentsService.reopenSubmission(id, req.user, reason);
  }

  // ─── Student Endpoints ──────────────────────────────────────────────────

  @Get('student/me')
  @Roles(Role.STUDENT)
  getStudentAssignments(@GetUser('userId') userId: string) {
    return this.queryService.getStudentAssignments(userId);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 3 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  submitAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentsService.submitAssignment(id, userId, file);
  }

  // ─── Shared Endpoints ───────────────────────────────────────────────────

  @Get('submissions/:id/details')
  @Roles(Role.FACULTY, Role.ADMIN, Role.STUDENT)
  @UseGuards(AcademicAccessGuard)
  getSubmissionDetails(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.queryService.getSubmissionDetails(id, req.user);
  }

  @Get(':id/stats')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  getStats(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getAssignmentStats(id, req.user);
  }
}
