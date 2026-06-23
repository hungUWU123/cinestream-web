'use client';

import { useState, useEffect } from 'react';
import { Download, Tv2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getApkUrl() {
  if (typeof window === 'undefined') return '/downloads/hungcinema-tv.apk';
  const { protocol, hostname, port } = window.location;
  const backendPort = port && port !== '80' && port !== '443' ? ':5000' : '';
  return `${protocol}//${hostname}${backendPort}/downloads/hungcinema-tv.apk`;
}

export function DownloadPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-black/80"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/40">
                <Tv2 className="w-10 h-10 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white text-center mb-1">Tải ứng dụng TV</h3>
            <p className="text-gray-400 text-sm text-center mb-7">
              Cài đặt HùngCinema trên Smart TV Android của bạn
            </p>

            {/* Download button */}
            <a
              href={getApkUrl()}
              download
              onClick={onClose}
              className="group flex items-center gap-4 bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 rounded-2xl p-5 transition-all hover:scale-[1.02] w-full"
            >
              <div className="w-14 h-14 bg-red-600/20 group-hover:bg-red-600/30 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0">
                <Tv2 className="w-8 h-8 text-red-400 group-hover:text-red-300" />
              </div>
              <div className="flex-1">
                <div className="text-white font-black text-base">Android TV</div>
                <div className="text-gray-400 text-xs mt-0.5">Tải file APK về TV của bạn</div>
              </div>
              <Download className="w-5 h-5 text-red-400 group-hover:text-red-300 flex-shrink-0" />
            </a>

            <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-400/80 leading-relaxed">
              <strong className="text-amber-400">Lưu ý:</strong> Bạn cần bật{' '}
              <strong>"Nguồn không xác định"</strong> trong Cài đặt → Bảo mật của TV trước khi cài đặt.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DownloadButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        id="btn-download-app"
        onClick={() => setOpen(true)}
        className={className}
        title="Tải ứng dụng TV"
      >
        <Download className="w-4 h-4" />
        <span>Tải App TV</span>
      </button>
      <DownloadPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}
