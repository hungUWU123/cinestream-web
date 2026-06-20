'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { favoritesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import MovieCard, { MovieCardSkeleton } from '@/components/movie/MovieCard';
import { Heart, Settings, History, LogOut } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Movie } from '@/types';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Fetch favorite movies
  const { data, isLoading } = useQuery<{ data: Movie[] }>({
    queryKey: ['favorites'],
    queryFn: () => favoritesAPI.getAll(1),
    enabled: isAuthenticated,
  });

  const favoriteMovies = data?.data || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="container-main max-w-6xl space-y-8">
        <div className="border-b border-white/5 pb-4">
          <h1 className="text-3xl font-black text-white">Danh Sách Yêu Thích</h1>
          <p className="text-gray-400 text-sm mt-1">Quản lý và xem lại những bộ phim bạn đã đánh dấu yêu thích</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Thiết lập</span>
            </Link>
            <Link
              href="/profile/favorites"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white font-bold transition-all"
            >
              <Heart className="w-4 h-4 text-white" />
              <span>Yêu thích</span>
            </Link>
            <Link
              href="/profile/history"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <History className="w-4 h-4 text-blue-400" />
              <span>Lịch sử xem</span>
            </Link>
            <button
              onClick={() => {
                logout();
                toast.success('Đã đăng xuất');
                router.push('/');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all mt-6"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>

          {/* Favorites Content */}
          <div className="md:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : favoriteMovies.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
                <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">Danh sách phim yêu thích của bạn đang trống</p>
                <Link href="/search" className="btn btn-primary text-xs py-2.5 px-6 rounded-xl font-bold">
                  Khám Phá Phim Ngay
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {favoriteMovies.map((movie, i) => (
                  <MovieCard key={movie.id} movie={movie} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
