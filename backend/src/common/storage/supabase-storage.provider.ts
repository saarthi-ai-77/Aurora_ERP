import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageProvider, FileMetadata } from './storage.interface';

const BUCKET = 'aurora-uploads';

@Injectable()
export class SupabaseStorageProvider implements IStorageProvider {
  private supabase: SupabaseClient;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.getOrThrow('SUPABASE_URL'),
      this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async uploadFile(file: FileMetadata, directory: string): Promise<string> {
    if (!file.buffer) {
      throw new InternalServerErrorException('File buffer is empty');
    }

    const storagePath = `${directory}/${file.filename}`;

    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Supabase upload failed: ${error.message}`,
      );
    }

    return storagePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    if (error) {
      throw new InternalServerErrorException(
        `Supabase delete failed: ${error.message}`,
      );
    }
  }

  getFileUrl(filePath: string): string {
    // Return a path that our StorageController will resolve to a signed URL
    return `/api/v1/storage/${filePath}`;
  }

  async createSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
    console.log(`[SupabaseStorageProvider] Generating signed URL for: ${filePath}`);
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('[SupabaseStorageProvider] Supabase createSignedUrl error:', error);
      throw new InternalServerErrorException(
        `Failed to create signed URL: ${error?.message || 'Unknown Supabase error'}`,
      );
    }

    return data.signedUrl;
  }
}
