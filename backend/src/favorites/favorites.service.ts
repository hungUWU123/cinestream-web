import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 24) {
    const skip = (page - 1) * limit;
    const [total, favorites] = await Promise.all([
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          movie: {
            include: {
              genres: { include: { genre: true } },
              countries: { include: { country: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: favorites.map((f) => f.movie),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async toggle(userId: string, movieId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { userId_movieId: { userId, movieId } },
      });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({ data: { userId, movieId } });
      return { favorited: true };
    }
  }

  async check(userId: string, movieId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });
    return { favorited: !!fav };
  }
}
