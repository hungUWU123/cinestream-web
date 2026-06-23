'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tv2,
  Smartphone,
  Download,
  X,
  Play,
  Film,
  Zap,
  Globe2,
  ShieldCheck,
  Star,
  ChevronDown,
  ArrowRight,
  Wifi,
  Monitor,
  CheckCircle2,
  QrCode,
  CastIcon,
} from 'lucide-react';

const APK_DOWNLOAD_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}${window.location.port && window.location.port !== '80' && window.location.port !== '443' ? ':5000' : ''}/downloads/hungcinema-tv.apk`
    : '/downloads/hungcinema-tv.apk';

export default function DownloadPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPopup(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white font-sans relative">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-700/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-900/8 rounded-full blur-[120px]" />
      </div>

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              Hùng<span className="text-red-500">Cinema</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#intro" className="hover:text-white transition-colors">Giới thiệu</a>
            <a href="#features" className="hover:text-white transition-colors">Tính năng</a>
            <a href="#guide" className="hover:text-white transition-colors">Cài đặt</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <button
            onClick={() => setShowPopup(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-600/20"
          >
            <Download className="w-4 h-4" />
            Tải ứng dụng
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="intro" className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Dành riêng cho Smart TV Android
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                App <span className="text-red-500">HùngCinema</span>
                <br />dành riêng cho
                <br />Smart TV Android
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Trải nghiệm xem phim tuyệt đỉnh ngay trên màn hình TV của bạn. Hỗ trợ điều khiển từ xa, phân giải 4K và hàng nghìn bộ phim mới nhất.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowPopup(true)}
                className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-red-600/30 text-lg group"
              >
                <Download className="w-6 h-6 group-hover:animate-bounce" />
                Tải ứng dụng
              </button>
              <Link
                href="/tv"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 text-lg"
              >
                <Play className="w-6 h-6 text-red-400" />
                Xem trên Web
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Miễn phí hoàn toàn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Không cần đăng ký</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Cập nhật liên tục</span>
              </div>
            </div>
          </div>

          {/* Right TV mockup */}
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-lg">
              {/* TV Frame */}
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl p-3 shadow-2xl shadow-black/60 border border-white/10">
                <div className="bg-[#0a0a0f] rounded-xl overflow-hidden aspect-video flex items-center justify-center relative">
                  {/* Simulated TV UI */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e1a] to-[#0a0a0f]">
                    {/* Fake header */}
                    <div className="flex items-center gap-2 p-4 border-b border-white/5">
                      <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                        <Film className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white text-xs font-bold">HùngCinema TV</span>
                    </div>
                    {/* Fake content rows */}
                    <div className="p-4 space-y-3">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phim Nổi Bật</div>
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`flex-shrink-0 rounded-lg overflow-hidden ${i === 0 ? 'ring-2 ring-red-500 scale-105' : ''}`}
                            style={{ width: 50, height: 68 }}
                          >
                            <div
                              className="w-full h-full"
                              style={{
                                background: `linear-gradient(135deg, hsl(${i * 45 + 200}, 40%, 15%), hsl(${i * 45 + 220}, 40%, 8%))`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Phim Hành Động</div>
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 rounded-lg overflow-hidden"
                            style={{ width: 50, height: 68 }}
                          >
                            <div
                              className="w-full h-full"
                              style={{
                                background: `linear-gradient(135deg, hsl(${i * 30 + 0}, 50%, 15%), hsl(${i * 30 + 10}, 40%, 8%))`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Sidebar hint */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-red-900/20 to-transparent flex flex-col items-center justify-center gap-3 py-4">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                    </div>
                  </div>
                </div>
                {/* TV Stand */}
                <div className="flex justify-center mt-2">
                  <div className="w-16 h-1.5 bg-zinc-700 rounded-full" />
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 -z-10 bg-red-600/10 rounded-3xl blur-3xl scale-110" />

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">
                MIỄN PHÍ
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="flex justify-center pb-10 relative z-10">
        <ChevronDown className="w-6 h-6 text-gray-600 animate-bounce" />
      </div>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 bg-white/[0.02] border-y border-white/5 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-white mb-3">Các tính năng nổi bật</h2>
            <p className="text-gray-400">Tất cả những gì bạn cần cho một buổi xem phim hoàn hảo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                bg: 'bg-yellow-500/10 border-yellow-500/20',
                title: 'Siêu tốc độ',
                desc: 'Stream phim mượt mà không giật lag, phân giải tối đa theo đường truyền của bạn.',
              },
              {
                icon: <Globe2 className="w-6 h-6 text-blue-400" />,
                bg: 'bg-blue-500/10 border-blue-500/20',
                title: 'Đa ngôn ngữ',
                desc: 'Kho phim với đầy đủ phụ đề: lồng tiếng, thuyết minh, phụ đề tiếng Việt chỉnh chu.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
                bg: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'Không cần đăng ký',
                desc: 'Xem phim ngay lập tức mà không cần tạo tài khoản hay trả phí bất kỳ.',
              },
              {
                icon: <QrCode className="w-6 h-6 text-purple-400" />,
                bg: 'bg-purple-500/10 border-purple-500/20',
                title: 'Đăng nhập bằng QR',
                desc: 'Quét mã QR bằng điện thoại để đăng nhập TV siêu nhanh, không cần gõ mật khẩu.',
              },
              {
                icon: <Film className="w-6 h-6 text-red-400" />,
                bg: 'bg-red-500/10 border-red-500/20',
                title: 'Kho phim khổng lồ',
                desc: 'Hàng nghìn bộ phim mới cập nhật hàng ngày từ các nguồn uy tín nhất.',
              },
              {
                icon: <Monitor className="w-6 h-6 text-orange-400" />,
                bg: 'bg-orange-500/10 border-orange-500/20',
                title: 'Tối ưu cho TV',
                desc: 'Giao diện thiết kế riêng cho màn hình lớn, điều khiển remote hoàn hảo.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border ${f.bg} group hover:scale-[1.02] transition-all duration-300 cursor-default`}
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install Guide ── */}
      <section id="guide" className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-white mb-3">Hướng dẫn cài đặt</h2>
            <p className="text-gray-400">Chỉ 3 bước đơn giản để xem phim trên Smart TV</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[17%] right-[17%] h-0.5 bg-gradient-to-r from-red-500/50 via-red-500/30 to-red-500/50" />
            {[
              {
                step: '01',
                icon: <Download className="w-7 h-7 text-red-400" />,
                title: 'Tải file APK',
                desc: 'Nhấn nút "Tải ứng dụng" và chọn "Android TV" để tải file APK về TV.',
              },
              {
                step: '02',
                icon: <ShieldCheck className="w-7 h-7 text-orange-400" />,
                title: 'Cho phép cài từ ngoài',
                desc: 'Vào Cài đặt → Bảo mật → Bật "Nguồn không xác định" trên TV.',
              },
              {
                step: '03',
                icon: <Play className="w-7 h-7 text-emerald-400" />,
                title: 'Mở và thưởng thức',
                desc: 'Mở file APK vừa tải, cài đặt và khởi động ứng dụng. Xem phim thôi!',
              },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                <div className="relative w-20 h-20 bg-zinc-900 border-2 border-white/10 rounded-2xl flex items-center justify-center mb-5 group-hover:border-red-500/50 transition-colors z-10">
                  {s.icon}
                  <span className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 rounded-full text-[10px] font-black flex items-center justify-center text-white shadow-lg">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 bg-white/[0.02] border-t border-white/5 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-white mb-3">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'App có hỗ trợ Smart TV không phải Android không?',
                a: 'Hiện tại app được tối ưu cho Smart TV chạy hệ điều hành Android (Android TV). Với các TV khác, bạn có thể truy cập phiên bản web tại giao diện /tv trên trình duyệt TV.',
              },
              {
                q: 'Cài đặt có mất phí không?',
                a: 'Hoàn toàn miễn phí! Bạn không cần trả bất kỳ khoản phí nào để tải và sử dụng HùngCinema TV.',
              },
              {
                q: 'Tôi cần tài khoản để xem phim không?',
                a: 'Không cần thiết. Bạn có thể xem phim tự do mà không cần đăng nhập. Đăng nhập chỉ cần thiết để lưu danh sách yêu thích.',
              },
              {
                q: 'Làm sao để đăng nhập trên TV?',
                a: 'Truy cập mục "Đăng nhập" trên sidebar TV, quét mã QR bằng điện thoại, xác nhận trên điện thoại là xong. TV sẽ tự động đăng nhập trong vòng 2 giây!',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden cursor-pointer"
              >
                <summary className="flex items-center justify-between p-6 font-bold text-white list-none select-none hover:bg-white/5 transition-colors">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="relative z-10 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/20 rounded-3xl p-12">
            <Film className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Sẵn sàng xem phim?</h2>
            <p className="text-gray-400 mb-8">Tải ngay ứng dụng miễn phí và bắt đầu trải nghiệm kho phim khổng lồ ngay hôm nay.</p>
            <button
              onClick={() => setShowPopup(true)}
              className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-black px-10 py-5 rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-red-600/40 text-lg group"
            >
              <Download className="w-6 h-6 group-hover:animate-bounce" />
              Tải ứng dụng ngay
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
              <Film className="w-3 h-3 text-white" />
            </div>
            <span>© 2025 HùngCinema. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <Link href="/tv" className="hover:text-white transition-colors">TV Mode</Link>
          </div>
        </div>
      </footer>

      {/* ── Download Popup ── */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Modal */}
          <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/80 animate-fadeIn">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/30">
                <Film className="w-10 h-10 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white text-center mb-1">Tải ứng dụng</h3>
            <p className="text-gray-400 text-sm text-center mb-8">Chọn thiết bị tương ứng để tải và cài đặt</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Android TV */}
              <a
                href={APK_DOWNLOAD_URL}
                download
                className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer"
              >
                <div className="w-14 h-14 bg-red-600/20 group-hover:bg-red-600/30 rounded-2xl flex items-center justify-center transition-colors">
                  <Tv2 className="w-8 h-8 text-red-400 group-hover:text-red-300" />
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-sm">Android TV</div>
                  <div className="text-gray-500 text-xs mt-0.5">Tải file APK</div>
                </div>
              </a>

              {/* Mobile web */}
              <Link
                href="/tv"
                className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer"
                onClick={() => setShowPopup(false)}
              >
                <div className="w-14 h-14 bg-blue-600/20 group-hover:bg-blue-600/30 rounded-2xl flex items-center justify-center transition-colors">
                  <Smartphone className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-sm">Điện thoại</div>
                  <div className="text-gray-500 text-xs mt-0.5">Mở trên web</div>
                </div>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-400/80 leading-relaxed">
              <strong className="text-amber-400">Lưu ý khi cài APK trên TV:</strong> Bạn cần bật "Nguồn không xác định" trong phần Cài đặt → Bảo mật của TV trước khi cài đặt.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
