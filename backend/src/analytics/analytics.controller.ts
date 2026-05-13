import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('student/me')
  @Roles(Role.STUDENT)
  async getStudentDashboard(@Req() req: any) {
    return this.analyticsService.getStudentAnalytics(req.user.userId);
  }

  @Get('faculty/me')
  @Roles(Role.FACULTY)
  async getFacultyDashboard(@Req() req: any) {
    return this.analyticsService.getFacultyAnalytics(req.user.userId);
  }

  @Get('admin/summary')
  @Roles(Role.ADMIN)
  async getAdminSummary() {
    return this.analyticsService.getAdminAnalytics();
  }
}
