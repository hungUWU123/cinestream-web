'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Film, CheckCircle2, XCircle, ShieldAlert, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

function TvLoginMobileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const code = searchParams.get('code');

  const { isAuthenticated, user, logout } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [storeHydrated, setStoreHydrated] = useState(false);

  // Wait for Zustand persist store to be hydrated on the client
  useEffect(() => {
    console.log('[TV Login Mobile] Component mounted.');
    if (useAuthStore.persist.hasHydrated()) {
      setStoreHydrated(true);
    }
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return () => {
      unsubFinish();
    };
  }, []);

  console.log('[TV Login Mobile] Render state:', { storeHydrated, isAuthenticated, user: !!user, token, code });

  // If not logged in on phone, redirect to /login with redirect parameter pointing back here
  useEffect(() => {
    if (storeHydrated && (!isAuthenticated || !user)) {
      const redirectPath = encodeURIComponent(`/tv/login-mobile?token=${token || ''}&code=${code || ''}`);
      const targetUrl = `/login?redirect=${redirectPath}`;
      console.log('[TV Login Mobile] User not logged in, redirecting to:', targetUrl);
      window.location.href = targetUrl;
    }
  }, [storeHydrated, isAuthenticated, user, token, code]);

  if (!storeHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
        <p className="text-gray-400">Đang kiểm tra trạng thái đăng nhập...</p>
      </div>
    );
  }

  if (!token || !code) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Liên kết không hợp lệ</h1>
        <p className="text-gray-400 max-w-sm">Mã QR bị thiếu thông tin xác minh. Vui lòng quét lại mã QR trên màn hình TV của bạn.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-zinc-800 rounded-xl hover:bg-zinc-700 font-bold transition-all text-xs"
        >
          Về Trang Chủ
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await authAPI.approveTvSession(token);
      setIsSuccess(true);
      toast.success('Liên kết TV thành công!');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể liên kết thiết bị. Mã TV có thể đã hết hạn.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    toast.error('Đã hủy liên kết thiết bị.');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10 space-y-8 select-none text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <Film className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            Hùng<span className="text-red-500">Cinema</span>
          </span>
        </div>

        {isSuccess ? (
          <div className="space-y-6 py-4 animate-fadeIn">
            <div className="flex justify-center">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Đăng Nhập Thành Công!</h2>
              <p className="text-sm text-gray-400 leading-relaxed px-4">
                Thiết bị TV/Máy chiếu của bạn đã được kết nối với tài khoản. Giao diện TV của bạn sẽ tự động đăng nhập trong giây lát.
              </p>
            </div>
            <p className="text-xs text-zinc-500">Bạn có thể đóng tab này an toàn.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Xác nhận đăng nhập TV</h2>
              <p className="text-xs text-gray-400">
                Hãy chắc chắn rằng mã hiển thị bên dưới trùng khớp với mã trên màn hình TV của bạn.
              </p>
            </div>

            {/* Code Box */}
            <div className="bg-zinc-950/80 border border-white/5 py-4 px-6 rounded-2xl inline-block mx-auto text-3xl font-black tracking-widest text-red-500">
              {code}
            </div>

            {/* Profile Detail */}
            <div className="bg-zinc-800/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Tài khoản liên kết</p>
                <h4 className="text-sm font-bold text-white mt-0.5">{user.displayName || user.username}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                title="Đăng xuất tài khoản khác"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="flex items-start gap-2.5 text-left bg-amber-500/10 border border-amber-500/10 p-3.5 rounded-2xl text-xs text-amber-500/90 leading-relaxed">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Chỉ xác nhận liên kết khi đây là thiết bị TV/Máy chiếu của bạn hoặc bạn tin tưởng. Không chia sẻ mã QR này với người khác.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-2xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-600/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Đăng Nhập Trên TV'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-800 text-gray-400 hover:text-white font-extrabold rounded-2xl transition-all text-xs"
              >
                Hủy liên kết
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TvLoginMobilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
        <p className="text-gray-400">Đang tải...</p>
      </div>
    }>
      <TvLoginMobileContent />
    </Suspense>
  );
}
