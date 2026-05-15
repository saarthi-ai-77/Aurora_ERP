import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { STORAGE_PROVIDER } from './storage.service';
import * as StorageInterface from './storage.interface';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import { R2StorageProvider } from './r2-storage.provider';
import { Role } from '@prisma/client';
import { AcademicContextService } from '../../academic/academic-context.service';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageInterface.IStorageProvider,
    private readonly config: ConfigService,
    private readonly academicContext: AcademicContextService,
  ) {}

  @Get('*path')
  async serveFile(@Req() req: any, @Param() params: any, @Res() res: Response) {
    try {
      const user = req.user;
      let filePath = params['path'];
      if (Array.isArray(filePath)) {
        filePath = filePath.join('/');
      }
      
      console.log(`[STORAGE] Access request by ${user.email} for: ${filePath}`);

      if (!filePath) throw new BadRequestException('File path required');

      // ─── Relationship-Aware Authorization ────────────────────────────────────
      
      // 1. Assignment Submissions (/assignments/:id/:userId/...)
      const assignmentMatch = filePath.match(/^assignments\/([^\/]+)\/([^\/]+)/);
      if (assignmentMatch) {
        const [_, assignmentId, ownerUserId] = assignmentMatch;

        if (user.role === Role.STUDENT) {
          // Students can only access their OWN submissions
          if (user.userId !== ownerUserId) {
            console.error(`[STORAGE DENIED] Student ${user.userId} attempted to access ${ownerUserId}'s file`);
            throw new ForbiddenException('You can only access your own submissions');
          }

          const hasAccess = await this.academicContext.validateOwnership(user.userId, Role.STUDENT, {
            assignmentId,
          });
          if (!hasAccess) {
            throw new ForbiddenException('You do not have permission to access this submission');
          }
        } else if (user.role === Role.FACULTY) {
          // Faculty must have ownership of the assignment's section/subject
          const hasAccess = await this.academicContext.validateOwnership(user.userId, Role.FACULTY, { assignmentId });
          if (!hasAccess) {
            console.error(`[STORAGE DENIED] Faculty ${user.userId} attempted to access unauthorized assignment ${assignmentId}`);
            throw new ForbiddenException('You do not have permission to access this submission');
          }
        }
      } else if (user.role !== Role.ADMIN) {
        throw new ForbiddenException('File access is not permitted for this resource');
      }

      // ─── Backend Serving Logic ───────────────────────────────────────────────

      // For Supabase: redirect to a signed URL
      if (this.provider instanceof SupabaseStorageProvider) {
        const signedUrl = await this.provider.createSignedUrl(filePath);
        return res.redirect(302, signedUrl);
      }

      // For R2: redirect to a signed URL
      if (this.provider instanceof R2StorageProvider) {
        const signedUrl = await this.provider.createSignedUrl(filePath);
        return res.redirect(302, signedUrl);
      }

      // For local storage: stream the file
      const normalised = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
      const absoluteUploadDir = path.resolve(UPLOAD_DIR);
      const fullPath = path.resolve(absoluteUploadDir, normalised);
      
      console.log('[STORAGE DEBUG] Full Path:', fullPath);

      // Security check: ensure the resolved path is within the upload directory
      if (!fullPath.toLowerCase().startsWith(absoluteUploadDir.toLowerCase())) {
        console.error('[STORAGE ERROR] Path Traversal Attempt or Invalid Path:', fullPath);
        throw new BadRequestException('Invalid file path');
      }

      if (!fs.existsSync(fullPath)) {
        console.error('[STORAGE ERROR] File not found at:', fullPath);
        throw new NotFoundException('File not found');
      }

      return res.sendFile(fullPath);
    } catch (error) {
      console.error('[STORAGE CRITICAL ERROR]:', error);
      throw error;
    }
  }
}
