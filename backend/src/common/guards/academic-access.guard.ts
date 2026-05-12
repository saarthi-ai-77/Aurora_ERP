import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AcademicContextService } from '../../academic/academic-context.service';
import { Role } from '@prisma/client';

@Injectable()
export class AcademicAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private academicContext: AcademicContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Admins have global access
    if (user.role === Role.ADMIN) return true;

    // Extract resource IDs from request (params, query, or body)
    const sectionId = request.params.sectionId || request.query.sectionId || request.body.sectionId;
    const subjectId = request.params.subjectId || request.query.subjectId || request.body.subjectId;

    // If no specific academic resource is being accessed, allow (role guards handle the rest)
    if (!sectionId && !subjectId) return true;

    const hasAccess = await this.academicContext.validateOwnership(
      user.userId,
      user.role,
      { sectionId, subjectId },
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this academic resource');
    }

    return true;
  }
}
