'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moviesAPI } from '@/lib/api';
import { useTvNavigation } from '@/hooks/useTvNavigation';
import TvHlsPlayer from '@/components/player/TvHlsPlayer';
import { Film, TrendingUp, Sparkles, Tv, Clapperboard, Calendar, Search, Home, Heart, Play, Info, X } from 'lucide-react';
import type { Movie } from '@/types';
import toast from 'react-hot-toast';

export default function TvPage() {
  // 1. Fetch movie rows (similar to home page)
  const { data: featuredMovies = [], isLoading: isFeaturedLoading } = useQuery<Movie[]>({
    queryKey: ['movies', 'featured'],
    queryFn: () => moviesAPI.getFeatured(12),
  });

  const { data: trendingMovies = [], isLoading: isTrendingLoading } = useQuery<Movie[]>({
    queryKey: ['movies', 'trending'],
    queryFn: () => moviesAPI.getTrending(12),
  });

  const { data: singleMoviesResponse, isLoading: isSingleLoading } = useQuery<any>({
    queryKey: ['movies', 'single-new'],
    queryFn: () => moviesAPI.getAll({ type: 'MOVIE', limit: 12 }),
  });
  const singleMovies = singleMoviesResponse?.data || [];

  const { data: seriesMoviesResponse, isLoading: isSeriesLoading } = useQuery<any>({
    queryKey: ['movies', 'series-new'],
    queryFn: () => moviesAPI.getAll({ type: 'SERIES', limit: 12 }),
  });
  const seriesMovies = seriesMoviesResponse?.data || [];

  const { data: upcomingMoviesResponse, isLoading: isUpcomingLoading } = useQuery<any>({
    queryKey: ['movies', 'upcoming'],
    queryFn: () => moviesAPI.getAll({ status: 'UPCOMING', limit: 12 }),
  });
  const upcomingMovies = upcomingMoviesResponse?.data || [];

  // Group all categories for easy indexing with explicit type
  const rows: { title: string; icon: ReactNode; movies: Movie[]; loading: boolean }[] = [
    { title: 'Phim Nổi Bật', icon: <Sparkles className="w-5 h-5 text-yellow-500" />, movies: featuredMovies, loading: isFeaturedLoading },
    { title: 'Phim Thịnh Hành', icon: <TrendingUp className="w-5 h-5 text-red-500" />, movies: trendingMovies, loading: isTrendingLoading },
    { title: 'Phim Lẻ Mới', icon: <Film className="w-5 h-5 text-blue-500" />, movies: singleMovies, loading: isSingleLoading },
    { title: 'Phim Bộ Mới', icon: <Tv className="w-5 h-5 text-green-500" />, movies: seriesMovies, loading: isSeriesLoading },
    { title: 'Phim Sắp Ra Mắt', icon: <Calendar className="w-5 h-5 text-yellow-500 animate-pulse" />, movies: upcomingMovies, loading: isUpcomingLoading },
  ].filter(row => row.loading || row.movies.length > 0);

  const heroMovie = featuredMovies[0] || trendingMovies[0] || singleMovies[0] || null;

  // 2. Spatial Navigation Hook Setup
  const rowLengths = rows.map(r => r.movies.length);
  const {
    zone,
    setZone,
    sidebarIdx,
    setSidebarIdx,
    gridRow,
    setGridRow,
    gridCol,
    setGridCol,
    modalIdx,
    setModalIdx,
    isModalOpen,
    openModal,
    closeModal,
  } = useTvNavigation({
    sidebarCount: 3, // Search, Home, Favorites
    rowCount: rows.length,
    rowLengths,
    modalButtonsCount: 2, // Default buttons count, overridden dynamically for series
    initialZone: 'hero',
  });

  // Modal and playback states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isFetchingEpisodes, setIsFetchingEpisodes] = useState(false);
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState(0);
  const [activePlayback, setActivePlayback] = useState<{ src: string; episodeId: string } | null>(null);

  // Refs for auto-scrolling focused items
  const activeItemRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);
  const activeSidebarItemRef = useRef<HTMLDivElement>(null);
  const activeHeroBtnRef = useRef<HTMLButtonElement>(null);
  const activeModalBtnRef = useRef<HTMLButtonElement>(null);
  const activeEpisodeItemRef = useRef<HTMLDivElement>(null);

  // Fetch episodes when a movie is selected
  useEffect(() => {
    if (!selectedMovie) return;
    setIsFetchingEpisodes(true);
    moviesAPI.getEpisodes(selectedMovie.id)
      .then((data) => {
        setEpisodes(data || []);
        setSelectedEpisodeIdx(0);
      })
      .catch((err) => {
        console.error('Error fetching episodes on TV:', err);
        toast.error('Không thể tải danh sách tập phim');
      })
      .finally(() => {
        setIsFetchingEpisodes(false);
      });
  }, [selectedMovie]);

  // Handle D-pad selection (Enter / OK button)
  useEffect(() => {
    const handleOK = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (activePlayback) return; // Player is active, let TvHlsPlayer handle it

      if (zone === 'sidebar') {
        e.preventDefault();
        if (sidebarIdx === 0) {
          window.location.href = '/search';
        } else if (sidebarIdx === 1) {
          setZone('hero');
        } else if (sidebarIdx === 2) {
          window.location.href = '/profile/favorites';
        }
      } else if (zone === 'hero') {
        e.preventDefault();
        if (heroMovie) {
          setSelectedMovie(heroMovie);
          openModal();
        }
      } else if (zone === 'grid') {
        e.preventDefault();
        const activeMovie = rows[gridRow]?.movies[gridCol];
        if (activeMovie) {
          setSelectedMovie(activeMovie);
          openModal();
        }
      }
    };

    window.addEventListener('keydown', handleOK);
    return () => {
      window.removeEventListener('keydown', handleOK);
    };
  }, [zone, sidebarIdx, gridRow, gridCol, rows, heroMovie, openModal, activePlayback, setZone]);

  // Modal Custom D-pad navigation logic (override for episode navigation)
  useEffect(() => {
    if (zone !== 'modal' || !selectedMovie) return;

    const handleModalKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (episodes.length > 0) {
          setSelectedEpisodeIdx((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (episodes.length > 0) {
          setSelectedEpisodeIdx((prev) => Math.min(episodes.length - 1, prev + 1));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Play selected episode / trailer
        if (selectedMovie.status === 'UPCOMING') {
          if (selectedMovie.trailerUrl) {
            setActivePlayback({ src: selectedMovie.trailerUrl, episodeId: 'trailer' });
          } else {
            toast.error('Phim chưa ra mắt và không có trailer');
          }
        } else if (episodes.length > 0) {
          const ep = episodes[selectedEpisodeIdx];
          if (ep?.linkM3u8) {
            setActivePlayback({ src: ep.linkM3u8, episodeId: ep.id });
          } else {
            toast.error('Link video tập phim không hợp lệ');
          }
        }
      }
    };

    window.addEventListener('keydown', handleModalKeys);
    return () => {
      window.removeEventListener('keydown', handleModalKeys);
    };
  }, [zone, selectedMovie, episodes, selectedEpisodeIdx]);

  // Auto-scroll logic when focus changes
  useEffect(() => {
    if (zone === 'grid' && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } else if (zone === 'sidebar' && activeSidebarItemRef.current) {
      activeSidebarItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    } else if (zone === 'hero' && activeHeroBtnRef.current) {
      activeHeroBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } else if (zone === 'modal' && activeEpisodeItemRef.current) {
      activeEpisodeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [zone, gridRow, gridCol, sidebarIdx, selectedEpisodeIdx]);

  return (
    <div className="min-h-screen bg-[#070708] text-white flex overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <div
        className={`bg-[#0c0c0e]/95 border-r border-white/5 flex flex-col justify-between py-8 px-4 transition-all duration-300 z-30 select-none ${
          zone === 'sidebar' ? 'w-64 shadow-2xl shadow-black' : 'w-20'
        }`}
      >
        <div className="space-y-12">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            {zone === 'sidebar' && (
              <span className="text-xl font-black text-white tracking-tight animate-fadeIn">
                Hùng<span className="text-red-500">Cinema</span>
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-4">
            {[
              { id: 0, label: 'Tìm kiếm', icon: <Search className="w-5 h-5" /> },
              { id: 1, label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
              { id: 2, label: 'Yêu thích', icon: <Heart className="w-5 h-5" /> },
            ].map(item => {
              const isFocused = zone === 'sidebar' && sidebarIdx === item.id;
              return (
                <div
                  key={item.id}
                  ref={isFocused ? activeSidebarItemRef : null}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isFocused
                      ? 'bg-red-600 text-white font-bold scale-105 shadow-lg shadow-red-600/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {zone === 'sidebar' && <span className="text-sm animate-fadeIn">{item.label}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        {zone === 'sidebar' && (
          <div className="text-[10px] text-gray-500 px-4 leading-normal animate-fadeIn">
            © 2026 HùngCinema.<br />Giao diện tối ưu TV/Máy chiếu.
          </div>
        )}
      </div>

      {/* 2. Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative pb-16">
        {/* Banner section */}
        {heroMovie && (
          <div className="relative h-[65vh] w-full flex items-end select-none">
            {/* Background image & gradient overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={heroMovie.posterUrl}
                alt={heroMovie.name}
                className="w-full h-full object-cover object-top opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/40 to-transparent" />
              <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-[#070708] to-transparent" />
            </div>

            {/* Banner details */}
            <div className="relative z-10 p-12 max-w-2xl space-y-4">
              <span className="bg-red-600/20 text-red-500 border border-red-500/20 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                Phim đề cử nổi bật
              </span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow">
                {heroMovie.name}
              </h1>
              <p className="text-xs text-gray-400 font-semibold uppercase">
                {heroMovie.originName} • {heroMovie.year}
              </p>
              <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed drop-shadow-sm">
                {heroMovie.content || 'Chưa có tóm tắt chi tiết cho phim này.'}
              </p>

              <div className="pt-4">
                <button
                  ref={zone === 'hero' ? activeHeroBtnRef : null}
                  className={`flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                    zone === 'hero'
                      ? 'bg-white text-black scale-105 shadow-xl shadow-white/10'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Xem Chi Tiết</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Rows */}
        <div className="px-12 -mt-12 space-y-10 relative z-10 select-none">
          {rows.map((row, rIdx) => {
            const isRowActive = zone === 'grid' && gridRow === rIdx;
            return (
              <div key={row.title} ref={isRowActive ? activeRowRef : null} className="space-y-4">
                <div className="flex items-center gap-2">
                  {row.icon}
                  <h2 className="text-lg font-extrabold tracking-wider uppercase text-white/95">
                    {row.title}
                  </h2>
                </div>

                {/* Horizontal scroll track */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
                  {row.movies.map((movie, mIdx) => {
                    const isFocused = zone === 'grid' && gridRow === rIdx && gridCol === mIdx;
                    return (
                      <div
                        key={movie.id}
                        ref={isFocused ? activeItemRef : null}
                        className={`flex-shrink-0 w-44 aspect-[2/3] rounded-2xl overflow-hidden relative border transition-all duration-300 ${
                          isFocused
                            ? 'border-red-500 scale-108 shadow-xl shadow-red-600/10 z-20'
                            : 'border-white/5 opacity-80'
                        }`}
                      >
                        <img
                          src={movie.thumbUrl}
                          alt={movie.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Shadow mask */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                          <span className="text-xs font-bold text-white line-clamp-1 leading-normal">
                            {movie.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Netflix-style TV Detail Modal */}
      {isModalOpen && selectedMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-8 select-none">
          <div className="bg-[#0c0c0e] w-full max-w-4xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row h-[75vh]">
            {/* Left Image Info */}
            <div className="w-full md:w-1/3 relative h-1/3 md:h-full">
              <img
                src={selectedMovie.thumbUrl}
                alt={selectedMovie.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent" />
            </div>

            {/* Right details / Episodes list */}
            <div className="flex-1 p-8 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2 max-h-[50vh]">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedMovie.name}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {selectedMovie.originName} • {selectedMovie.year}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed font-light">
                  {selectedMovie.content || 'Không có mô tả nội dung.'}
                </p>

                {/* Episodes area */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">
                    {selectedMovie.status === 'UPCOMING' ? 'Đoạn phim / Trailer' : 'Danh sách tập phim'}
                  </h3>

                  {isFetchingEpisodes ? (
                    <div className="text-sm text-gray-400 animate-pulse">Đang tải tập phim...</div>
                  ) : selectedMovie.status === 'UPCOMING' ? (
                    selectedMovie.trailerUrl ? (
                      <div
                        ref={activeEpisodeItemRef}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                          zone === 'modal'
                            ? 'bg-red-600 text-white border-red-500 scale-102'
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <span>Xem Trailer phim</span>
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Phim chưa ra mắt và không có trailer.</div>
                    )
                  ) : episodes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                      {episodes.map((ep, idx) => {
                        const isFocused = zone === 'modal' && selectedEpisodeIdx === idx;
                        return (
                          <div
                            key={ep.id}
                            ref={isFocused ? activeEpisodeItemRef : null}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                              isFocused
                                ? 'bg-red-600 text-white border-red-500 scale-102'
                                : 'bg-white/5 border-white/5 text-gray-300'
                            }`}
                          >
                            <span className="line-clamp-1">{ep.name || `Tập ${idx + 1}`}</span>
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Chưa có liên kết phát phim.</div>
                  )}
                </div>
              </div>

              {/* Instructions helper */}
              <div className="pt-4 border-t border-white/5 text-[10px] text-gray-500 flex justify-between items-center select-none">
                <span>Dùng phím Lên/Xuống trên remote để chuyển tập, Enter để xem.</span>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 text-white font-bold text-xs border border-white/10"
                >
                  Đóng (Back)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Hls Player Overlay */}
      {activePlayback && selectedMovie && (
        <TvHlsPlayer
          src={activePlayback.src}
          movieId={selectedMovie.id}
          episodeId={activePlayback.episodeId}
          onClose={() => setActivePlayback(null)}
        />
      )}
    </div>
  );
}
