import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/types/enums';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [movies, users, comments, totalViews, pendingReports] = await Promise.all([
      this.prisma.movie.count(),
      this.prisma.user.count(),
      this.prisma.comment.count(),
      this.prisma.movie.aggregate({ _sum: { viewCount: true } }),
      this.prisma.report.count({ where: { isHandled: false } }),
    ]);

    // Top 5 trending movies
    const trending = await this.prisma.movie.findMany({
      take: 5,
      orderBy: { viewCount: 'desc' },
      select: { id: true, name: true, slug: true, thumbUrl: true, viewCount: true },
    });

    // Recently added movies
    const recentMovies = await this.prisma.movie.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, thumbUrl: true, createdAt: true },
    });

    // Recent users
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true },
    });

    return {
      movies,
      users,
      comments,
      pendingReports,
      totalViews: totalViews._sum.viewCount || 0,
      trending,
      recentMovies,
      recentUsers,
    };
  }

  async getAllMovies(page = 1, limit = 10, q?: string, isFeatured?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { originName: { contains: q } },
        { slug: { contains: q } },
      ];
    }

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

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { comments: true, favorites: true } },
        },
      }),
    ]);
    return { data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateUserRole(userId: string, role: Role) {
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async getAllComments(page = 1, limit = 20, showHidden = false) {
    const skip = (page - 1) * limit;
    const where = showHidden ? {} : { isHidden: false };
    const [total, comments] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true } },
          movie: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    return { data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async hideComment(commentId: string) {
    return this.prisma.comment.update({ where: { id: commentId }, data: { isHidden: true } });
  }

  async deleteComment(commentId: string) {
    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  async setFeatured(movieId: string, isFeatured: boolean) {
    return this.prisma.movie.update({ where: { id: movieId }, data: { isFeatured } });
  }

  async toggleMoviePublished(movieId: string) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new Error('Movie not found');
    return this.prisma.movie.update({
      where: { id: movieId },
      data: { isPublished: !movie.isPublished },
    });
  }

  async deleteMovie(movieId: string) {
    return this.prisma.movie.delete({ where: { id: movieId } });
  }

  async getReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, reports] = await Promise.all([
      this.prisma.report.count({ where: { isHandled: false } }),
      this.prisma.report.findMany({
        where: { isHandled: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          comment: {
            include: {
              user: { select: { id: true, username: true } },
              movie: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);
    return { data: reports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async handleReport(reportId: string) {
    return this.prisma.report.update({ where: { id: reportId }, data: { isHandled: true } });
  }
}
