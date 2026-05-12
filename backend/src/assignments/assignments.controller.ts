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
import { AcademicAccessGuard } from '../common/guards/academic-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AssignmentsService } from './assignments.service';
import { AssignmentsQueryService } from './assignments-query.service';
import { AssignmentsAnalyticsService } from './assignments-analytics.service';
import { Role } from '@prisma/client';
import { ApiSuccessResponse } from '@shared/contracts/api.contracts';

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
  async createAssignment(
    @GetUser('facultyProfileId') facultyId: string,
    @Body() data: any,
  ): Promise<ApiSuccessResponse<any>> {
    const assignment = await this.assignmentsService.createAssignment(facultyId, data);
    return { success: true, data: assignment, message: 'Assignment created as draft' };
  }

  @Patch(':id/publish')
  @Roles(Role.FACULTY)
  async publishAssignment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<any>> {
    const assignment = await this.assignmentsService.publishAssignment(id);
    return { success: true, data: assignment, message: 'Assignment published' };
  }

  @Get('faculty/me')
  @Roles(Role.FACULTY)
  async getMyAssignments(
    @GetUser('facultyProfileId') facultyId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiSuccessResponse<any>> {
    const assignments = await this.queryService.getFacultyAssignments(facultyId, { limit, offset });
    return { success: true, data: assignments };
  }

  @Get(':id/submissions')
  @Roles(Role.FACULTY)
  async getSubmissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiSuccessResponse<any>> {
    const submissions = await this.queryService.getAssignmentSubmissions(id, { limit, offset });
    return { success: true, data: submissions };
  }

  @Patch('submissions/:id/grade')
  @Roles(Role.FACULTY)
  async gradeSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('facultyProfileId') facultyId: string,
    @Body() data: { marks: number; feedback?: string },
  ): Promise<ApiSuccessResponse<any>> {
    const graded = await this.assignmentsService.gradeSubmission(id, facultyId, data);
    return { success: true, data: graded, message: 'Submission graded' };
  }

  @Post('submissions/:id/reopen')
  @Roles(Role.FACULTY)
  async reopenSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('facultyProfileId') facultyId: string,
    @Body('reason') reason?: string,
  ): Promise<ApiSuccessResponse<any>> {
    const reopened = await this.assignmentsService.reopenSubmission(id, facultyId, reason);
    return { success: true, data: reopened, message: 'Submission reopened for student' };
  }

  // ─── Student Endpoints ──────────────────────────────────────────────────

  @Get('student/me')
  @Roles(Role.STUDENT)
  async getStudentAssignments(
    @GetUser('userId') userId: string,
  ): Promise<ApiSuccessResponse<any>> {
    const assignments = await this.queryService.getStudentAssignments(userId);
    return { success: true, data: assignments };
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async submitAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiSuccessResponse<any>> {
    const submission = await this.assignmentsService.submitAssignment(id, userId, file);
    return { success: true, data: submission, message: 'Assignment submitted successfully' };
  }

  // ─── Shared Endpoints ───────────────────────────────────────────────────

  @Get('submissions/:id/details')
  async getSubmissionDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<any>> {
    const details = await this.queryService.getSubmissionDetails(id);
    return { success: true, data: details };
  }

  @Get(':id/stats')
  @Roles(Role.FACULTY, Role.ADMIN)
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<any>> {
    const stats = await this.analyticsService.getAssignmentStats(id);
    return { success: true, data: stats };
  }
}
