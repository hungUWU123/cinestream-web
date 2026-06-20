'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Bell, User, Heart, History, LogOut, Settings, Film, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { searchAPI } from '@/lib/api';
import { getImageUrl, getAvatarUrl } from '@/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const genres = [
  // Cột 1
  { name: 'Short Drama', slug: 'short-drama' },
  { name: 'Hài Hước', slug: 'hai-huoc' },
  { name: 'Hình Sự', slug: 'hinh-su' },
  { name: 'Võ Thuật', slug: 'vo-thuat' },
  { name: 'Khoa Học', slug: 'khoa-hoc' },
  { name: 'Thần Thoại', slug: 'than-thoai' },
  { name: 'Chính kịch', slug: 'chinh-kich' },
  { name: 'Kinh Điển', slug: 'kinh-dien' },
  // Cột 2
  { name: 'Hành Động', slug: 'hanh-dong' },
  { name: 'Cổ Trang', slug: 'co-trang' },
  { name: 'Chiến Tranh', slug: 'chien-tranh' },
  { name: 'Viễn Tưởng', slug: 'vien-tuong' },
  { name: 'Kinh Dị', slug: 'kinh-di' },
  { name: 'Tài Liệu', slug: 'tai-lieu' },
  { name: 'Bí ẩn', slug: 'bi-an' },
  { name: 'Phim 18+', slug: 'phim-18' },
  // Cột 3
  { name: 'Tình Cảm', slug: 'tinh-cam' },
  { name: 'Tâm Lý', slug: 'tam-ly' },
  { name: 'Thể Thao', slug: 'the-thao' },
  { name: 'Phiêu Lưu', slug: 'phieu-luu' },
  { name: 'Âm Nhạc', slug: 'am-nhac' },
  { name: 'Gia Đình', slug: 'gia-dinh' },
  { name: 'Học Đường', slug: 'hoc-duong' },
];

const countries = [
  { name: 'Việt Nam', slug: 'viet-nam' },
  { name: 'Trung Quốc', slug: 'trung-quoc' },
  { name: 'Hàn Quốc', slug: 'han-quoc' },
  { name: 'Nhật Bản', slug: 'nhat-ban' },
  { name: 'Mỹ - Âu Mỹ', slug: 'au-my' },
  { name: 'Thái Lan', slug: 'thai-lan' },
  { name: 'Hồng Kông', slug: 'hong-kong' },
  { name: 'Đài Loan', slug: 'dai-loan' },
  { name: 'Ấn Độ', slug: 'an-do' },
  { name: 'Anh', slug: 'anh' },
  { name: 'Pháp', slug: 'phap' },
  { name: 'Tây Ban Nha', slug: 'tay-ban-nha' },
  { name: 'Đức', slug: 'duc' },
  { name: 'Nga', slug: 'nga' },
  { name: 'Úc', slug: 'uc' },
  { name: 'Singapore', slug: 'singapore' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setShowSearch(false);
      }
      setShowUserMenu(false);
      setShowGenreMenu(false);
      setShowCountryMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const data = await searchAPI.suggestions(searchQuery);
          setSuggestions(data);
        } catch {}
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSuggestions([]);
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất');
    router.push('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-dark border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Cine<span style={{ color: 'var(--accent-red)' }}>Stream</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="nav-link">Trang Chủ</Link>

            {/* Genre Dropdown */}
            <div className="relative">
              <button
                className="nav-link flex items-center gap-1"
                onMouseEnter={() => setShowGenreMenu(true)}
                onMouseLeave={() => setShowGenreMenu(false)}
              >
                Thể Loại <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showGenreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 pt-2"
                    onMouseEnter={() => setShowGenreMenu(true)}
                    onMouseLeave={() => setShowGenreMenu(false)}
                  >
                    <div className="glass-dark rounded-2xl p-4 grid grid-flow-col grid-rows-8 gap-x-6 gap-y-1 min-w-[500px] shadow-2xl">
                      {genres.map((g) => (
                        <Link
                          key={g.slug}
                          href={`/search?genre=${g.slug}`}
                          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/search?type=MOVIE" className="nav-link">Phim Lẻ</Link>
            <Link href="/search?type=SERIES" className="nav-link">Phim Bộ</Link>

            {/* Countries */}
            <div className="relative">
              <button
                className="nav-link flex items-center gap-1"
                onMouseEnter={() => setShowCountryMenu(true)}
                onMouseLeave={() => setShowCountryMenu(false)}
              >
                Quốc Gia <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showCountryMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 pt-3 z-50"
                    onMouseEnter={() => setShowCountryMenu(true)}
                    onMouseLeave={() => setShowCountryMenu(false)}
                  >
                    <div className="glass-dark rounded-xl p-3 grid grid-cols-2 gap-1 min-w-[280px] shadow-2xl">
                      {countries.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/search?country=${c.slug}`}
                          className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <AnimatePresence>
                {showSearch ? (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    onSubmit={handleSearch}
                    className="flex items-center"
                  >
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm phim, diễn viên..."
                      className="input-dark pr-8"
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                    <button
                      type="button"
                      onClick={() => { setShowSearch(false); setSearchQuery(''); setSuggestions([]); }}
                      className="absolute right-2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.form>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </AnimatePresence>

              {/* Search Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="search-suggestions"
                  >
                    {suggestions.map((movie) => (
                      <Link
                        key={movie.id}
                        href={`/movies/${movie.slug}`}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                        onClick={() => { setSuggestions([]); setShowSearch(false); setSearchQuery(''); }}
                      >
                        <Image
                          src={getImageUrl(movie.thumbUrl)}
                          alt={movie.name}
                          width={40}
                          height={56}
                          className="rounded object-cover"
                          style={{ width: 40, height: 56 }}
                        />
                        <div>
                          <p className="text-sm text-white font-medium line-clamp-1">{movie.name}</p>
                          <p className="text-xs text-gray-400">{movie.year} · {movie.type === 'MOVIE' ? 'Phim lẻ' : 'Phim bộ'}</p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="block text-center text-xs text-red-400 py-3 hover:bg-white/5 border-t border-white/5"
                      onClick={() => { setSuggestions([]); setShowSearch(false); }}
                    >
                      Xem tất cả kết quả →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.displayName || user.username}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.displayName?.[0] || user.username[0]}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 glass-dark rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/5">
                        <p className="text-sm font-semibold text-white">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        {user.role === 'ADMIN' && (
                          <span className="mt-1 inline-block badge badge-red text-[10px]">Admin</span>
                        )}
                      </div>
                      <div className="p-2">
                        <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <User className="w-4 h-4" /> Tài khoản
                        </Link>
                        <Link href="/profile/favorites" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Heart className="w-4 h-4" /> Yêu thích
                        </Link>
                        <Link href="/profile/history" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <History className="w-4 h-4" /> Lịch sử xem
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" /> Quản trị
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1 border-t border-white/5"
                        >
                          <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="btn btn-ghost text-sm py-2 px-4">Đăng nhập</Link>
                <Link href="/register" className="btn btn-primary text-sm py-2 px-4">Đăng ký</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 py-4 space-y-1"
            >
              <Link href="/" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">Trang Chủ</Link>
              <Link href="/search?type=MOVIE" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">Phim Lẻ</Link>
              <Link href="/search?type=SERIES" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">Phim Bộ</Link>
              <div className="grid grid-cols-2 gap-1 px-4 py-2 border-y border-white/5 my-2">
                {genres.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/search?genre=${g.slug}`}
                    className="block py-1.5 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
              {!isAuthenticated && (
                <div className="flex gap-2 px-4 pt-2">
                  <Link href="/login" className="btn btn-ghost text-sm flex-1 justify-center py-2">Đăng nhập</Link>
                  <Link href="/register" className="btn btn-primary text-sm flex-1 justify-center py-2">Đăng ký</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
