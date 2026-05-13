import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsUUID()
  termId: string;
}

export class AddStudentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  studentIds: string[];
}

export class CreateSubjectDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsUUID()
  termId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  credits?: number;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  credits?: number;
}

export class CreateFacultyAssignmentDto {
  @IsUUID()
  facultyId: string;

  @IsUUID()
  sectionId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  termId: string;

  @IsUUID()
  yearId: string;
}
