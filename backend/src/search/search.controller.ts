import { Controller, Get, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('global')
  globalSearch(@Query('q') query: string) {
    void query;
    throw new ServiceUnavailableException(
      'Global search is temporarily disabled during deployment recovery',
    );
  }
}
