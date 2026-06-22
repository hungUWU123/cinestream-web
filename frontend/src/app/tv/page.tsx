'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moviesAPI, searchAPI, favoritesAPI, authAPI } from '@/lib/api';
import { useTvNavigation } from '@/hooks/useTvNavigation';
import { useAuthStore } from '@/store/auth.store';
import TvHlsPlayer from '@/components/player/TvHlsPlayer';
import { Film, TrendingUp, Sparkles, Tv, Clapperboard, Calendar, Search, Home, Heart, Play, Info, X, LogIn, LogOut, Loader2, RefreshCw, XCircle } from 'lucide-react';
import type { Movie } from '@/types';
import toast from 'react-hot-toast';

const KEYBOARD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3'],
  ['4', '5', '6', '7', '8', '9', 'SPACE', 'BACKSPACE', 'CLEAR']
];

export default function TvPage() {
  const { isAuthenticated, logout } = useAuthStore();
  const [sidebarIdx, setSidebarIdx] = useState(1);

  // 1. Fetch default movie rows for Home View
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

  // 2. TV Search States & Query
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResponse, isLoading: isSearching } = useQuery<any>({
    queryKey: ['tv-search', searchQuery],
    queryFn: () => searchAPI.search({ q: searchQuery, limit: 18 }),
    enabled: searchQuery.trim().length > 0,
  });
  const searchResults = searchResponse?.data || [];

  // 3. TV Favorites Query
  const { data: favoritesResponse, isLoading: isFavoritesLoading } = useQuery<any>({
    queryKey: ['tv-favorites'],
    queryFn: () => favoritesAPI.getAll(1),
    enabled: isAuthenticated,
  });
  const favoriteMovies = favoritesResponse?.data?.map((f: any) => f.movie).filter(Boolean) || [];

  // 4. Dynamic category rows mapping based on Sidebar Menu active state
  const getTvRows = (currentSidebarIdx: number): { title: string; icon: ReactNode; movies: Movie[]; loading: boolean }[] => {
    // SEARCH View
    if (currentSidebarIdx === 0) {
      return [
        {
          title: searchQuery.trim() ? `Kết quả tìm kiếm cho: "${searchQuery}"` : 'Nhập từ khóa tìm kiếm để xem danh sách',
          icon: <Search className="w-5 h-5 text-red-500" />,
          movies: (searchResults || []).filter(Boolean),
          loading: isSearching,
        },
      ];
    }
    // FAVORITES View
    if (currentSidebarIdx === 2) {
      return [
        {
          title: 'Danh sách phim yêu thích',
          icon: <Heart className="w-5 h-5 text-red-500 fill-red-600/30" />,
          movies: (favoriteMovies || []).filter(Boolean),
          loading: isFavoritesLoading,
        },
      ];
    }
    // HOME View
    return [
      { title: 'Phim Nổi Bật', icon: <Sparkles className="w-5 h-5 text-yellow-500" />, movies: (featuredMovies || []).filter(Boolean), loading: isFeaturedLoading },
      { title: 'Phim Thịnh Hành', icon: <TrendingUp className="w-5 h-5 text-red-500" />, movies: (trendingMovies || []).filter(Boolean), loading: isTrendingLoading },
      { title: 'Phim Lẻ Mới', icon: <Film className="w-5 h-5 text-blue-500" />, movies: (singleMovies || []).filter(Boolean), loading: isSingleLoading },
      { title: 'Phim Bộ Mới', icon: <Tv className="w-5 h-5 text-green-500" />, movies: (seriesMovies || []).filter(Boolean), loading: isSeriesLoading },
      { title: 'Phim Sắp Ra Mắt', icon: <Calendar className="w-5 h-5 text-yellow-500 animate-pulse" />, movies: (upcomingMovies || []).filter(Boolean), loading: isUpcomingLoading },
    ].filter(row => row.loading || row.movies.length > 0);
  };

  const rows = getTvRows(sidebarIdx);
  const rowLengths = rows.map(r => r.movies.length);

  // 5. Spatial Navigation Hook Setup
  const {
    zone,
    setZone,
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
    sidebarCount: isAuthenticated ? 4 : 3, // Search, Home, Favorites, Logout / Search, Home, Login
    rowCount: rows.length,
    rowLengths,
    modalButtonsCount: 2,
    initialZone: 'hero',
    isAuthenticated,
    sidebarIdx,
    setSidebarIdx,
  });

  // TV QR Login states
  const [tvSession, setTvSession] = useState<{ token: string; code: string; expiresAt: number } | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  const fetchTvSession = () => {
    setIsSessionLoading(true);
    authAPI.createTvSession()
      .then((data) => {
        setTvSession(data);
      })
      .catch((err) => {
        console.error('Error creating TV session:', err);
        toast.error('Không thể tạo phiên đăng nhập TV');
      })
      .finally(() => {
        setIsSessionLoading(false);
      });
  };

  // Generate TV session on entering Login tab
  useEffect(() => {
    if (sidebarIdx === 2 && !isAuthenticated) {
      fetchTvSession();
    }
  }, [sidebarIdx, isAuthenticated]);

  // Poll TV session status
  useEffect(() => {
    if (!tvSession || isAuthenticated || sidebarIdx !== 2) return;

    const interval = setInterval(() => {
      authAPI.getTvSessionStatus(tvSession.token)
        .then((data) => {
          if (data.expired) {
            setTvSession(null);
            fetchTvSession();
            toast.error('Mã QR đã hết hạn. Đang tải mã mới...');
          } else if (data.isApproved) {
            // Log in the user
            localStorage.setItem('access_token', data.accessToken);
            localStorage.setItem('refresh_token', data.refreshToken);
            
            // Sync user state in zustand store
            useAuthStore.setState({
              isAuthenticated: true,
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            });
            
            toast.success(`Chào mừng ${data.user.displayName || data.user.username} đã đăng nhập thành công!`);
            setSidebarIdx(1); // Redirect to Home
            setZone('hero');
          }
        })
        .catch((err) => {
          console.error('Error polling TV session status:', err);
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [tvSession, isAuthenticated, sidebarIdx, setSidebarIdx, setZone]);

  const heroMovie = featuredMovies[0] || trendingMovies[0] || singleMovies[0] || null;

  // Modal and playback states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isFetchingEpisodes, setIsFetchingEpisodes] = useState(false);
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState(0);
  const [activePlayback, setActivePlayback] = useState<{ src: string; episodeId: string } | null>(null);

  // Refs for D-pad auto-scrolling
  const activeItemRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);
  const activeSidebarItemRef = useRef<HTMLDivElement>(null);
  const activeHeroBtnRef = useRef<HTMLButtonElement>(null);
  const activeEpisodeItemRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset focus coordinates when switching sidebar tabs
  useEffect(() => {
    setGridRow(0);
    setGridCol(0);
    if (sidebarIdx === 0) {
      setZone('search-input');
    } else if (sidebarIdx === 1) {
      setZone('hero');
    } else if (sidebarIdx === 2) {
      if (isAuthenticated) {
        setZone('grid');
      } else {
        setZone('login-qr');
      }
    } else if (sidebarIdx === 3) {
      setZone('sidebar');
    }
  }, [sidebarIdx, setZone, setGridRow, setGridCol, isAuthenticated]);

  // Handle Search Input focus native D-pad transitions
  useEffect(() => {
    if (zone === 'search-input' && inputRef.current) {
      inputRef.current.focus();
    } else if (inputRef.current) {
      inputRef.current.blur();
    }
  }, [zone]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setZone('keyboard');
      setGridRow(0);
      setGridCol(0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setZone('sidebar');
    }
  };

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
      if (activePlayback) return; // Player handles OK internally

      if (zone === 'sidebar') {
        e.preventDefault();
        if (sidebarIdx === 3 && isAuthenticated) {
          logout();
          setSidebarIdx(1);
          setZone('hero');
          toast.success('Đã đăng xuất tài khoản.');
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
      } else if (zone === 'keyboard') {
        e.preventDefault();
        const char = KEYBOARD_ROWS[gridRow]?.[gridCol];
        if (char) {
          if (char === 'SPACE') {
            setSearchQuery((prev) => prev + ' ');
          } else if (char === 'BACKSPACE') {
            setSearchQuery((prev) => prev.slice(0, -1));
          } else if (char === 'CLEAR') {
            setSearchQuery('');
          } else {
            setSearchQuery((prev) => prev + char.toLowerCase());
          }
        }
      } else if (zone === 'login-qr') {
        e.preventDefault();
        fetchTvSession();
      }
    };

    window.addEventListener('keydown', handleOK);
    return () => {
      window.removeEventListener('keydown', handleOK);
    };
  }, [zone, gridRow, gridCol, rows, heroMovie, openModal, activePlayback, setSearchQuery, tvSession]);

  // Modal Custom D-pad navigation logic
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

  // Auto-scroll when focus changes
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
    } else if ((zone === 'hero' || zone === 'login-qr') && activeHeroBtnRef.current) {
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
              ...(isAuthenticated
                ? [
                    { id: 2, label: 'Yêu thích', icon: <Heart className="w-5 h-5" /> },
                    { id: 3, label: 'Đăng xuất', icon: <LogOut className="w-5 h-5 text-red-500" /> }
                  ]
                : [
                    { id: 2, label: 'Đăng nhập', icon: <LogIn className="w-5 h-5 text-emerald-500" /> }
                  ])
            ].map(item => {
              const isActive = sidebarIdx === item.id;
              const isFocused = zone === 'sidebar' && sidebarIdx === item.id;
              
              let activeClass = 'text-gray-400 hover:text-white border border-transparent';
              if (isFocused) {
                activeClass = 'bg-red-600 text-white font-bold scale-105 shadow-lg shadow-red-600/20 border border-red-500/10';
              } else if (isActive) {
                activeClass = 'bg-red-600/10 text-red-500 font-bold border border-red-500/15';
              }

              return (
                <div
                  key={item.id}
                  ref={isFocused ? activeSidebarItemRef : null}
                  onClick={() => {
                    if (item.id === 3 && isAuthenticated) {
                      logout();
                      setSidebarIdx(1);
                      setZone('hero');
                      toast.success('Đã đăng xuất tài khoản.');
                    } else {
                      setSidebarIdx(item.id);
                    }
                  }}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${activeClass}`}
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
        
        {/* VIEW A: TV SEARCH VIEW */}
        {sidebarIdx === 0 && (
          <div className="p-12 space-y-8 select-none">
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Search className="w-8 h-8 text-red-500 animate-pulse" />
              <span>Tìm Kiếm Phim Trên TV</span>
            </h1>

            {/* Glowing Search Box input */}
            <div
              className={`w-full max-w-2xl bg-zinc-900/60 border rounded-2xl flex items-center px-6 py-4 gap-4 transition-all ${
                zone === 'search-input'
                  ? 'border-red-500 shadow-xl shadow-red-600/5 bg-zinc-900 scale-102'
                  : 'border-white/5'
              }`}
            >
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Nhập tên phim bạn muốn tìm kiếm..."
                className="bg-transparent border-none outline-none text-white w-full text-base font-medium placeholder-gray-500"
              />
            </div>
            
            {/* On-screen Virtual Keyboard */}
            <div className="w-full max-w-2xl bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl select-none backdrop-blur-md">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Bàn phím ảo</div>
              <div className="space-y-3">
                {KEYBOARD_ROWS.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-2">
                    {row.map((char, cIdx) => {
                      const isFocused = zone === 'keyboard' && gridRow === rIdx && gridCol === cIdx;
                      let widthClass = 'flex-1';
                      if (char === 'SPACE') widthClass = 'w-36 flex-grow-0';
                      if (char === 'BACKSPACE') widthClass = 'w-24 flex-grow-0';
                      if (char === 'CLEAR') widthClass = 'w-28 flex-grow-0';
                      
                      return (
                        <button
                          key={char}
                          onClick={() => {
                            if (char === 'SPACE') setSearchQuery((prev) => prev + ' ');
                            else if (char === 'BACKSPACE') setSearchQuery((prev) => prev.slice(0, -1));
                            else if (char === 'CLEAR') setSearchQuery('');
                            else setSearchQuery((prev) => prev + char.toLowerCase());
                            
                            setZone('keyboard');
                            setGridRow(rIdx);
                            setGridCol(cIdx);
                          }}
                          className={`h-12 rounded-xl text-sm font-extrabold flex items-center justify-center transition-all ${widthClass} ${
                            isFocused
                              ? 'bg-red-600 text-white scale-105 shadow-lg shadow-red-600/30'
                              : 'bg-zinc-800/80 hover:bg-zinc-800 text-gray-300 hover:text-white border border-white/5'
                          }`}
                        >
                          {char === 'SPACE' ? 'DẤU CÁCH' : char === 'BACKSPACE' ? 'XÓA' : char === 'CLEAR' ? 'XÓA HẾT' : char}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Helper message for Search View */}
            {zone === 'search-input' && (
              <p className="text-xs text-gray-400">
                Gõ bàn phím vật lý hoặc bấm **Mũi tên xuống** để dùng Bàn phím ảo. Bấm **Mũi tên trái** để về Sidebar.
              </p>
            )}
            {zone === 'keyboard' && (
              <p className="text-xs text-gray-400">
                Sử dụng các phím di chuyển trên Remote/Bàn phím để chọn chữ, nhấn **Enter** để nhập. Di chuyển xuống dưới để tới danh sách phim.
              </p>
            )}
          </div>
        )}

        {/* VIEW B: HOME VIEW (HERO BANNER) */}
        {sidebarIdx === 1 && heroMovie && (
          <div className="relative h-[60vh] w-full flex items-end select-none">
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

        {/* VIEW C: FAVORITES OR LOGIN VIEW */}
        {sidebarIdx === 2 && (
          isAuthenticated ? (
            <div className="p-12 pb-4 select-none animate-fadeIn">
              <h1 className="text-3xl font-extrabold flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-red-600" />
                <span>Phim Yêu Thích Của Bạn</span>
              </h1>
              <p className="text-xs text-gray-400 mt-2">
                Danh sách phim bạn đã lưu để xem sau.
              </p>
            </div>
          ) : (
            <div className="p-12 space-y-8 select-none animate-fadeIn max-w-4xl">
              <h1 className="text-3xl font-extrabold flex items-center gap-3">
                <LogIn className="w-8 h-8 text-emerald-500 animate-pulse" />
                <span>Đăng Nhập Tài Khoản Trên TV</span>
              </h1>
              <p className="text-xs text-gray-400 -mt-4">
                Đăng nhập tài khoản HùngCinema để đồng bộ danh sách phim yêu thích và lịch sử xem của bạn.
              </p>

              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-12 shadow-2xl backdrop-blur-md">
                {/* Left side: QR Code */}
                <div className="flex flex-col items-center gap-4">
                  {isSessionLoading ? (
                    <div className="w-[200px] h-[200px] bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    </div>
                  ) : tvSession ? (
                    (() => {
                      const qrUrl = typeof window !== 'undefined'
                        ? `${window.location.origin}/tv/login-mobile?token=${tvSession.token}&code=${tvSession.code}`
                        : '';
                      const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&color=255-255-255&bgcolor=15-15-18`;
                      return (
                        <div className="relative p-3 bg-[#0f0f12] rounded-2xl border-2 border-red-500/20 shadow-lg shadow-red-600/5 hover:border-red-500/80 transition-all duration-300">
                          <img
                            src={qrImg}
                            alt="QR Code Đăng Nhập TV"
                            className="w-[200px] h-[200px] rounded-lg"
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-[200px] h-[200px] bg-zinc-950 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/5 shadow-inner">
                      <XCircle className="w-8 h-8 text-red-500" />
                      <span className="text-[10px] text-gray-500">Lỗi tạo phiên QR</span>
                    </div>
                  )}
                </div>

                {/* Right side: Instructions */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Quét mã QR</h4>
                        <p className="text-xs text-gray-400 leading-normal">
                          Mở ứng dụng Camera hoặc quét mã QR trên điện thoại di động để truy cập trang xác nhận liên kết.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Xác nhận mã liên kết</h4>
                        <p className="text-xs text-gray-400 leading-normal">
                          Đảm bảo mã 6 chữ số hiển thị trên điện thoại trùng khớp với mã bên dưới:
                        </p>
                        {tvSession && (
                          <div className="inline-block bg-zinc-950 border border-white/5 px-4 py-2 mt-2 rounded-xl text-xl font-black text-red-500 tracking-wider shadow-inner">
                            {tvSession.code}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Đồng ý liên kết</h4>
                        <p className="text-xs text-gray-400 leading-normal">
                          Nhấn "Đăng Nhập Trên TV" trên điện thoại để hoàn thành. TV của bạn sẽ tự động đăng nhập.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3 items-center">
                    <button
                      ref={zone === 'login-qr' ? activeHeroBtnRef : null}
                      onClick={fetchTvSession}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                        zone === 'login-qr'
                          ? 'bg-white text-black scale-105 shadow-xl shadow-white/10'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSessionLoading ? 'animate-spin' : ''}`} />
                      <span>Lấy Mã QR Mới</span>
                    </button>
                    {zone === 'login-qr' && (
                      <span className="text-[10px] text-gray-500 animate-pulse">
                        Nhấn nút OK trên Remote để lấy mã mới
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Dynamic Categories Movie Rows Rendering */}
        <div className="px-12 space-y-10 relative z-10 select-none">
          {rows.map((row, rIdx) => {
            const isRowActive = zone === 'grid' && gridRow === rIdx;
            
            // Empty rows handling
            if (!row.loading && row.movies.length === 0) {
              if (sidebarIdx === 0 && !searchQuery.trim()) {
                return null;
              }
              return (
                <div key={row.title} className="text-sm text-gray-500 py-8 italic">
                  Không tìm thấy phim nào trong danh mục này.
                </div>
              );
            }

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
                            ? 'border-red-500 scale-108 shadow-xl shadow-red-600/15 z-20'
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-40 flex items-center justify-center p-8 select-none">
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
