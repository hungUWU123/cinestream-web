'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { searchAPI, moviesAPI } from '@/lib/api';
import MovieCard, { MovieCardSkeleton } from '@/components/movie/MovieCard';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import type { Movie, Genre, Country } from '@/types';

const years = Array.from({ length: 17 }, (_, i) => new Date().getFullYear() - i);

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const q = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const country = searchParams.get('country') || '';
  const year = searchParams.get('year') || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || '1');

  // Input states for form
  const [inputQ, setInputQ] = React.useState(q);
  const [showFilters, setShowFilters] = React.useState(true);

  // Sync state if URL search query changes
  React.useEffect(() => {
    setInputQ(q);
  }, [q]);

  // Fetch Genres & Countries for dropdowns
  const { data: genres = [] } = useQuery<Genre[]>({
    queryKey: ['genres'],
    queryFn: moviesAPI.getGenres,
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: moviesAPI.getCountries,
  });

  // Fetch Search Results
  const { data, isLoading, isFetching } = useQuery<{
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    source: 'local' | 'ophim';
  }>({
    queryKey: ['search', q, genre, country, year, type, status, page],
    queryFn: () =>
      searchAPI.search({
        q,
        genre,
        country,
        year: year ? Number(year) : undefined,
        type: type || undefined,
        status: status || undefined,
        page,
        limit: 24,
      }),
  });

  const updateFilters = (newParams: Record<string, string | number | undefined>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    
    // Page is always reset to 1 on filter changes unless page parameter is explicitly provided
    if (newParams.page === undefined) {
      nextParams.set('page', '1');
    }

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    router.push(`/search?${nextParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: inputQ.trim() });
  };

  const handleClearFilters = () => {
    setInputQ('');
    router.push('/search');
  };

  const results = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="container-main space-y-8">
        {/* Search header & input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">
              {status === 'UPCOMING' ? 'Phim Sắp Ra Mắt' : 'Tìm Kiếm Phim'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {status === 'UPCOMING'
                ? 'Danh sách phim sắp ra mắt được cập nhật liên tục'
                : 'Tìm phim yêu thích theo tên, thể loại hoặc quốc gia'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-sm font-semibold transition-colors self-start md:self-auto"
          >
            <SlidersHorizontal className="w-4 h-4 text-red-500" />
            <span>Bộ lọc</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Nhập tên phim, diễn viên..."
                  value={inputQ}
                  onChange={(e) => setInputQ(e.target.value)}
                  className="input-dark pl-10 py-2.5 w-full"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary px-6 rounded-xl font-bold flex items-center gap-2">
                Tìm kiếm
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {/* Type Filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Định dạng</label>
                <select
                  value={type}
                  onChange={(e) => updateFilters({ type: e.target.value })}
                  className="input-dark py-2 text-sm w-full select-dark"
                >
                  <option value="">Tất cả</option>
                  <option value="MOVIE">Phim lẻ</option>
                  <option value="SERIES">Phim bộ</option>
                </select>
              </div>

              {/* Genre Filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Thể loại</label>
                <select
                  value={genre}
                  onChange={(e) => updateFilters({ genre: e.target.value })}
                  className="input-dark py-2 text-sm w-full select-dark"
                >
                  <option value="">Tất cả thể loại</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Quốc gia</label>
                <select
                  value={country}
                  onChange={(e) => updateFilters({ country: e.target.value })}
                  className="input-dark py-2 text-sm w-full select-dark"
                >
                  <option value="">Tất cả quốc gia</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Năm phát hành</label>
                <select
                  value={year}
                  onChange={(e) => updateFilters({ year: e.target.value })}
                  className="input-dark py-2 text-sm w-full select-dark"
                >
                  <option value="">Tất cả năm</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Results grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Kết Quả Tìm Kiếm
              {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-red-500" />}
            </h2>
            {data?.source === 'ophim' && (
              <span className="badge badge-red text-[10px]">Đồng bộ trực tiếp OPhim</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-gray-400 text-sm">Không tìm thấy kết quả phù hợp. Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {results.map((movie: any, i) => {
                // If sourced directly from OPhim external API search
                // we convert formatting slightly to fit local Movie type
                const formattedMovie: Movie = {
                  id: movie.id || movie._id,
                  name: movie.name,
                  slug: movie.slug,
                  originName: movie.origin_name || movie.originName,
                  thumbUrl: movie.thumb_url || movie.thumbUrl,
                  posterUrl: movie.poster_url || movie.posterUrl,
                  year: movie.year,
                  type: movie.type === 'single' ? 'MOVIE' : 'SERIES',
                  status: 'COMPLETED',
                  isCopyright: false,
                  isPublished: true,
                  isFeatured: false,
                  viewCount: movie.viewCount || 0,
                  createdAt: movie.createdAt || '',
                  updatedAt: movie.updatedAt || '',
                };

                return <MovieCard key={formattedMovie.id} movie={formattedMovie} index={i} />;
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => updateFilters({ page: page - 1 })}
                className="btn btn-ghost bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-400 font-bold select-none">
                Trang {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => updateFilters({ page: page + 1 })}
                className="btn btn-ghost bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400">Đang tải...</span>
      </div>
    }>
      <SearchPageContent />
    </React.Suspense>
  );
}
