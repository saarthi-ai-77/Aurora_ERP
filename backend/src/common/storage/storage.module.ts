import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService, STORAGE_PROVIDER } from './storage.service';
import { StorageController } from './storage.controller';
import { LocalStorageProvider } from './local-storage.provider';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import { R2StorageProvider } from './r2-storage.provider';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get('STORAGE_PROVIDER', 'local');
        if (provider === 'supabase') {
          return new SupabaseStorageProvider(config);
        }
        if (provider === 'r2') {
          return new R2StorageProvider(config);
        }
        return new LocalStorageProvider();
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
