import {
  Controller, Get, Post, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CommentsService, CreateCommentDto } from './comments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('movie/:movieId')
  @Public()
  findByMovie(
    @Param('movieId') movieId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commentsService.findByMovie(movieId, Number(page), Number(limit));
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(userId, dto);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  likeComment(@CurrentUser('id') userId: string, @Param('id') commentId: string) {
    return this.commentsService.likeComment(userId, commentId);
  }

  @Post(':id/report')
  @HttpCode(HttpStatus.OK)
  reportComment(
    @CurrentUser('id') userId: string,
    @Param('id') commentId: string,
    @Body('reason') reason: string,
  ) {
    return this.commentsService.report(userId, commentId, reason);
  }

  @Delete(':id')
  deleteComment(@CurrentUser('id') userId: string, @Param('id') commentId: string) {
    return this.commentsService.delete(userId, commentId);
  }
}
