'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Film, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { register, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Địa chỉ email không hợp lệ');
      return;
    }

    setIsSendingOtp(true);
    try {
      await authAPI.sendOtp(email.trim());
      setOtpSent(true);
      setCountdown(60); // 60s cooldown
      toast.success('Mã xác minh đã được gửi về email của bạn!');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể gửi mã xác minh. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !displayName.trim() || !password || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ các trường thông tin');
      return;
    }

    if (!otpSent) {
      toast.error('Vui lòng gửi và xác minh email trước khi đăng ký');
      return;
    }

    if (otpCode.trim().length < 6) {
      toast.error('Vui lòng nhập mã xác minh email (6 chữ số)');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải dài ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp');
      return;
    }

    try {
      await register({
        email: email.trim(),
        code: otpCode.trim(),
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        password,
      });
      toast.success('Đăng ký tài khoản thành công!');
      window.location.href = redirectUrl;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full filter blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full filter blur-[100px] animate-pulse" />

      {/* Card */}
      <div className="w-full max-w-md glass-dark p-8 rounded-3xl border border-white/5 shadow-2xl relative z-10 space-y-6">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              Hùng<span className="text-red-500">Cinema</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white mt-4">Tạo tài khoản mới</h2>
          <p className="text-xs text-gray-400">Tham gia và trải nghiệm phim hot chất lượng cao</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Họ và Tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-dark pl-10 w-full"
                style={{ borderRadius: 'var(--radius-md)' }}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="input-dark pl-10 w-full"
                style={{ borderRadius: 'var(--radius-md)' }}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Email</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark pl-10 w-full"
                  style={{ borderRadius: 'var(--radius-md)' }}
                  required
                  disabled={otpSent}
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || countdown > 0}
                className="btn btn-primary px-4 rounded-xl text-xs font-bold whitespace-nowrap shadow-lg shadow-red-600/10"
              >
                {isSendingOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : countdown > 0 ? (
                  `Gửi lại (${countdown}s)`
                ) : otpSent ? (
                  'Gửi lại mã'
                ) : (
                  'Gửi mã'
                )}
              </button>
            </div>
          </div>

          {/* OTP Code */}
          {otpSent && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mã xác minh email (OTP)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Nhập 6 số từ email"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="input-dark pl-10 w-full tracking-[4px] font-bold"
                  style={{ borderRadius: 'var(--radius-md)' }}
                  required
                />
              </div>
              <p className="text-[10px] text-amber-500/90 font-semibold mt-1 leading-normal">
                * Lưu ý: Nếu không nhận được mã, vui lòng kiểm tra cả thư mục Thư rác (Spam) hoặc Quảng cáo.
              </p>
              {otpSent && (
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); }}
                  className="text-[10px] text-gray-500 hover:text-white transition-colors block mt-1"
                >
                  Thay đổi email
                </button>
              )}
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 ký tự"
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

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Nhập lại Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-dark pl-10 pr-10 w-full"
                style={{ borderRadius: 'var(--radius-md)' }}
                required
              />
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
              'Đăng Ký Tài Khoản'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Đã có tài khoản?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-red-500 hover:text-red-400 font-bold transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Đang tải...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
