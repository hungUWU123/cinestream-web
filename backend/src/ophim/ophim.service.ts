import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { MovieType, MovieStatus } from '../common/types/enums';

export interface OphimListItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  tmdb?: { type: string; id: string; vote_average: number; vote_count: number };
  imdb?: { id: string; vote_average: number; vote_count: number };
  modified?: { time: string };
}

export interface OphimListResponse {
  status: boolean;
  items: OphimListItem[];
  pathImage: string;
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface OphimEpisodeData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface OphimServer {
  server_name: string;
  is_ai: boolean;
  server_data: OphimEpisodeData[];
}

export interface OphimMovieDetail {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  alternative_names: string[];
  content: string;
  type: string;
  status: string;
  thumb_url: string;
  poster_url: string;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  lang_key: string[];
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: { id: string; name: string; slug: string }[];
  country: { id: string; name: string; slug: string }[];
  is_copyright: boolean;
  is_published: boolean;
  tmdb?: { type: string; id: string; vote_average: number; vote_count: number };
  imdb?: { id: string; vote_average: number; vote_count: number };
}

@Injectable()
export class OphimService {
  private readonly logger = new Logger(OphimService.name);
  private readonly baseUrl: string;
  private readonly imageCdn: string;
  private isSyncing = false;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.baseUrl = config.get('OPHIM_BASE_URL', 'https://ophim1.com');
    this.imageCdn = config.get('OPHIM_IMAGE_CDN', 'https://img.ophim.live/uploads/movies');
  }

  private buildImageUrl(filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;
    return `${this.imageCdn}/${filename}`;
  }

  private parseMovieType(type: string): MovieType {
    return type === 'series' ? MovieType.SERIES : MovieType.MOVIE;
  }

  private parseMovieStatus(status: string): MovieStatus {
    if (status === 'ongoing') return MovieStatus.ONGOING;
    if (status === 'completed') return MovieStatus.COMPLETED;
    return MovieStatus.UPCOMING;
  }

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

  async fetchMovieList(page = 1): Promise<OphimListResponse> {
    const url = `${this.baseUrl}/danh-sach/phim-moi-cap-nhat?page=${page}`;
    const response = await firstValueFrom(
      this.http.get<OphimListResponse>(url),
    );
    return response.data;
  }

  async fetchMovieDetail(slug: string): Promise<{ movie: OphimMovieDetail; episodes: OphimServer[] }> {
    const url = `${this.baseUrl}/phim/${slug}`;
    const response = await firstValueFrom(
      this.http.get<{ status: boolean; movie: OphimMovieDetail; episodes: OphimServer[] }>(url),
    );
    return { movie: response.data.movie, episodes: response.data.episodes };
  }

  async searchMovies(keyword: string, page = 1) {
    const url = `${this.baseUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`;
    const response = await firstValueFrom(this.http.get(url));
    return response.data;
  }

  async fetchByCategory(type: string, page = 1) {
    const url = `${this.baseUrl}/v1/api/danh-sach/${type}?page=${page}`;
    const response = await firstValueFrom(this.http.get(url));
    return response.data;
  }

  async syncMovie(slug: string): Promise<string> {
    this.logger.log(`Syncing movie: ${slug}`);

    const { movie, episodes } = await this.fetchMovieDetail(slug);

    // Upsert genres
    const genreIds: string[] = [];
    for (const cat of movie.category) {
      const genre = await this.prisma.genre.upsert({
        where: { ophimId: cat.id },
        create: { ophimId: cat.id, name: cat.name, slug: cat.slug },
        update: { name: cat.name },
      });
      genreIds.push(genre.id);
    }

    // Upsert countries
    const countryIds: string[] = [];
    for (const cnt of movie.country) {
      const country = await this.prisma.country.upsert({
        where: { ophimId: cnt.id },
        create: { ophimId: cnt.id, name: cnt.name, slug: cnt.slug },
        update: { name: cnt.name },
      });
      countryIds.push(country.id);
    }

    // Upsert actors
    const actorIds: string[] = [];
    for (const actorName of movie.actor) {
      const slug = this.slugify(actorName);
      const actor = await this.prisma.actor.upsert({
        where: { slug },
        create: { name: actorName, slug },
        update: {},
      });
      actorIds.push(actor.id);
    }

    // Upsert directors
    const directorIds: string[] = [];
    for (const dirName of movie.director) {
      const slug = this.slugify(dirName);
      const director = await this.prisma.director.upsert({
        where: { slug },
        create: { name: dirName, slug },
        update: {},
      });
      directorIds.push(director.id);
    }

    // Upsert movie
    const movieData = {
      ophimId: movie._id,
      name: movie.name,
      slug: movie.slug,
      originName: movie.origin_name,
      content: movie.content?.replace(/<[^>]*>/g, '') || '',
      type: this.parseMovieType(movie.type),
      status: this.parseMovieStatus(movie.status),
      thumbUrl: this.buildImageUrl(movie.thumb_url),
      posterUrl: this.buildImageUrl(movie.poster_url),
      trailerUrl: movie.trailer_url || null,
      year: movie.year,
      quality: movie.quality,
      lang: movie.lang,
      time: movie.time,
      episodeCurrent: movie.episode_current,
      episodeTotal: movie.episode_total,
      isCopyright: movie.is_copyright,
      isPublished: movie.is_published,
      tmdbId: movie.tmdb?.id || null,
      tmdbRating: movie.tmdb?.vote_average || null,
      imdbId: movie.imdb?.id || null,
      imdbRating: movie.imdb?.vote_average || null,
    };

    const savedMovie = await this.prisma.movie.upsert({
      where: { ophimId: movie._id },
      create: movieData,
      update: movieData,
    });

    // Sync relations
    await this.prisma.movieGenre.deleteMany({ where: { movieId: savedMovie.id } });
    await this.prisma.movieCountry.deleteMany({ where: { movieId: savedMovie.id } });
    await this.prisma.movieActor.deleteMany({ where: { movieId: savedMovie.id } });
    await this.prisma.movieDirector.deleteMany({ where: { movieId: savedMovie.id } });

    // Deduplicate IDs to prevent SQLite batch unique constraint violations
    const uniqueGenreIds = [...new Set(genreIds)];
    const uniqueCountryIds = [...new Set(countryIds)];
    const uniqueActorIds = [...new Set(actorIds)];
    const uniqueDirectorIds = [...new Set(directorIds)];

    if (uniqueGenreIds.length) {
      await this.prisma.movieGenre.createMany({
        data: uniqueGenreIds.map((genreId) => ({ movieId: savedMovie.id, genreId })),
      });
    }

    if (uniqueCountryIds.length) {
      await this.prisma.movieCountry.createMany({
        data: uniqueCountryIds.map((countryId) => ({ movieId: savedMovie.id, countryId })),
      });
    }

    if (uniqueActorIds.length) {
      await this.prisma.movieActor.createMany({
        data: uniqueActorIds.map((actorId) => ({ movieId: savedMovie.id, actorId })),
      });
    }

    if (uniqueDirectorIds.length) {
      await this.prisma.movieDirector.createMany({
        data: uniqueDirectorIds.map((directorId) => ({ movieId: savedMovie.id, directorId })),
      });
    }

    // Sync episodes
    for (const server of episodes) {
      for (let i = 0; i < server.server_data.length; i++) {
        const ep = server.server_data[i];
        await this.prisma.episode.upsert({
          where: {
            movieId_serverName_slug: {
              movieId: savedMovie.id,
              serverName: server.server_name,
              slug: ep.slug,
            },
          },
          create: {
            movieId: savedMovie.id,
            serverName: server.server_name,
            name: ep.name,
            slug: ep.slug,
            filename: ep.filename,
            linkEmbed: ep.link_embed,
            linkM3u8: ep.link_m3u8,
            sortOrder: i,
          },
          update: {
            filename: ep.filename,
            linkEmbed: ep.link_embed,
            linkM3u8: ep.link_m3u8,
            sortOrder: i,
          },
        });
      }
    }

    this.logger.log(`Synced movie: ${movie.name} (${episodes.reduce((acc, s) => acc + s.server_data.length, 0)} episodes)`);
    return savedMovie.id;
  }

  async syncLatestMovies(pages = 3): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      throw new BadRequestException(
        'Hệ thống đang chạy đồng bộ phim ở nền, vui lòng không gửi yêu cầu trùng lặp.'
      );
    }

    this.isSyncing = true;
    this.logger.log(`Starting background sync for ${pages} pages`);

    // Detach and run in background without await
    this.runSyncLatest(pages).finally(() => {
      this.isSyncing = false;
      this.logger.log(`Finished background sync for ${pages} pages`);
    });

    return {
      success: true,
      message: 'Đã bắt đầu chạy đồng bộ phim ở nền. Bạn có thể tải lại trang sau ít phút để xem kết quả.',
    };
  }

  private async runSyncLatest(pages: number) {
    for (let page = 1; page <= pages; page++) {
      try {
        const list = await this.fetchMovieList(page);
        let skipped = 0;
        let synced = 0;

        for (const item of list.items) {
          try {
            if (item.modified?.time) {
              const existingMovie = await this.prisma.movie.findUnique({
                where: { slug: item.slug },
                select: { updatedAt: true },
              });

              if (existingMovie) {
                const apiModifiedTime = new Date(item.modified.time);
                // If our database movie has updatedAt >= apiModifiedTime, we skip it
                if (existingMovie.updatedAt >= apiModifiedTime) {
                  skipped++;
                  continue;
                }
              }
            }

            await this.syncMovie(item.slug);
            synced++;
          } catch (error) {
            this.logger.error(`Failed to sync ${item.slug}: ${error.message}`);
          }
        }

        this.logger.log(
          `Page ${page}/${pages} finished. Synced: ${synced}, Skipped: ${skipped}`,
        );

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        this.logger.error(`Failed to fetch movie list page ${page}: ${err.message}`);
      }
    }
  }
}
