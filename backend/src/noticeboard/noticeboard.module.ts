import { Module } from '@nestjs/common';
import { NoticeboardController } from './noticeboard.controller';
import { NoticeboardService } from './noticeboard.service';
import { AcademicModule } from '../academic/academic.module';

@Module({
  imports: [AcademicModule],
  controllers: [NoticeboardController],
  providers: [NoticeboardService],
  exports: [NoticeboardService],
})
export class NoticeboardModule {}
