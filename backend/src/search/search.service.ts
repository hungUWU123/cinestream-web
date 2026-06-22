import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OphimService } from '../ophim/ophim.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private ophim: OphimService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async search(query: {
    q?: string;
    genre?: string;
    country?: string;
    year?: number;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 24;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (query.q) {
      const slugQuery = this.slugify(query.q);
      where.OR = [
        { name: { contains: query.q } },
        { originName: { contains: query.q } },
        { slug: { contains: slugQuery } },
        { actors: { some: { actor: { name: { contains: query.q } } } } },
      ];
    }

    if (query.genre) {
      where.genres = { some: { genre: { slug: query.genre } } };
    }
    if (query.country) {
      where.countries = { some: { country: { slug: query.country } } };
    }
    if (query.year) where.year = Number(query.year);
    if (query.type) where.type = query.type.toUpperCase();
    if (query.status) where.status = query.status.toUpperCase();

    const [total, movies] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: { viewCount: 'desc' },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
      }),
    ]);

    // If local results are empty and there's a search query, try OPhim API
    if (total === 0 && query.q) {
      try {
        const ophimResult = await this.ophim.searchMovies(query.q, page);
        return {
          data: ophimResult.data?.items || [],
          pagination: ophimResult.data?.params?.pagination || { total: 0, page, limit, totalPages: 0 },
          source: 'ophim',
        };
      } catch {
        // Fallback to empty result
      }
    }

    return {
      data: movies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      source: 'local',
    };
  }

  async getSuggestions(q: string, limit = 5) {
    if (!q || q.length < 2) return [];
    const slugQuery = this.slugify(q);

    return this.prisma.movie.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: q } },
          { originName: { contains: q } },
          { slug: { contains: slugQuery } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        thumbUrl: true,
        year: true,
        type: true,
      },
    });
  }
}
