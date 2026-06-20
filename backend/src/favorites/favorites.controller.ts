import { Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 24,
  ) {
    return this.favoritesService.findAll(userId, Number(page), Number(limit));
  }

  @Post(':movieId')
  @HttpCode(HttpStatus.OK)
  toggle(@CurrentUser('id') userId: string, @Param('movieId') movieId: string) {
    return this.favoritesService.toggle(userId, movieId);
  }

  @Get(':movieId/check')
  check(@CurrentUser('id') userId: string, @Param('movieId') movieId: string) {
    return this.favoritesService.check(userId, movieId);
  }
}
