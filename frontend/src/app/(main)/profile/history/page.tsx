'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { watchHistoryAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/types';
import { Heart, Settings, History, LogOut, Play, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { WatchHistory } from '@/types';

export default function HistoryPage() {
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

  // Fetch watch history
  const { data, isLoading } = useQuery<{ data: WatchHistory[] }>({
    queryKey: ['watch-history'],
    queryFn: () => watchHistoryAPI.getAll(1),
    enabled: isAuthenticated,
  });

  const historyItems = data?.data || [];

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
          <h1 className="text-3xl font-black text-white">Lịch Sử Xem</h1>
          <p className="text-gray-400 text-sm mt-1">Xem lại tiến độ phát của các bộ phim bạn đang theo dõi</p>
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
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Heart className="w-4 h-4 text-red-500" />
              <span>Yêu thích</span>
            </Link>
            <Link
              href="/profile/history"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white font-bold transition-all"
            >
              <History className="w-4 h-4 text-white" />
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

          {/* History Content */}
          <div className="md:col-span-3 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
                <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">Bạn chưa xem bộ phim nào</p>
                <Link href="/" className="btn btn-primary text-xs py-2.5 px-6 rounded-xl font-bold">
                  Xem Phim Ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {historyItems.map((item) => {
                  const percent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
                  const watchLink = item.episode
                    ? `/watch/${item.movie.slug}?ep=${item.episode.slug}`
                    : `/watch/${item.movie.slug}`;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 hover:bg-white/10 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                        <Image
                          src={getImageUrl(item.movie.thumbUrl || item.movie.posterUrl)}
                          alt={item.movie.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <Link
                                href={`/movies/${item.movie.slug}`}
                                className="font-bold text-white hover:text-red-500 transition-colors text-base line-clamp-1"
                              >
                                {item.movie.name}
                              </Link>
                              <span className="text-xs text-gray-400 block mt-0.5">{item.movie.originName}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.watchedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          {item.episode && (
                            <span className="inline-block mt-2 text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              Tập: {item.episode.name}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar & Watch Resume Button */}
                        <div className="flex items-center justify-between gap-4 mt-3">
                          <div className="flex-grow space-y-1">
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-red-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                              <span>Đã xem {Math.round(percent)}%</span>
                              <span>
                                {Math.floor(item.progress / 60)} / {Math.floor(item.duration / 60)} phút
                              </span>
                            </div>
                          </div>

                          <Link
                            href={watchLink}
                            className="btn btn-primary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1 flex-shrink-0"
                            title="Xem tiếp"
                          >
                            <Play className="w-4 h-4 fill-white" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
