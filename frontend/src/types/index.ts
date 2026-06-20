// ============================================================
// TypeScript Types for CineStream
// ============================================================

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  _count?: {
    favorites: number;
    watchHistories: number;
    comments: number;
  };
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Country {
  id: string;
  name: string;
  slug: string;
}

export interface Actor {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
}

export interface Director {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
}

export interface Episode {
  id: string;
  movieId: string;
  serverName: string;
  name: string;
  slug: string;
  filename?: string;
  linkEmbed?: string;
  linkM3u8?: string;
  sortOrder: number;
}

export interface Movie {
  id: string;
  name: string;
  slug: string;
  originName: string;
  content?: string;
  type: 'MOVIE' | 'SERIES';
  status: 'ONGOING' | 'COMPLETED' | 'UPCOMING';
  thumbUrl: string;
  posterUrl: string;
  trailerUrl?: string;
  year: number;
  quality?: string;
  lang?: string;
  time?: string;
  episodeCurrent?: string;
  episodeTotal?: string;
  isCopyright: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  tmdbId?: string;
  tmdbRating?: number;
  imdbId?: string;
  imdbRating?: number;
  userRatingAvg?: number;
  userRatingCount?: number;
  createdAt: string;
  updatedAt: string;
  genres?: { genre: Genre }[];
  countries?: { country: Country }[];
  actors?: { actor: Actor }[];
  directors?: { director: Director }[];
  _count?: {
    episodes: number;
    comments: number;
    favorites: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  movieId: string;
  userId: string;
  parentId?: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'role'>;
  replies?: Comment[];
  _count?: { likes: number; replies: number };
}

export interface WatchHistory {
  id: string;
  userId: string;
  movieId: string;
  episodeId?: string;
  progress: number;
  duration: number;
  watchedAt: string;
  movie: Movie;
  episode?: Episode;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

// OPhim API types (for direct pass-through)
export interface OPhimMovie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
}

export const IMAGE_CDN = process.env.NEXT_PUBLIC_OPHIM_IMAGE_CDN || 'https://img.ophim.live/uploads/movies';

export function getImageUrl(url?: string): string {
  if (!url) return '/placeholder-movie.jpg';
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `${IMAGE_CDN}/${url}`;
}

export function getAvatarUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const backendBase = apiURL.replace('/api', '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}
