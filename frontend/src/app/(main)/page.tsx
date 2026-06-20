'use client';

import { useQuery } from '@tanstack/react-query';
import { moviesAPI } from '@/lib/api';
import MovieHero from '@/components/movie/MovieHero';
import MovieRow from '@/components/movie/MovieRow';
import { Film, TrendingUp, Sparkles, RefreshCw, Tv, Clapperboard, Gamepad2 } from 'lucide-react';
import type { Movie } from '@/types';

export default function HomePage() {
  // Query featured movies
  const { data: featuredMovies = [], isLoading: isFeaturedLoading, error: featuredError } = useQuery<Movie[]>({
    queryKey: ['movies', 'featured'],
    queryFn: () => moviesAPI.getFeatured(12),
  });

  // Query trending movies (Phim mới thịnh hành)
  const { data: trendingMovies = [], isLoading: isTrendingLoading } = useQuery<Movie[]>({
    queryKey: ['movies', 'trending'],
    queryFn: () => moviesAPI.getTrending(12),
  });

  // Query Phim lẻ mới cập nhật
  const { data: singleMoviesResponse, isLoading: isSingleLoading } = useQuery<any>({
    queryKey: ['movies', 'single-new'],
    queryFn: () => moviesAPI.getAll({ type: 'MOVIE', limit: 12 }),
  });
  const singleMovies = singleMoviesResponse?.data || [];

  // Query Phim bộ mới cập nhật
  const { data: seriesMoviesResponse, isLoading: isSeriesLoading } = useQuery<any>({
    queryKey: ['movies', 'series-new'],
    queryFn: () => moviesAPI.getAll({ type: 'SERIES', limit: 12 }),
  });
  const seriesMovies = seriesMoviesResponse?.data || [];

  // Query Phim chiếu rạp mới
  const { data: cinemaMoviesResponse, isLoading: isCinemaLoading } = useQuery<any>({
    queryKey: ['movies', 'cinema-new'],
    queryFn: () => moviesAPI.getAll({ genre: 'phim-chieu-rap', limit: 12 }),
  });
  const cinemaMovies = cinemaMoviesResponse?.data || [];

  // Query Phim hoạt hình & anime
  const { data: animeMoviesResponse, isLoading: isAnimeLoading } = useQuery<any>({
    queryKey: ['movies', 'anime-new'],
    queryFn: () => moviesAPI.getAll({ genre: 'hoat-hinh', limit: 12 }),
  });
  const animeMovies = animeMoviesResponse?.data || [];

  // Select the first featured movie for the hero banner, fallback to first trending, first single, or null
  const heroMovie = featuredMovies[0] || trendingMovies[0] || singleMovies[0] || seriesMovies[0] || null;

  const showFallbackBanner = 
    !isFeaturedLoading && 
    !isTrendingLoading && 
    !isSingleLoading && 
    !isSeriesLoading && 
    !heroMovie;

  return (
    <div className="min-h-screen bg-black pb-12">
      {/* Hero Banner Section */}
      {isFeaturedLoading ? (
        <div className="w-full h-[85vh] md:h-[90vh] skeleton flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
            <span className="text-gray-400 text-sm">Đang tải phim nổi bật...</span>
          </div>
        </div>
      ) : featuredMovies.length > 0 ? (
        <MovieHero movies={featuredMovies} />
      ) : heroMovie ? (
        <MovieHero movie={heroMovie} />
      ) : null}

      {/* Fallback state when there are no movies synced in the database */}
      {showFallbackBanner && (
        <div className="relative w-full h-[60vh] flex flex-col items-center justify-center text-center container-main px-4 bg-gradient-to-b from-red-950/20 to-black rounded-3xl mt-6 border border-white/5">
          <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6">
            <Film className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Chưa có phim trong hệ thống</h1>
          <p className="text-gray-400 max-w-md mb-8">
            Hệ thống xem phim CineStream đã khởi tạo thành công nhưng chưa được đồng bộ phim từ OPhim. Vui lòng truy cập trang quản trị để bắt đầu đồng bộ.
          </p>
          <div className="flex gap-4">
            <a href="/admin" className="btn btn-primary px-6 py-3 rounded-xl font-bold">
              Trang Quản Trị
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-ghost border border-white/10 hover:bg-white/5 px-6 py-3 rounded-xl font-bold"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )}

      {/* Movie Rows */}
      <div className="container-main relative z-20 -mt-10 md:-mt-20 space-y-6">
        {/* Featured Movies */}
        {(isFeaturedLoading || featuredMovies.length > 0) && (
          <MovieRow
            title="Phim Nổi Bật"
            movies={featuredMovies}
            loading={isFeaturedLoading}
            icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
          />
        )}

        {/* Phim Mới Thịnh Hành */}
        {(isTrendingLoading || trendingMovies.length > 0) && (
          <MovieRow
            title="PHIM MỚI THỊNH HÀNH"
            movies={trendingMovies}
            loading={isTrendingLoading}
            icon={<TrendingUp className="w-5 h-5 text-red-500" />}
            viewAllLink="/search?sort=trending"
          />
        )}

        {/* Phim Lẻ Mới Cập Nhật */}
        {(isSingleLoading || singleMovies.length > 0) && (
          <MovieRow
            title="PHIM LẺ MỚI CẬP NHẬT"
            movies={singleMovies}
            loading={isSingleLoading}
            icon={<Film className="w-5 h-5 text-blue-500" />}
            viewAllLink="/search?type=MOVIE"
          />
        )}

        {/* Phim Bộ Mới Cập Nhật */}
        {(isSeriesLoading || seriesMovies.length > 0) && (
          <MovieRow
            title="PHIM BỘ MỚI CẬP NHẬT"
            movies={seriesMovies}
            loading={isSeriesLoading}
            icon={<Tv className="w-5 h-5 text-green-500" />}
            viewAllLink="/search?type=SERIES"
          />
        )}

        {/* Phim Chiếu Rạp Mới */}
        {(isCinemaLoading || cinemaMovies.length > 0) && (
          <MovieRow
            title="PHIM CHIẾU RẠP MỚI"
            movies={cinemaMovies}
            loading={isCinemaLoading}
            icon={<Clapperboard className="w-5 h-5 text-purple-500" />}
            viewAllLink="/search?genre=phim-chieu-rap"
          />
        )}

        {/* Phim Hoạt Hình & Anime */}
        {(isAnimeLoading || animeMovies.length > 0) && (
          <MovieRow
            title="PHIM HOẠT HÌNH & ANIME"
            movies={animeMovies}
            loading={isAnimeLoading}
            icon={<Gamepad2 className="w-5 h-5 text-pink-500" />}
            viewAllLink="/search?genre=hoat-hinh"
          />
        )}
      </div>
    </div>
  );
}
