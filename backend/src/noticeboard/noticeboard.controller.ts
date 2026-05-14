import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { NoticeboardService } from './noticeboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../common/audit-log/audit.interceptor';
import { Audit } from '../common/audit-log/audit.decorator';
import { Role, AuditAction } from '@prisma/client';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';

@Controller('noticeboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticeboardController {
  constructor(private noticeboardService: NoticeboardService) {}

  @Get('me')
  getMyNotices(@Req() req: any) {
    return this.noticeboardService.getMyNotices(req.user.userId, req.user.role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.FACULTY)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.NOTICE_POSTED)
  createNotice(@Req() req: any, @Body() dto: CreateNoticeDto) {
    return this.noticeboardService.createNotice(req.user.userId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.FACULTY)
  updateNotice(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdateNoticeDto,
  ) {
    return this.noticeboardService.updateNotice(id, req.user.userId, dto);
  }

  @Patch(':id/publish')
  @Roles(Role.ADMIN, Role.FACULTY)
  publishNotice(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.noticeboardService.publishNotice(id, req.user.userId);
  }

  @Patch(':id/archive')
  @Roles(Role.ADMIN, Role.FACULTY)
  archiveNotice(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.noticeboardService.archiveNotice(id, req.user.userId);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN)
  getAllNotices(@Query() query: PaginationQueryDto) {
    return this.noticeboardService.getAllNotices(query);
  }
}
