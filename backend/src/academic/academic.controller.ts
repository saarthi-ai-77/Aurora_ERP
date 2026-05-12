import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AcademicContextService } from './academic-context.service';
import { AcademicEngineService } from './services/academic-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('academic')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicController {
  constructor(
    private academicContext: AcademicContextService,
    private academicEngine: AcademicEngineService,
  ) {}

  @Get('session')
  async getActiveSession() {
    return this.academicContext.getActiveAcademicSession();
  }

  @Get('tree')
  @Roles(Role.ADMIN)
  async getAcademicTree() {
    return this.academicEngine.getAcademicTree();
  }

  @Get('context/me')
  async getMyContext(@Req() req: any) {
    if (req.user.role === Role.STUDENT) {
      return this.academicContext.resolveStudentContext(req.user.userId);
    }
    if (req.user.role === Role.FACULTY) {
      return this.academicContext.resolveFacultyContext(req.user.userId);
    }
    return { role: req.user.role, message: 'Admin has no specific academic context' };
  }
}
