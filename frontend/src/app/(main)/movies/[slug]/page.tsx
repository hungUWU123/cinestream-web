'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesAPI, favoritesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/types';
import {
  Play,
  Heart,
  Calendar,
  Clock,
  Star,
  Film,
  Users,
  Eye,
  Tv,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import MovieRow from '@/components/movie/MovieRow';
import CommentSection from '@/components/movie/CommentSection';
import toast from 'react-hot-toast';
import type { Movie, Episode } from '@/types';

function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // 1. Fetch movie details
  const {
    data: movie,
    isLoading: isMovieLoading,
    error: movieError,
  } = useQuery<Movie>({
    queryKey: ['movie', slug],
    queryFn: () => moviesAPI.getBySlug(slug),
  });

  const movieId = movie?.id;

  // 2. Fetch episodes list
  const { data: episodes = [], isLoading: isEpisodesLoading } = useQuery<Episode[]>({
    queryKey: ['episodes', movieId],
    queryFn: () => moviesAPI.getEpisodes(movieId!),
    enabled: !!movieId,
  });

  // 3. Fetch related movies
  const { data: relatedMovies = [], isLoading: isRelatedLoading } = useQuery<Movie[]>({
    queryKey: ['related-movies', movieId],
    queryFn: () => moviesAPI.getRelated(movieId!, 8),
    enabled: !!movieId,
  });

  // 4. Check if favorite
  const { data: favoriteData, isLoading: isFavChecking } = useQuery<{ favorited: boolean }>({
    queryKey: ['favorite-check', movieId],
    queryFn: () => favoritesAPI.check(movieId!),
    enabled: !!movieId && isAuthenticated,
  });

  const isFavorite = favoriteData?.favorited || false;

  // 5. Toggle favorite mutation
  const toggleFavMutation = useMutation({
    mutationFn: () => favoritesAPI.toggle(movieId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['favorite-check', movieId], { favorited: data.favorited });
      toast.success(data.favorited ? 'Đã thêm vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích');
    },
    onError: () => {
      toast.error('Thực hiện thất bại');
    },
  });

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu phim yêu thích');
      return;
    }
    toggleFavMutation.mutate();
  };

  // State for member rating hover
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  // Fetch member's own rating
  const { data: myRatingData } = useQuery<{ rating: number | null }>({
    queryKey: ['my-rating', movieId],
    queryFn: () => moviesAPI.getMyRating(movieId!),
    enabled: !!movieId && isAuthenticated,
  });
  const myRating = myRatingData?.rating || 0;

  // Rate movie mutation
  const rateMutation = useMutation({
    mutationFn: (rating: number) => moviesAPI.rate(movieId!, rating),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movie', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-rating', movieId] });
      toast.success('Cảm ơn bạn đã đánh giá phim!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    },
  });

  const handleRate = (rating: number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá phim');
      return;
    }
    rateMutation.mutate(rating);
  };

  if (isMovieLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center">
        <div className="skeleton w-32 h-32 rounded-xl mb-4" />
        <div className="skeleton h-6 w-48 rounded mb-2" />
        <div className="skeleton h-4 w-64 rounded" />
      </div>
    );
  }

  if (movieError || !movie) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center container-main">
        <Film className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Không tìm thấy phim</h1>
        <p className="text-gray-400 mb-6">Phim này có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <Link href="/" className="btn btn-primary px-6 py-3 rounded-xl font-bold">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const rating =
    movie.tmdbRating && movie.tmdbRating > 0
      ? movie.tmdbRating.toFixed(1)
      : movie.imdbRating && movie.imdbRating > 0
      ? movie.imdbRating.toFixed(1)
      : null;

  // Group episodes by serverName
  const groupedEpisodes: Record<string, Episode[]> = {};
  episodes.forEach((ep) => {
    if (!groupedEpisodes[ep.serverName]) {
      groupedEpisodes[ep.serverName] = [];
    }
    groupedEpisodes[ep.serverName].push(ep);
  });

  // First episode link to watch
  const firstEpisode = episodes[0];
  const watchLink = firstEpisode
    ? `/watch/${movie.slug}?ep=${firstEpisode.slug}`
    : `/watch/${movie.slug}`;

  return (
    <div className="min-h-screen bg-black pb-16">
      {/* Backdrop Section */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src={getImageUrl(movie.posterUrl || movie.thumbUrl)}
          alt={movie.name}
          fill
          priority
          className="object-cover opacity-35 filter blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Main Info Section */}
      <div className="container-main relative -mt-36 md:-mt-48 z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Column: Poster & Quick actions */}
          <div className="md:col-span-1 space-y-4">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-900">
              <Image
                src={getImageUrl(movie.thumbUrl || movie.posterUrl)}
                alt={movie.name}
                fill
                sizes="(max-width: 768px) 100vw, 250px"
                className="object-cover"
                priority
              />
            </div>

            {/* Watch button */}
            <Link
              href={watchLink}
              className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 hover:scale-[1.02] transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              Xem Phim
            </Link>

            {/* Favorite toggle button */}
            <button
              onClick={handleFavoriteClick}
              disabled={toggleFavMutation.isPending}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                isFavorite
                  ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
              {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
            </button>
          </div>

          {/* Right Column: Title and Details */}
          <div className="md:col-span-3 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                {movie.name}
              </h1>
              <p className="text-lg md:text-xl text-gray-400 font-medium">
                {movie.originName}
              </p>
            </div>

            {/* Badges / Meta */}
            <div className="flex flex-wrap items-center gap-3">
              {movie.quality && <span className="badge badge-red font-semibold">{movie.quality}</span>}
              {movie.lang && <span className="badge badge-glass font-semibold">{movie.lang}</span>}
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{movie.year}</span>
              </div>
              {movie.time && (
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{movie.time}</span>
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-sm font-bold">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <span>{rating}</span>
                </div>
              )}
              {movie.viewCount > 0 && (
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{movie.viewCount.toLocaleString()} lượt xem</span>
                </div>
              )}
            </div>

            {/* Member Rating Widget */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Đánh giá từ thành viên</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-6 h-6 fill-yellow-500" />
                      <span className="text-2xl font-black ml-1">
                        {movie.userRatingAvg ? movie.userRatingAvg.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-gray-500 text-sm font-medium">/10</span>
                    </div>
                    <span className="text-gray-400 text-xs mt-1">
                      ({movie.userRatingCount || 0} lượt đánh giá)
                    </span>
                  </div>
                </div>

                {/* Star selection widget */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-left md:text-left">
                    {myRating > 0 ? `Đánh giá của bạn: ${myRating}/10 ★` : 'Chưa đánh giá. Hãy chọn sao:'}
                  </span>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
                    {Array.from({ length: 10 }).map((_, index) => {
                      const starValue = index + 1;
                      const isHighlighted = hoverRating !== null ? starValue <= hoverRating : starValue <= myRating;
                      return (
                        <button
                          key={starValue}
                          onClick={() => handleRate(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          className="focus:outline-none transition-all duration-150 hover:scale-125"
                          title={`Chấm ${starValue}/10 sao`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              isHighlighted
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-600 hover:text-yellow-500'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Movie Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-sm">
              <div>
                <span className="text-gray-500 block mb-0.5">Thể loại</span>
                <span className="text-white font-medium">
                  {movie.genres?.map((g) => g.genre.name).join(', ') || 'Chưa cập nhật'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">Quốc gia</span>
                <span className="text-white font-medium">
                  {movie.countries?.map((c) => c.country.name).join(', ') || 'Chưa cập nhật'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">Trạng thái</span>
                <span className="text-white font-medium">
                  {movie.status === 'COMPLETED'
                    ? 'Hoàn thành'
                    : movie.status === 'ONGOING'
                    ? 'Đang phát sóng'
                    : 'Sắp ra mắt'}
                </span>
              </div>
              {movie.type === 'SERIES' && (
                <div>
                  <span className="text-gray-500 block mb-0.5">Số tập</span>
                  <span className="text-white font-medium">
                    {movie.episodeCurrent || '1'} / {movie.episodeTotal || '??'} tập
                  </span>
                </div>
              )}
            </div>

            {/* Synopsis */}
            {movie.content && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Nội dung phim</h3>
                <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                  {movie.content}
                </p>
              </div>
            )}

            {/* Trailer embed if exists */}
            {movie.trailerUrl && getYoutubeEmbedUrl(movie.trailerUrl) && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Trailer</h3>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/5 bg-zinc-950">
                  <iframe
                    src={getYoutubeEmbedUrl(movie.trailerUrl)!}
                    title="YouTube trailer"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EPISODE LIST (Grouped by Server) */}
        <div className="mt-12 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Tv className="w-5 h-5 text-red-500" />
            Danh Sách Tập Phim
          </h3>

          {isEpisodesLoading ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : Object.keys(groupedEpisodes).length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              Chưa có tập phim nào được tải lên cho phim này.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEpisodes).map(([serverName, eps]) => (
                <div key={serverName} className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    Server: <span className="text-red-500 font-bold">{serverName}</span>
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {eps.map((ep) => (
                      <Link
                        key={ep.id}
                        href={`/watch/${movie.slug}?ep=${ep.slug}`}
                        className="px-3 py-2 text-center text-sm font-semibold rounded-lg bg-white/5 border border-white/5 hover:bg-red-600 hover:border-red-600 text-gray-300 hover:text-white transition-all truncate"
                        title={ep.name}
                      >
                        {ep.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RELATED MOVIES ROW */}
        <div className="mt-16">
          {relatedMovies.length > 0 && (
            <MovieRow title="Có Thể Bạn Cũng Thích" movies={relatedMovies} loading={isRelatedLoading} />
          )}
        </div>

        {/* COMMENT SECTION */}
        <div className="mt-16 max-w-4xl">
          <CommentSection movieId={movie.id} />
        </div>
      </div>
    </div>
  );
}
