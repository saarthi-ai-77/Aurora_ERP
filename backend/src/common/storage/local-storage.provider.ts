import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IStorageProvider, FileMetadata } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: FileMetadata, directory: string): Promise<string> {
    if (!file.buffer) {
      throw new InternalServerErrorException('File buffer is empty');
    }

    const targetDir = path.join(this.uploadDir, directory);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, file.filename!);
    
    // Prevent path traversal
    if (!filePath.startsWith(this.uploadDir)) {
      throw new InternalServerErrorException('Invalid file path detected');
    }

    await fs.promises.writeFile(filePath, file.buffer);
    
    // Return relative path for DB storage
    return path.join(directory, file.filename!).replace(/\\/g, '/');
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    if (fs.existsSync(fullPath) && fullPath.startsWith(this.uploadDir)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getFileUrl(filePath: string): string {
    const baseUrl = process.env.API_URL || 'http://localhost:3001/api/v1';
    return `${baseUrl}/storage/${filePath}`;
  }
}
