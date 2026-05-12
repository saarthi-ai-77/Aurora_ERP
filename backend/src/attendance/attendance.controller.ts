import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryService } from './attendance-query.service';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AcademicAccessGuard } from '../common/guards/academic-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AttendanceStatus } from '@prisma/client';
import { AcademicContextService } from '../academic/academic-context.service';

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
  async createSession(@Req() req: any, @Body() data: any) {
    return this.attendanceService.createSession(req.user.facultyProfileId, data);
  }

  @Post('sessions/:id/records')
  @Roles(Role.FACULTY)
  async markAttendance(
    @Param('id') sessionId: string,
    @Body('records') records: { studentEnrollmentId: string; status: AttendanceStatus; remarks?: string }[]
  ) {
    return this.attendanceService.markAttendance(sessionId, records);
  }

  @Patch('records/:id')
  @Roles(Role.FACULTY)
  async updateRecord(
    @Req() req: any,
    @Param('id') recordId: string,
    @Body() data: { status: AttendanceStatus; remarks?: string; reason?: string }
  ) {
    return this.attendanceService.updateRecord(recordId, req.user.userId, data);
  }

  @Get('sessions/:id')
  @Roles(Role.FACULTY, Role.ADMIN)
  async getSession(@Param('id') id: string) {
    return this.queryService.getSessionDetails(id);
  }

  @Get('faculty/me')
  @Roles(Role.FACULTY)
  async getMySessions(@Req() req: any, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.queryService.getFacultySessions(req.user.facultyProfileId, limit, offset);
  }

  @Post('sessions/:id/lock')
  @Roles(Role.FACULTY, Role.ADMIN)
  async lockSession(@Param('id') id: string) {
    return this.attendanceService.lockSession(id);
  }

  // ─── Student Endpoints ──────────────────────────────────────────────────────

  @Get('student/me/summary')
  @Roles(Role.STUDENT)
  async getMySummary(@Req() req: any) {
    const context = await this.academicContext.resolveStudentContext(req.user.userId);
    const summaries = await this.queryService.getStudentSubjectSummaries(context.enrollment.id);
    
    return summaries.map(s => ({
      ...s,
      health: this.analyticsService.getSubjectHealth(s.stats)
    }));
  }

  @Get('student/me/history')
  @Roles(Role.STUDENT)
  async getMyHistory(@Req() req: any, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const context = await this.academicContext.resolveStudentContext(req.user.userId);
    return this.queryService.getStudentHistory(context.enrollment.id, limit, offset);
  }

  // ─── Admin Endpoints ────────────────────────────────────────────────────────

  @Get('admin/sections/:id/analytics')
  @Roles(Role.ADMIN)
  async getSectionAnalytics(@Param('id') sectionId: string) {
    // Basic implementation for now
    return { sectionId, message: 'Section analytics integration pending' };
  }
}
