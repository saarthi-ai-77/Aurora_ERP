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

    const sectionId = request.params.sectionId || request.query.sectionId || request.body.sectionId;
    const subjectId = request.params.subjectId || request.query.subjectId || request.body.subjectId;
    const sessionId = request.params.sessionId || request.body.sessionId;
    const assignmentId = request.params.assignmentId || request.body.assignmentId;
    
    // In some cases, the ID might be a record ID or session ID directly in the path
    let recordId = request.params.recordId;
    let fallbackId = request.params.id;

    if (!sessionId && !assignmentId && fallbackId) {
      // If we only have 'id', we don't know if it's a session or assignment. 
      // validateOwnership will try to resolve it.
    }

    // If no specific academic resource is being accessed, allow (role guards handle the rest)
    if (!sectionId && !subjectId && !sessionId && !assignmentId && !fallbackId && !recordId) return true;

    const hasAccess = await this.academicContext.validateOwnership(
      user.userId,
      user.role,
      { sectionId, subjectId, sessionId, assignmentId, recordId, fallbackId },
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this academic resource');
    }

    return true;
  }
}
