import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 24) {
    const skip = (page - 1) * limit;
    const [total, history] = await Promise.all([
      this.prisma.watchHistory.count({ where: { userId } }),
      this.prisma.watchHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { watchedAt: 'desc' },
        include: {
          movie: {
            include: {
              genres: { include: { genre: true } },
            },
          },
          episode: true,
        },
      }),
    ]);

    return {
      data: history,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async upsert(userId: string, movieId: string, episodeId: string | null, progress: number, duration: number) {
    const cleanProgress = Math.round(progress || 0);
    const cleanDuration = Math.round(duration || 0);
    const targetEpisodeId = episodeId || null;

    const existing = await this.prisma.watchHistory.findFirst({
      where: {
        userId,
        movieId,
        episodeId: targetEpisodeId,
      },
    });

    if (existing) {
      return this.prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          progress: cleanProgress,
          duration: cleanDuration,
          watchedAt: new Date(),
        },
      });
    }

    return this.prisma.watchHistory.create({
      data: {
        userId,
        movieId,
        episodeId: targetEpisodeId,
        progress: cleanProgress,
        duration: cleanDuration,
      },
    });
  }

  async getProgress(userId: string, movieId: string, episodeId?: string) {
    return this.prisma.watchHistory.findFirst({
      where: { userId, movieId, episodeId: episodeId || null },
    });
  }

  async delete(userId: string, movieId: string) {
    return this.prisma.watchHistory.deleteMany({ where: { userId, movieId } });
  }
}
