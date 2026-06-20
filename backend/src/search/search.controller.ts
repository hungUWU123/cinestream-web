import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('genre') genre?: string,
    @Query('country') country?: string,
    @Query('year') year?: number,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 24,
  ) {
    return this.searchService.search({ q, genre, country, year, type, page: Number(page), limit: Number(limit) });
  }

  @Get('suggestions')
  suggestions(@Query('q') q: string) {
    return this.searchService.getSuggestions(q);
  }
}
