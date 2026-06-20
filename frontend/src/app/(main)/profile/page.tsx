'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { userAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { User, Settings, Heart, History, Save, LogOut, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load user data into local state
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error('Chỉ chấp nhận định dạng ảnh jpg, jpeg, png, webp');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    try {
      const updatedUser = await userAPI.uploadAvatar(formData);
      setUser(updatedUser);
      setAvatar(updatedUser.avatar || '');
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await userAPI.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
      });
      setUser(updatedUser);
      toast.success('Cập nhật tài khoản thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật tài khoản thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="container-main max-w-4xl space-y-8">
        <div className="border-b border-white/5 pb-4">
          <h1 className="text-3xl font-black text-white">Quản Lý Tài Khoản</h1>
          <p className="text-gray-400 text-sm mt-1">Cập nhật thông tin cá nhân và thiết lập tài khoản của bạn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white font-bold transition-all"
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

          {/* Form Content */}
          <div className="md:col-span-3">
            <form onSubmit={handleSave} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6">
              {/* Header profile info / Avatar upload area */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-600/50 group-hover:border-red-500 bg-white/5 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-600/10 transition-all relative">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    ) : avatar ? (
                      <img
                        src={getAvatarUrl(avatar)}
                        alt={user.displayName || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.displayName?.[0] || user.username[0]
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity duration-200">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Tải ảnh</span>
                    </div>
                  </div>
                  
                  {/* Small badge edit button */}
                  <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-colors border border-black">
                    <Camera className="w-3.5 h-3.5" />
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                    {user.displayName || user.username}
                  </h3>
                  <p className="text-sm text-gray-400">Thành viên từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                  <p className="text-xs text-red-400 font-medium">Nhấn vào ảnh đại diện để thay đổi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="input-dark w-full opacity-65 cursor-not-allowed"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Địa chỉ Email</label>
                  <input
                    type="text"
                    value={user.email}
                    disabled
                    className="input-dark w-full opacity-65 cursor-not-allowed"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Họ và tên</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-dark w-full"
                    style={{ borderRadius: 'var(--radius-md)' }}
                    required
                  />
                </div>

                {/* Avatar field removed - handled by interactive uploader above */}

                {/* Bio */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tiểu sử (Bio)</label>
                  <textarea
                    placeholder="Giới thiệu ngắn gọn về bản thân..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="input-dark w-full py-2 resize-none"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-white/5 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
