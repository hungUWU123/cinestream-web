import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WatchHistoryService } from './watch-history.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('watch-history')
@UseGuards(JwtAuthGuard)
export class WatchHistoryController {
  constructor(private watchHistoryService: WatchHistoryService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 24,
  ) {
    return this.watchHistoryService.findAll(userId, Number(page), Number(limit));
  }

  @Post()
  upsert(
    @CurrentUser('id') userId: string,
    @Body() body: { movieId: string; episodeId?: string; progress: number; duration: number },
  ) {
    return this.watchHistoryService.upsert(userId, body.movieId, body.episodeId || null, body.progress, body.duration);
  }

  @Get(':movieId/progress')
  getProgress(
    @CurrentUser('id') userId: string,
    @Param('movieId') movieId: string,
    @Query('episodeId') episodeId?: string,
  ) {
    return this.watchHistoryService.getProgress(userId, movieId, episodeId);
  }

  @Delete(':movieId')
  delete(@CurrentUser('id') userId: string, @Param('movieId') movieId: string) {
    return this.watchHistoryService.delete(userId, movieId);
  }
}
