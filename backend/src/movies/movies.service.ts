import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OphimService } from '../ophim/ophim.service';

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private ophim: OphimService,
  ) {}

  private readonly include = {
    genres: { include: { genre: true } },
    countries: { include: { country: true } },
    actors: { include: { actor: true } },
    directors: { include: { director: true } },
    _count: { select: { episodes: true, comments: true, favorites: true } },
  };

  async findAll(query: {
    page?: number;
    limit?: number;
    genre?: string;
    country?: string;
    year?: number;
    type?: string;
    status?: string;
    quality?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 24;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (query.genre) {
      where.genres = { some: { genre: { slug: query.genre } } };
    }
    if (query.country) {
      where.countries = { some: { country: { slug: query.country } } };
    }
    if (query.year) where.year = Number(query.year);
    if (query.type) where.type = query.type.toUpperCase();
    if (query.status) where.status = query.status.toUpperCase();
    if (query.quality) where.quality = query.quality;

    const [total, movies] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
      }),
    ]);

    return {
      data: movies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFeatured(limit = 10) {
    return this.prisma.movie.findMany({
      where: { isPublished: true, isFeatured: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: this.include,
    });
  }

  async findTrending(limit = 20) {
    return this.prisma.movie.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        genres: { include: { genre: true } },
        countries: { include: { country: true } },
      },
    });
  }

  async findNew(limit = 24) {
    return this.prisma.movie.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        genres: { include: { genre: true } },
        countries: { include: { country: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: this.include,
    });

    if (!movie) {
      // Try to sync from OPhim first
      try {
        await this.ophim.syncMovie(slug);
        return this.prisma.movie.findUnique({
          where: { slug },
          include: this.include,
        });
      } catch {
        throw new NotFoundException(`Movie not found: ${slug}`);
      }
    }

    // Increment view count
    await this.prisma.movie.update({
      where: { id: movie.id },
      data: { viewCount: { increment: 1 } },
    });

    return movie;
  }

  async findEpisodes(movieId: string) {
    return this.prisma.episode.findMany({
      where: { movieId },
      orderBy: [{ serverName: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findRelated(movieId: string, limit = 12) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: { genres: { include: { genre: true } } },
    });

    if (!movie) return [];

    const genreIds = movie.genres.map((g) => g.genreId);

    return this.prisma.movie.findMany({
      where: {
        id: { not: movieId },
        isPublished: true,
        genres: { some: { genreId: { in: genreIds } } },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        genres: { include: { genre: true } },
        countries: { include: { country: true } },
      },
    });
  }

  async getGenres() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }

  async getCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  async rateMovie(movieId: string, userId: string, rating: number) {
    if (rating < 1 || rating > 10) {
      throw new Error('Rating must be between 1 and 10');
    }

    // Upsert the rating
    await this.prisma.movieRating.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      create: {
        userId,
        movieId,
        rating,
      },
      update: {
        rating,
      },
    });

    // Recalculate average and count
    const aggregations = await this.prisma.movieRating.aggregate({
      where: { movieId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const averageRating = aggregations._avg.rating || 0;
    const ratingCount = aggregations._count.rating || 0;

    // Update the movie with the calculated ratings
    const updatedMovie = await this.prisma.movie.update({
      where: { id: movieId },
      data: {
        userRatingAvg: averageRating,
        userRatingCount: ratingCount,
      },
      select: {
        id: true,
        userRatingAvg: true,
        userRatingCount: true,
      },
    });

    return {
      message: 'Rating submitted successfully',
      movie: updatedMovie,
    };
  }

  async getUserRating(movieId: string, userId: string) {
    const userRating = await this.prisma.movieRating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      select: {
        rating: true,
      },
    });

    return {
      rating: userRating ? userRating.rating : null,
    };
  }
}
