import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageProvider, FileMetadata } from './storage.interface';

const BUCKET = 'aurora-uploads';

@Injectable()
export class SupabaseStorageProvider implements IStorageProvider {
  private supabase: SupabaseClient;
  private bucketChecked = false;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.getOrThrow('SUPABASE_URL'),
      this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  private async ensureBucketExists() {
    if (this.bucketChecked) return;
    try {
      console.log(`[SupabaseStorageProvider] Checking if bucket '${BUCKET}' exists...`);
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      if (listError) {
        console.error('[SupabaseStorageProvider] Failed to list buckets:', listError);
        return;
      }
      const exists = buckets.some(b => b.name === BUCKET);
      if (!exists) {
        console.log(`[SupabaseStorageProvider] Bucket '${BUCKET}' does not exist. Creating it...`);
        const { error: createError } = await this.supabase.storage.createBucket(BUCKET, {
          public: false, // Serve via signed URLs for security
          fileSizeLimit: 3 * 1024 * 1024, // 3MB limit
          allowedMimeTypes: ['application/pdf'],
        });
        if (createError) {
          console.error(`[SupabaseStorageProvider] Failed to create bucket '${BUCKET}':`, createError);
        } else {
          console.log(`[SupabaseStorageProvider] Bucket '${BUCKET}' created successfully.`);
          this.bucketChecked = true;
        }
      } else {
        this.bucketChecked = true;
      }
    } catch (e) {
      console.error('[SupabaseStorageProvider] Unexpected error during bucket check:', e);
    }
  }

  async uploadFile(file: FileMetadata, directory: string): Promise<string> {
    if (!file.buffer) {
      throw new InternalServerErrorException('File buffer is empty');
    }

    await this.ensureBucketExists();

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
    await this.ensureBucketExists();

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
    await this.ensureBucketExists();

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
