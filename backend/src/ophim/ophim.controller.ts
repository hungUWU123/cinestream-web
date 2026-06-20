import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { OphimService } from './ophim.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/enums';

@Controller('ophim')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class OphimController {
  constructor(private ophimService: OphimService) {}

  @Post('sync-movie')
  syncMovie(@Body('slug') slug: string) {
    return this.ophimService.syncMovie(slug);
  }

  @Post('sync-latest')
  syncLatest(@Body('pages') pages = 3) {
    return this.ophimService.syncLatestMovies(pages);
  }

  @Get('fetch-list')
  fetchList(@Query('page') page = 1) {
    return this.ophimService.fetchMovieList(Number(page));
  }

  @Get('fetch-detail')
  fetchDetail(@Query('slug') slug: string) {
    return this.ophimService.fetchMovieDetail(slug);
  }
}
