import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider, FileMetadata } from './storage.interface';

@Injectable()
export class R2StorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucket: string;
  private publicDomain: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY');
    
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicDomain = this.config.get<string>('R2_PUBLIC_DOMAIN', '');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(file: FileMetadata, directory: string): Promise<string> {
    if (!file.buffer) {
      throw new InternalServerErrorException('File buffer is empty');
    }

    const storagePath = `${directory}/${file.filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      return storagePath;
    } catch (error) {
      throw new InternalServerErrorException(`R2 upload failed: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new InternalServerErrorException(`R2 delete failed: ${error.message}`);
    }
  }

  getFileUrl(filePath: string): string {
    // If we have a public domain configured for the R2 bucket, return that
    if (this.publicDomain) {
      const cleanDomain = this.publicDomain.endsWith('/') 
        ? this.publicDomain.slice(0, -1) 
        : this.publicDomain;
      return `${cleanDomain}/${filePath}`;
    }

    // Otherwise, return the path that our StorageController will resolve to a signed URL
    return `/api/v1/storage/${filePath}`;
  }

  async createSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create R2 signed URL: ${error.message}`);
    }
  }
}
