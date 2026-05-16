import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentCategory } from '@prisma/client';

export class CreateAssignmentDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsUUID()
  templateId: string;

  @IsUUID()
  sectionId: string;

  @IsUUID()
  subjectId: string;

  @IsOptional()
  @IsEnum(AssignmentCategory)
  category?: AssignmentCategory;

  @IsNumber()
  @Min(1)
  @Max(1000)
  maxMarks: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  variant?: number;

  @IsOptional()
  @IsBoolean()
  allowResubmissions?: boolean;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: any;
}

export class GradeSubmissionDto {
  @IsNumber()
  @Min(0)
  marks: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class FacultyAssignmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;
}

export class GradeEntryDto {
  @IsUUID()
  studentEnrollmentId: string;

  @IsNumber()
  @Min(0)
  marks: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class BulkGradeDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  sectionId: string;

  @IsUUID()
  subjectId: string;

  @IsString()
  title: string;

  @IsNumber()
  maxMarks: number;

  @Type(() => GradeEntryDto)
  grades: GradeEntryDto[];
}
