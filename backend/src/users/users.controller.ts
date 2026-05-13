import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../common/audit-log/audit.interceptor';
import { Audit } from '../common/audit-log/audit.decorator';
import { Role, AuditAction } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStudentDto } from './dto/create-student.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  getMyProfile(@Req() req: any) {
    return this.usersService.getMyProfile(req.user.userId);
  }

  @Post('students')
  @Roles(Role.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.USER_CREATED)
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Get('admin/audit-logs')
  @Roles(Role.ADMIN)
  getAuditLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.usersService.getAuditLogs(limit, offset);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.USER_UPDATED)
  toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Post('bulk-upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.USER_CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Query('role') role: Role,
  ) {
    if (!role || !Object.values(Role).includes(role)) {
      throw new BadRequestException('Valid role (STUDENT, FACULTY, ADMIN) is required in query params');
    }
    return this.usersService.bulkUpload(file, role);
  }
}
