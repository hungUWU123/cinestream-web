import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ============================================================
// API Functions
// ============================================================

// Auth
export const authAPI = {
  register: (data: { email: string; code: string; username: string; password: string; displayName: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  sendOtp: (email: string) =>
    api.post('/auth/otp/send', { email }).then(r => r.data),
  verifyOtp: (email: string, code: string) =>
    api.post('/auth/otp/verify', { email, code }).then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(r => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then(r => r.data),
};

// Movies
export const moviesAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get('/movies', { params }).then(r => r.data),
  getFeatured: (limit?: number) =>
    api.get('/movies/featured', { params: { limit } }).then(r => r.data),
  getTrending: (limit?: number) =>
    api.get('/movies/trending', { params: { limit } }).then(r => r.data),
  getNew: (limit?: number) =>
    api.get('/movies/new', { params: { limit } }).then(r => r.data),
  getBySlug: (slug: string) =>
    api.get(`/movies/${slug}`).then(r => r.data),
  getEpisodes: (id: string) =>
    api.get(`/movies/${id}/episodes`).then(r => r.data),
  getRelated: (id: string, limit?: number) =>
    api.get(`/movies/${id}/related`, { params: { limit } }).then(r => r.data),
  getGenres: () => api.get('/movies/genres').then(r => r.data),
  getCountries: () => api.get('/movies/countries').then(r => r.data),
  rate: (id: string, rating: number) =>
    api.post(`/movies/${id}/rate`, { rating }).then(r => r.data),
  getMyRating: (id: string) =>
    api.get(`/movies/${id}/my-rating`).then(r => r.data),
};

// Search
export const searchAPI = {
  search: (params: Record<string, any>) =>
    api.get('/search', { params }).then(r => r.data),
  suggestions: (q: string) =>
    api.get('/search/suggestions', { params: { q } }).then(r => r.data),
};

// Comments
export const commentsAPI = {
  getByMovie: (movieId: string, page?: number) =>
    api.get(`/comments/movie/${movieId}`, { params: { page } }).then(r => r.data),
  create: (data: { movieId: string; content: string; parentId?: string }) =>
    api.post('/comments', data).then(r => r.data),
  like: (id: string) => api.post(`/comments/${id}/like`).then(r => r.data),
  report: (id: string, reason: string) =>
    api.post(`/comments/${id}/report`, { reason }).then(r => r.data),
  delete: (id: string) => api.delete(`/comments/${id}`).then(r => r.data),
};

// Favorites
export const favoritesAPI = {
  getAll: (page?: number) => api.get('/favorites', { params: { page } }).then(r => r.data),
  toggle: (movieId: string) => api.post(`/favorites/${movieId}`).then(r => r.data),
  check: (movieId: string) => api.get(`/favorites/${movieId}/check`).then(r => r.data),
};

// Watch History
export const watchHistoryAPI = {
  getAll: (page?: number) => api.get('/watch-history', { params: { page } }).then(r => r.data),
  upsert: (data: { movieId: string; episodeId?: string; progress: number; duration: number }) =>
    api.post('/watch-history', data).then(r => r.data),
  getProgress: (movieId: string, episodeId?: string) =>
    api.get(`/watch-history/${movieId}/progress`, { params: { episodeId } }).then(r => r.data),
};

// User
export const userAPI = {
  getProfile: () => api.get('/users/profile').then(r => r.data),
  updateProfile: (data: { displayName?: string; bio?: string; avatar?: string }) =>
    api.patch('/users/profile', data).then(r => r.data),
  uploadAvatar: (formData: FormData) =>
    api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard').then(r => r.data),
  getMovies: (page?: number, q?: string, isFeatured?: boolean) =>
    api.get('/admin/movies', { params: { page, q, isFeatured, limit: 10 } }).then(r => r.data),
  getUsers: (page?: number) => api.get('/admin/users', { params: { page } }).then(r => r.data),
  updateRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data),
  toggleUserStatus: (id: string) =>
    api.patch(`/admin/users/${id}/toggle-status`).then(r => r.data),
  syncMovie: (slug: string) => api.post('/admin/movies/sync', { slug }).then(r => r.data),
  syncLatest: (pages?: number | { pages?: number }) => {
    const pageNum = typeof pages === 'object' && pages !== null ? pages.pages : pages;
    return api.post('/admin/movies/sync-latest', { pages: pageNum }).then(r => r.data);
  },
  setFeatured: (id: string, isFeatured: boolean) =>
    api.patch(`/admin/movies/${id}/featured`, { isFeatured }).then(r => r.data),
  togglePublished: (id: string) =>
    api.patch(`/admin/movies/${id}/toggle-published`).then(r => r.data),
  deleteMovie: (id: string) => api.delete(`/admin/movies/${id}`).then(r => r.data),
  getComments: (page?: number) =>
    api.get('/admin/comments', { params: { page } }).then(r => r.data),
  hideComment: (id: string) => api.patch(`/admin/comments/${id}/hide`).then(r => r.data),
  deleteComment: (id: string) => api.delete(`/admin/comments/${id}`).then(r => r.data),
  getReports: (page?: number) =>
    api.get('/admin/reports', { params: { page } }).then(r => r.data),
  handleReport: (id: string) =>
    api.patch(`/admin/reports/${id}/handle`).then(r => r.data),
};
