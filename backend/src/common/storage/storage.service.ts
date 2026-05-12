import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IStorageProvider, FileMetadata } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class StorageService {
  private provider: IStorageProvider;

  constructor() {
    // In the future, this can be injected dynamically to switch to S3
    this.provider = new LocalStorageProvider();
  }

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
      throw new BadRequestException(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // Double check extension to prevent MIME spoofing tricks
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.csv'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException('Invalid file extension');
    }
  }
}
