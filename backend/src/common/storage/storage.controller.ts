import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { STORAGE_PROVIDER } from './storage.service';
import type { IStorageProvider } from './storage.interface';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
    private readonly config: ConfigService,
  ) {}

  @Get('*')
  async serveFile(@Param('0') filePath: string, @Res() res: Response) {
    if (!filePath) throw new BadRequestException('File path required');

    // For Supabase: redirect to a signed URL
    if (this.provider instanceof SupabaseStorageProvider) {
      const signedUrl = await this.provider.createSignedUrl(filePath);
      return res.redirect(302, signedUrl);
    }

    // For local storage: stream the file
    const normalised = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(UPLOAD_DIR, normalised);

    if (!fullPath.startsWith(UPLOAD_DIR + path.sep) && fullPath !== UPLOAD_DIR) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(fullPath);
  }
}
