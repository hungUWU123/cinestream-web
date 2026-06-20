import Link from 'next/link';
import { Film, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">
                Cine<span className="text-red-500">Stream</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nền tảng xem phim trực tuyến chất lượng cao với hàng ngàn bộ phim hấp dẫn.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Youtube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163c-.272-1.022-1.078-1.826-2.1-2.1C19.516 3.545 12 3.545 12 3.545s-7.516 0-9.398.518c-1.02.274-1.828 1.078-2.1 2.1C0 8.047 0 12 0 12s0 3.953.502 5.837c.272 1.022 1.078 1.826 2.1 2.1C4.484 20.455 12 20.455 12 20.455s7.516 0 9.398-.518c1.02-.274 1.828-1.078 2.1-2.1C24 15.953 24 12 24 12s0-3.953-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Mail"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Thể Loại</h4>
            <ul className="space-y-2">
              {['Hành Động', 'Tình Cảm', 'Hài Hước', 'Kinh Dị', 'Viễn Tưởng', 'Hoạt Hình'].map((g) => (
                <li key={g}>
                  <Link
                    href={`/search?genre=${encodeURIComponent(g.toLowerCase().replace(/ /g, '-'))}`}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quốc Gia</h4>
            <ul className="space-y-2">
              {['Hàn Quốc', 'Trung Quốc', 'Nhật Bản', 'Mỹ', 'Việt Nam', 'Thái Lan'].map((c) => (
                <li key={c}>
                  <Link
                    href={`/search?country=${encodeURIComponent(c.toLowerCase().replace(/ /g, '-'))}`}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Hỗ Trợ</h4>
            <ul className="space-y-2">
              {[
                { name: 'Trang chủ', href: '/' },
                { name: 'Phim lẻ', href: '/search?type=MOVIE' },
                { name: 'Phim bộ', href: '/search?type=SERIES' },
                { name: 'Đăng nhập', href: '/login' },
                { name: 'Đăng ký', href: '/register' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2024 CineStream. Tất cả quyền được bảo lưu.
          </p>
          <p className="text-xs text-gray-700">
            Dữ liệu phim cung cấp bởi OPhim API. Chỉ dành cho mục đích học tập.
          </p>
        </div>
      </div>
    </footer>
  );
}
