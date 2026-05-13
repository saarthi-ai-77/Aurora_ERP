import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import type { IStorageProvider } from './storage.interface';
import type { FileMetadata } from './storage.interface';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class StorageService {
  constructor(@Inject(STORAGE_PROVIDER) private provider: IStorageProvider) {}

  async uploadFile(file: Express.Multer.File, directory: string): Promise<string> {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase();
    const randomizedFilename = `${uuidv4()}${ext}`;

    const metadata: FileMetadata = {
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname,
      filename: randomizedFilename,
      buffer: file.buffer,
    };

    return this.provider.uploadFile(metadata, directory);
  }

  async deleteFile(filePath: string): Promise<void> {
    return this.provider.deleteFile(filePath);
  }

  getFileUrl(filePath: string): string {
    return this.provider.getFileUrl(filePath);
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.csv'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException('Invalid file extension');
    }
  }
}
