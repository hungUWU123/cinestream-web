'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginOtp, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login states
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
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
      setCountdown(60); // 60 seconds cooldown
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
    if (loginMode === 'password') {
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
    } else {
      // OTP mode
      if (!email.trim() || !otpCode.trim()) {
        toast.error('Vui lòng nhập đầy đủ email và mã xác minh');
        return;
      }
      if (otpCode.trim().length < 6) {
        toast.error('Mã xác minh phải có 6 chữ số');
        return;
      }

      try {
        await loginOtp(email.trim(), otpCode.trim());
        toast.success('Đăng nhập thành công!');
        router.push('/');
      } catch (err: any) {
        const message = err.response?.data?.message || 'Mã xác minh không chính xác hoặc đã hết hạn.';
        toast.error(message);
      }
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
              Hùng<span className="text-red-500">Cinema</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white mt-4">Chào mừng trở lại</h2>
          <p className="text-xs text-gray-400">Đăng nhập tài khoản của bạn để tiếp tục xem phim</p>
        </div>

        {/* Login Mode Switcher */}
        <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => { setLoginMode('otp'); setOtpSent(false); setOtpCode(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'otp'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mã OTP Gmail
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('password')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'password'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mật khẩu
          </button>
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
                disabled={loginMode === 'otp' && otpSent}
              />
            </div>
          </div>

          {/* Password Mode Fields */}
          {loginMode === 'password' && (
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
          )}

          {/* OTP Mode Fields */}
          {loginMode === 'otp' && otpSent && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mã xác minh (OTP)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Nhập 6 số"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="input-dark pl-10 w-full tracking-[8px] text-center font-bold text-lg"
                  style={{ borderRadius: 'var(--radius-md)' }}
                  required
                />
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-[10px] text-gray-500">Mã có hiệu lực trong 5 phút</span>
                {countdown > 0 ? (
                  <span className="text-[10px] text-gray-400">Gửi lại mã sau {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-[10px] text-red-500 hover:text-red-400 font-bold transition-colors"
                  >
                    Gửi lại mã
                  </button>
                )}
              </div>
              <p className="text-[10px] text-amber-500/90 font-semibold mt-1 leading-normal">
                * Lưu ý: Nếu không nhận được mã, vui lòng kiểm tra cả thư mục Thư rác (Spam) hoặc Quảng cáo.
              </p>
            </div>
          )}

          {/* Submit / Action Buttons */}
          {loginMode === 'otp' && !otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-red-600/20 mt-6"
            >
              {isSendingOtp ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Gửi Mã Xác Minh'
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-red-600/20 mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                loginMode === 'otp' ? 'Đăng Nhập Bằng OTP' : 'Đăng Nhập'
              )}
            </button>
          )}

          {/* Switch back button if OTP sent */}
          {loginMode === 'otp' && otpSent && (
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtpCode(''); }}
              className="w-full text-center text-xs text-gray-500 hover:text-white transition-colors pt-2"
            >
              Thay đổi email
            </button>
          )}
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
