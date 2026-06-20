'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      await login(email.trim(), password);
      toast.success('Đăng nhập thành công!');
      router.push('/');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs for visual appeal */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full filter blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full filter blur-[100px] animate-pulse" />

      {/* Login Card */}
      <div className="w-full max-w-md glass-dark p-8 rounded-3xl border border-white/5 shadow-2xl relative z-10 space-y-6">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              Cine<span className="text-red-500">Stream</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white mt-4">Chào mừng trở lại</h2>
          <p className="text-xs text-gray-400">Đăng nhập tài khoản của bạn để tiếp tục xem phim</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark pl-10 w-full"
                style={{ borderRadius: 'var(--radius-md)' }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mật khẩu</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark pl-10 pr-10 w-full"
                style={{ borderRadius: 'var(--radius-md)' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-red-600/20 mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Đăng Nhập'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-red-500 hover:text-red-400 font-bold transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
