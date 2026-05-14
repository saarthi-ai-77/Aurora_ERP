import { IsString, IsUUID, MaxLength, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(50)
  registrationNumber: string;

  @IsUUID()
  sectionId: string;
}
