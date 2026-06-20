import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Get()
  @Public()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('genre') genre?: string,
    @Query('country') country?: string,
    @Query('year') year?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('quality') quality?: string,
  ) {
    return this.moviesService.findAll({ page, limit, genre, country, year, type, status, quality });
  }

  @Get('featured')
  @Public()
  findFeatured(@Query('limit') limit = 10) {
    return this.moviesService.findFeatured(Number(limit));
  }

  @Get('trending')
  @Public()
  findTrending(@Query('limit') limit = 20) {
    return this.moviesService.findTrending(Number(limit));
  }

  @Get('new')
  @Public()
  findNew(@Query('limit') limit = 24) {
    return this.moviesService.findNew(Number(limit));
  }

  @Get('genres')
  @Public()
  getGenres() {
    return this.moviesService.getGenres();
  }

  @Get('countries')
  @Public()
  getCountries() {
    return this.moviesService.getCountries();
  }

  @Get(':slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.moviesService.findBySlug(slug);
  }

  @Get(':id/episodes')
  @Public()
  findEpisodes(@Param('id') id: string) {
    return this.moviesService.findEpisodes(id);
  }

  @Get(':id/related')
  @Public()
  findRelated(@Param('id') id: string, @Query('limit') limit = 12) {
    return this.moviesService.findRelated(id, Number(limit));
  }

  @Post(':id/rate')
  rate(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Request() req: any,
  ) {
    return this.moviesService.rateMovie(id, req.user.id, Number(rating));
  }

  @Get(':id/my-rating')
  getMyRating(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.moviesService.getUserRating(id, req.user.id);
  }
}
