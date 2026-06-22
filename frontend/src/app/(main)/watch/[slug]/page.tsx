'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { moviesAPI, watchHistoryAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import HlsPlayer from '@/components/player/HlsPlayer';
import CommentSection from '@/components/movie/CommentSection';
import MovieRow from '@/components/movie/MovieRow';
import { Film, AlertCircle, List, ArrowLeft, Tv } from 'lucide-react';
import type { Movie, Episode } from '@/types';

function WatchPageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const epSlug = searchParams.get('ep');

  // 1. Fetch movie details
  const { data: movie, isLoading: isMovieLoading, error: movieError } = useQuery<Movie>({
    queryKey: ['movie', slug],
    queryFn: () => moviesAPI.getBySlug(slug),
  });

  const movieId = movie?.id;

  // 2. Fetch episodes
  const { data: episodes = [], isLoading: isEpisodesLoading } = useQuery<Episode[]>({
    queryKey: ['episodes', movieId],
    queryFn: () => moviesAPI.getEpisodes(movieId!),
    enabled: !!movieId,
  });

  // Find current episode
  const currentEpisode = React.useMemo(() => {
    if (episodes.length === 0) return null;
    if (!epSlug) return episodes[0];
    return episodes.find((e) => e.slug === epSlug) || episodes[0];
  }, [episodes, epSlug]);

  const episodeId = currentEpisode?.id;

  // 3. Fetch watch progress (history)
  const { data: progressData } = useQuery<{ progress: number }>({
    queryKey: ['watch-progress', movieId, episodeId],
    queryFn: () => watchHistoryAPI.getProgress(movieId!, episodeId),
    enabled: !!movieId && !!episodeId && isAuthenticated,
  });

  const initialProgress = progressData?.progress || 0;

  // 4. Fetch related movies
  const { data: relatedMovies = [], isLoading: isRelatedLoading } = useQuery<Movie[]>({
    queryKey: ['related-movies', movieId],
    queryFn: () => moviesAPI.getRelated(movieId!, 8),
    enabled: !!movieId,
  });

  if (isMovieLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center">
        <div className="skeleton w-full max-w-4xl aspect-video rounded-2xl mb-6" />
        <div className="skeleton h-8 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
    );
  }

  if (movieError || !movie) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center container-main">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Không tìm thấy phim</h1>
        <p className="text-gray-400 mb-6">Đường dẫn không chính xác hoặc phim không tồn tại.</p>
        <Link href="/" className="btn btn-primary px-6 py-3 rounded-xl font-bold">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  if (movie.status === 'UPCOMING') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center container-main">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-2 font-black">Phim chưa ra mắt</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          Phim này hiện sắp ra mắt và chưa có tập phát sóng. Vui lòng xem trailer ở trang chi tiết phim.
        </p>
        <Link href={`/movies/${movie.slug}`} className="btn btn-primary px-6 py-3 rounded-xl font-bold">
          Quay lại thông tin phim
        </Link>
      </div>
    );
  }

  // Group episodes by serverName
  const groupedEpisodes: Record<string, Episode[]> = {};
  episodes.forEach((ep) => {
    if (!groupedEpisodes[ep.serverName]) {
      groupedEpisodes[ep.serverName] = [];
    }
    groupedEpisodes[ep.serverName].push(ep);
  });

  return (
    <div className="min-h-screen bg-black pb-16 pt-6">
      <div className="container-main space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href={`/movies/${movie.slug}`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại thông tin phim
          </Link>
          {movie.type === 'SERIES' && currentEpisode && (
            <span className="text-sm font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              Đang xem: {currentEpisode.name}
            </span>
          )}
        </div>

        {/* Video Player & Episodes Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Player (Left 3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Play Area */}
            {episodes.length === 0 ? (
              <div className="w-full aspect-video rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Chưa có tập phim</h3>
                <p className="text-sm text-gray-400 max-w-sm">Phim này chưa cập nhật link stream.</p>
              </div>
            ) : currentEpisode?.linkM3u8 ? (
              <HlsPlayer
                src={currentEpisode.linkM3u8}
                movieId={movie.id}
                episodeId={currentEpisode.id}
                initialProgress={initialProgress}
              />
            ) : currentEpisode?.linkEmbed ? (
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                <iframe
                  src={currentEpisode.linkEmbed}
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Không có nguồn phát</h3>
                <p className="text-sm text-gray-400 max-w-sm">Liên kết xem phim này đã bị lỗi hoặc trống.</p>
              </div>
            )}

            {/* Movie Info */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-2xl font-bold text-white">{movie.name}</h1>
                {currentEpisode && (
                  <span className="text-lg font-bold text-red-500">
                    - {currentEpisode.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 font-medium">{movie.originName} ({movie.year})</p>
              {movie.content && (
                <p className="text-sm text-gray-300 leading-relaxed pt-2 line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                  {movie.content}
                </p>
              )}
            </div>

            {/* Comments */}
            <div className="pt-6">
              <CommentSection movieId={movie.id} />
            </div>
          </div>

          {/* Episode List Column (Right 1 col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                <List className="w-4 h-4 text-red-500" />
                Chọn Tập Phim
              </h3>

              {isEpisodesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 rounded-lg" />
                  ))}
                </div>
              ) : Object.keys(groupedEpisodes).length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Không có tập phim nào.</p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {Object.entries(groupedEpisodes).map(([serverName, eps]) => (
                    <div key={serverName} className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        {serverName}
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {eps.map((ep) => {
                          const isActive = currentEpisode?.id === ep.id;
                          return (
                            <Link
                              key={ep.id}
                              href={`/watch/${movie.slug}?ep=${ep.slug}`}
                              className={`px-2 py-1.5 text-center text-xs font-bold rounded-lg border transition-all truncate ${
                                isActive
                                  ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20'
                                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                              }`}
                              title={ep.name}
                            >
                              {ep.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related movies */}
        <div className="pt-12">
          {relatedMovies.length > 0 && (
            <MovieRow title="Đề xuất liên quan" movies={relatedMovies} loading={isRelatedLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center">
        <div className="skeleton w-full max-w-4xl aspect-video rounded-2xl mb-6" />
        <div className="skeleton h-8 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
    }>
      <WatchPageContent {...props} />
    </React.Suspense>
  );
}
