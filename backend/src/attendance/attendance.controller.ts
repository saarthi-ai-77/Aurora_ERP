import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryService } from './attendance-query.service';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AcademicAccessGuard } from '../common/guards/academic-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../common/audit-log/audit.interceptor';
import { Audit } from '../common/audit-log/audit.decorator';
import { Role, AuditAction } from '@prisma/client';
import { AcademicContextService } from '../academic/academic-context.service';
import {
  CreateAttendanceSessionDto,
  MarkAttendanceDto,
  UpdateAttendanceRecordDto,
} from './dto/attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private queryService: AttendanceQueryService,
    private analyticsService: AttendanceAnalyticsService,
    private academicContext: AcademicContextService,
  ) {}

  // ─── Faculty Endpoints ──────────────────────────────────────────────────────

  @Post('sessions')
  @Roles(Role.FACULTY)
  @UseGuards(AcademicAccessGuard)
  createSession(@Req() req: any, @Body() dto: CreateAttendanceSessionDto) {
    return this.attendanceService.createSession(req.user.facultyProfileId, dto);
  }

  @Post('sessions/:id/records')
  @Roles(Role.FACULTY)
  @UseGuards(AcademicAccessGuard)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.ATTENDANCE_MARKED)
  markAttendance(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(sessionId, dto.records);
  }

  @Patch('records/:id')
  @Roles(Role.FACULTY)
  @UseGuards(AcademicAccessGuard)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.ATTENDANCE_EDITED)
  updateRecord(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) recordId: string,
    @Body() dto: UpdateAttendanceRecordDto,
  ) {
    return this.attendanceService.updateRecord(recordId, req.user.userId, dto);
  }

  @Get('sessions/:id')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryService.getSessionDetails(id);
  }

  @Get('faculty/me')
  @Roles(Role.FACULTY)
  getMySessions(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.queryService.getFacultySessions(req.user.facultyProfileId, limit, offset);
  }

  @Post('sessions/:id/lock')
  @Roles(Role.FACULTY, Role.ADMIN)
  @UseGuards(AcademicAccessGuard)
  lockSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.lockSession(id);
  }

  // ─── Student Endpoints ──────────────────────────────────────────────────────

  @Get('student/me/summary')
  @Roles(Role.STUDENT)
  async getMySummary(@Req() req: any) {
    const context = await this.academicContext.resolveStudentContext(req.user.userId);
    const summaries = await this.queryService.getStudentSubjectSummaries(
      context.enrollment.id,
    );

    return summaries.map((s) => ({
      ...s,
      health: this.analyticsService.getSubjectHealth(s.stats),
    }));
  }

  @Get('student/me/history')
  @Roles(Role.STUDENT)
  async getMyHistory(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const context = await this.academicContext.resolveStudentContext(req.user.userId);
    return this.queryService.getStudentHistory(context.enrollment.id, limit, offset);
  }

  // ─── Admin Endpoints ────────────────────────────────────────────────────────

  @Get('admin/sections/:id/analytics')
  @Roles(Role.ADMIN)
  async getSectionAnalytics(@Param('id', ParseUUIDPipe) sectionId: string) {
    return { sectionId, message: 'Section analytics integration pending' };
  }
}
