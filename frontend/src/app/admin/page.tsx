'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, moviesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Film,
  Users,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Star,
  Plus,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'movies' | 'featured' | 'moderation'>('overview');

  // Sync inputs
  const [syncSlug, setSyncSlug] = useState('');
  const [syncPages, setSyncPages] = useState(1);

  // Pagination for movie list
  const [moviePage, setMoviePage] = useState(1);
  const [searchMovieQuery, setSearchMovieQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Pagination for featured list
  const [featuredPage, setFeaturedPage] = useState(1);
  const [searchFeaturedQuery, setSearchFeaturedQuery] = useState('');
  const [debouncedFeaturedQuery, setDebouncedFeaturedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchMovieQuery);
      setMoviePage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchMovieQuery]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'ADMIN') {
      router.push('/');
      toast.error('Bạn không có quyền truy cập trang quản trị');
    }
  }, [mounted, isAuthenticated, user, router]);

  // 1. Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getDashboard,
    enabled: user?.role === 'ADMIN',
  });

  // 2. Fetch movies list for management
  const { data: moviesData, isLoading: isMoviesLoading } = useQuery<any>({
    queryKey: ['admin-movies', moviePage],
    queryFn: () => adminAPI.getUsers(moviePage), // wait, let's see if adminAPI.getUsers in api.ts is actually listing users, and what lists movies.
    enabled: user?.role === 'ADMIN' && activeTab === 'movies',
  });

  // Wait! Let's check api.ts to see what method gets admin movies!
  // In lib/api.ts:
  // getDashboard: () => api.get('/admin/dashboard').then(r => r.data),
  // getUsers: (page?: number) => api.get('/admin/users', { params: { page } }).then(r => r.data),
  // syncMovie: (slug: string) => api.post('/admin/movies/sync', { slug }).then(r => r.data),
  // syncLatest: (pages?: number) => api.post('/admin/movies/sync-latest', { pages }).then(r => r.data),
  // setFeatured: (id: string, isFeatured: boolean) => api.patch(`/admin/movies/${id}/featured`, { isFeatured }).then(r => r.data),
  // togglePublished: (id: string) => api.patch(`/admin/movies/${id}/toggle-published`).then(r => r.data),
  // deleteMovie: (id: string) => api.delete(`/admin/movies/${id}`).then(r => r.data),
  
  // Ah! There is no specific "getMovies" for admin since we can just use the public "moviesAPI.getAll" with publish=all filter, or let's use `moviesAPI.getAll({ limit: 10, page: moviePage })`.
  // Let's use `moviesAPI.getAll` in the admin panel to display and manage movies. It has all we need!
  const { data: moviesListResponse, isLoading: isMoviesListLoading } = useQuery<any>({
    queryKey: ['admin-movies-list', moviePage, debouncedSearchQuery],
    queryFn: () => adminAPI.getMovies(moviePage, debouncedSearchQuery),
    enabled: user?.role === 'ADMIN' && activeTab === 'movies',
  });

  const movies = moviesListResponse?.data || [];
  const pagination = moviesListResponse?.pagination;

  // 2.5 Fetch featured movies list for management
  const { data: featuredListResponse, isLoading: isFeaturedListLoading } = useQuery<any>({
    queryKey: ['admin-featured-list', featuredPage, debouncedFeaturedQuery],
    queryFn: () => adminAPI.getMovies(featuredPage, debouncedFeaturedQuery, true),
    enabled: user?.role === 'ADMIN' && activeTab === 'featured',
  });

  const featuredMovies = featuredListResponse?.data || [];
  const featuredPagination = featuredListResponse?.pagination;

  // 3. Fetch reports and comments for moderation
  const { data: reportsData, isLoading: isReportsLoading } = useQuery<any>({
    queryKey: ['admin-reports'],
    queryFn: () => adminAPI.getReports(1),
    enabled: user?.role === 'ADMIN' && activeTab === 'moderation',
  });

  const reports = reportsData?.data || [];

  // Mutations
  const syncMovieMutation = useMutation({
    mutationFn: adminAPI.syncMovie,
    onSuccess: () => {
      toast.success('Đồng bộ phim thành công!');
      setSyncSlug('');
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Đồng bộ thất bại');
    },
  });

  const syncLatestMutation = useMutation({
    mutationFn: adminAPI.syncLatest,
    onSuccess: () => {
      toast.success('Đã xếp hàng đồng bộ các phim mới nhất!');
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Đồng bộ thất bại');
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      adminAPI.setFeatured(id, isFeatured),
    onSuccess: () => {
      toast.success('Cập nhật phim nổi bật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-movies-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-featured-list'] });
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: adminAPI.togglePublished,
    onSuccess: () => {
      toast.success('Cập nhật trạng thái hiển thị thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-movies-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-featured-list'] });
    },
  });

  const deleteMovieMutation = useMutation({
    mutationFn: adminAPI.deleteMovie,
    onSuccess: () => {
      toast.success('Đã xóa phim thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-movies-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-featured-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleReportMutation = useMutation({
    mutationFn: adminAPI.handleReport,
    onSuccess: () => {
      toast.success('Đã xử lý báo cáo');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400">Đang kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="container-main space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Bảng Quản Trị</h1>
            <p className="text-gray-400 text-sm mt-1">Đồng bộ dữ liệu phim, kiểm duyệt bình luận và xem thống kê hệ thống</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 gap-2 scrollbar-none overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sync'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Đồng bộ phim OPhim
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'movies'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Quản lý phim
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'featured'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            Phim nổi bật
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'moderation'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Báo cáo & Kiểm duyệt
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-red-600/10 rounded-xl text-red-500">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Tổng số phim</span>
                  <span className="text-2xl font-black text-white">{isStatsLoading ? '...' : stats?.movies || 0}</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Người dùng</span>
                  <span className="text-2xl font-black text-white">{isStatsLoading ? '...' : stats?.users || 0}</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-green-600/10 rounded-xl text-green-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Bình luận</span>
                  <span className="text-2xl font-black text-white">{isStatsLoading ? '...' : stats?.comments || 0}</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-yellow-600/10 rounded-xl text-yellow-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Báo cáo chờ xử lý</span>
                  <span className="text-2xl font-black text-white">{isStatsLoading ? '...' : stats?.pendingReports || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick guide card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/20 to-black border border-white/5 space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                Hướng dẫn nhanh về dữ liệu
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Website sử dụng dịch vụ API từ OPhim. Dữ liệu phim có thể được thêm bằng cách đồng bộ theo slug hoặc chạy tiến trình đồng bộ các phim mới nhất. Phim sau khi đồng bộ sẽ tự động được hiển thị cho người xem và sẵn sàng phát.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sync by Slug */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Đồng bộ từng phim</h3>
              <p className="text-xs text-gray-400">Đồng bộ hoặc cập nhật lại chi tiết phim bằng slug (Ví dụ: `tran-chien-sinh-tu` hoặc `biet-doi-anh-hung` từ ophim17.cc)</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nhập slug phim..."
                  value={syncSlug}
                  onChange={(e) => setSyncSlug(e.target.value)}
                  className="input-dark w-full py-2.5"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
                <button
                  onClick={() => {
                    if (!syncSlug.trim()) return;
                    syncMovieMutation.mutate(syncSlug.trim());
                  }}
                  disabled={syncMovieMutation.isPending}
                  className="btn btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {syncMovieMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Đồng bộ ngay'}
                </button>
              </div>
            </div>

            {/* Sync Latest */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Đồng bộ phim mới cập nhật</h3>
              <p className="text-xs text-gray-400">Đồng bộ tự động các phim mới được cập nhật gần đây nhất từ OPhim API</p>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300 font-medium">Số trang đồng bộ:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={syncPages}
                    onChange={(e) => setSyncPages(Number(e.target.value))}
                    className="input-dark py-2 text-center w-24"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <button
                  onClick={() => syncLatestMutation.mutate(syncPages)}
                  disabled={syncLatestMutation.isPending}
                  className="btn btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500"
                >
                  {syncLatestMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Khởi chạy đồng bộ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white">Danh sách phim hiện tại</h3>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Tìm phim theo tên..."
                  value={searchMovieQuery}
                  onChange={(e) => setSearchMovieQuery(e.target.value)}
                  className="input-dark py-2 pr-10 w-full text-sm"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            {isMoviesListLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : movies.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Chưa có phim nào trong cơ sở dữ liệu.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 border-b border-white/5 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Phim</th>
                      <th className="px-6 py-4">Thể loại / Năm</th>
                      <th className="px-6 py-4">Nổi bật</th>
                      <th className="px-6 py-4">Hiển thị</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {movies.map((m: any) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          <Link href={`/movies/${m.slug}`} className="hover:text-red-500 transition-colors">
                            {m.name}
                          </Link>
                          <span className="block text-xs text-gray-500 font-normal mt-0.5">{m.originName}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {m.type === 'MOVIE' ? 'Phim lẻ' : 'Phim bộ'} · {m.year}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleFeaturedMutation.mutate({ id: m.id, isFeatured: !m.isFeatured })}
                            className={`p-1.5 rounded-lg border transition-all ${
                              m.isFeatured
                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${m.isFeatured ? 'fill-yellow-500' : ''}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => togglePublishedMutation.mutate(m.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              m.isPublished
                                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                            }`}
                          >
                            {m.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa phim này khỏi hệ thống?')) {
                                deleteMovieMutation.mutate(m.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  disabled={moviePage <= 1}
                  onClick={() => setMoviePage(moviePage - 1)}
                  className="btn btn-ghost bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-400">Trang {moviePage} / {pagination.totalPages}</span>
                <button
                  disabled={moviePage >= pagination.totalPages}
                  onClick={() => setMoviePage(moviePage + 1)}
                  className="btn btn-ghost bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'featured' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white">Danh sách phim nổi bật</h3>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Tìm kiếm phim nổi bật..."
                  value={searchFeaturedQuery}
                  onChange={(e) => setSearchFeaturedQuery(e.target.value)}
                  className="input-dark py-2 pr-10 w-full text-sm"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            {isFeaturedListLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : featuredMovies.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Chưa có phim nào được đánh dấu nổi bật.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 border-b border-white/5 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Phim</th>
                      <th className="px-6 py-4">Thể loại / Năm</th>
                      <th className="px-6 py-4">Nổi bật</th>
                      <th className="px-6 py-4">Hiển thị</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {featuredMovies.map((m: any) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          <Link href={`/movies/${m.slug}`} className="hover:text-red-500 transition-colors">
                            {m.name}
                          </Link>
                          <span className="block text-xs text-gray-500 font-normal mt-0.5">{m.originName}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {m.type === 'MOVIE' ? 'Phim lẻ' : 'Phim bộ'} · {m.year}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleFeaturedMutation.mutate({ id: m.id, isFeatured: !m.isFeatured })}
                            className="p-1.5 rounded-lg border transition-all bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                          >
                            <Star className="w-4 h-4 fill-yellow-500" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => togglePublishedMutation.mutate(m.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              m.isPublished
                                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                            }`}
                          >
                            {m.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa phim này khỏi hệ thống?')) {
                                deleteMovieMutation.mutate(m.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {featuredPagination && featuredPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  disabled={featuredPage <= 1}
                  onClick={() => setFeaturedPage(featuredPage - 1)}
                  className="btn btn-ghost bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-400">Trang {featuredPage} / {featuredPagination.totalPages}</span>
                <button
                  disabled={featuredPage >= featuredPagination.totalPages}
                  onClick={() => setFeaturedPage(featuredPage + 1)}
                  className="btn btn-ghost bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Báo cáo bình luận vi phạm</h3>
              
              {isReportsLoading ? (
                <div className="skeleton h-20 rounded-xl" />
              ) : reports.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">Không có báo cáo nào chưa xử lý.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">Lý do: {r.reason}</span>
                          <span className="badge badge-red text-[8px]">Chưa xử lý</span>
                        </div>
                        {r.comment && (
                          <p className="text-xs text-gray-400 mt-1 italic">"{r.comment.content}"</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleReportMutation.mutate(r.id)}
                        className="btn btn-primary p-2 rounded-lg"
                        title="Đánh dấu đã xử lý"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
