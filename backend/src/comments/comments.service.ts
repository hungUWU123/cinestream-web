import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  movieId: string;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByMovie(movieId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, comments] = await Promise.all([
      this.prisma.comment.count({
        where: { movieId, parentId: null, isHidden: false },
      }),
      this.prisma.comment.findMany({
        where: { movieId, parentId: null, isHidden: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, role: true },
          },
          replies: {
            where: { isHidden: false },
            take: 5,
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatar: true, role: true },
              },
              _count: { select: { likes: true } },
            },
          },
          _count: { select: { likes: true, replies: true } },
        },
      }),
    ]);

    return {
      data: comments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        movieId: dto.movieId,
        userId,
        parentId: dto.parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true, role: true },
        },
        _count: { select: { likes: true } },
      },
    });
  }

  async likeComment(userId: string, commentId: string) {
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await this.prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
      return { liked: false };
    } else {
      await this.prisma.commentLike.create({ data: { userId, commentId } });
      return { liked: true };
    }
  }

  async delete(userId: string, commentId: string, isAdmin = false) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) throw new NotFoundException('Comment not found');
    if (!isAdmin && comment.userId !== userId) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { isHidden: true },
    });
  }

  async report(userId: string, commentId: string, reason: string) {
    return this.prisma.report.create({
      data: { userId, commentId, reason },
    });
  }
}
