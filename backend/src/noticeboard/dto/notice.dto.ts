import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { NoticeCategory, NoticePriority, Role, NoticeStatus } from '@prisma/client';

export class CreateNoticeDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  content: string;

  @IsEnum(NoticeCategory)
  category: NoticeCategory;

  @IsOptional()
  @IsEnum(NoticePriority)
  priority?: NoticePriority;

  @IsOptional()
  @IsEnum(NoticeStatus)
  status?: NoticeStatus;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  targetRoles?: Role[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetDepartments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSections?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(NoticeCategory)
  category?: NoticeCategory;

  @IsOptional()
  @IsEnum(NoticePriority)
  priority?: NoticePriority;

  @IsOptional()
  @IsEnum(NoticeStatus)
  status?: NoticeStatus;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  targetRoles?: Role[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetDepartments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSections?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
