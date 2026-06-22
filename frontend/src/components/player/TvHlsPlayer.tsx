'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, RotateCcw, ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { watchHistoryAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface TvHlsPlayerProps {
  src: string;
  movieId: string;
  episodeId: string;
  initialProgress?: number; // in seconds
  onClose: () => void;
  onProgressSave?: (progress: number) => void;
}

export default function TvHlsPlayer({
  src,
  movieId,
  episodeId,
  initialProgress = 0,
  onClose,
  onProgressSave,
}: TvHlsPlayerProps) {
  const { isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHlsActive, setIsHlsActive] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState<{ show: boolean; text: string } | null>(null);

  const lastSavedProgressRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Controls auto-hide helper
  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000); // Hide controls after 4s on TV
  };

  // 2. Initialize Hls.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsHlsActive(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      setIsHlsActive(true);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialProgress > 0) {
          video.currentTime = initialProgress;
        }
        // TV player auto-plays
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setIsHlsActive(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (initialProgress > 0) {
          video.currentTime = initialProgress;
        }
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    }

    // Auto-request full screen on mount for TV feel
    const container = containerRef.current;
    if (container) {
      container.requestFullscreen().catch(() => {});
    }

    triggerShowControls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (seekOverlayTimeoutRef.current) clearTimeout(seekOverlayTimeoutRef.current);
    };
  }, [src, initialProgress]);

  // 3. Save Watch History
  const saveProgress = async (progressTime: number, durationTime: number) => {
    if (!isAuthenticated || !movieId || !episodeId || durationTime <= 0) return;
    if (Math.abs(progressTime - lastSavedProgressRef.current) < 8) return;

    try {
      lastSavedProgressRef.current = progressTime;
      await watchHistoryAPI.upsert({
        movieId,
        episodeId,
        progress: Math.floor(progressTime),
        duration: Math.floor(durationTime),
      });
      if (onProgressSave) onProgressSave(progressTime);
    } catch (err) {
      console.error('Error saving watch history on TV:', err);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    saveProgress(video.currentTime, video.duration);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  // 4. Remote control physical button mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      triggerShowControls();

      switch (e.key) {
        case 'Enter':
        case ' ': // Space key
          e.preventDefault();
          if (video.paused) {
            video.play().then(() => setIsPlaying(true));
          } else {
            video.pause();
            setIsPlaying(false);
            saveProgress(video.currentTime, video.duration);
          }
          break;

        case 'ArrowLeft': // Tua lùi 10s
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          showSeekOverlay('-10s');
          break;

        case 'ArrowRight': // Tua tới 10s
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          showSeekOverlay('+10s');
          break;

        case 'ArrowUp': // Tăng âm lượng
          e.preventDefault();
          const newVolUp = Math.min(1, video.volume + 0.1);
          video.volume = newVolUp;
          setVolume(newVolUp);
          setIsMuted(false);
          showSeekOverlay(`Âm lượng: ${Math.round(newVolUp * 100)}%`);
          break;

        case 'ArrowDown': // Giảm âm lượng
          e.preventDefault();
          const newVolDown = Math.max(0, video.volume - 0.1);
          video.volume = newVolDown;
          setVolume(newVolDown);
          setIsMuted(newVolDown === 0);
          showSeekOverlay(`Âm lượng: ${Math.round(newVolDown * 100)}%`);
          break;

        case 'Escape':
        case 'Backspace': // Nút Back trên remote
          e.preventDefault();
          // Thoát toàn màn hình
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          onClose();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, onClose]);

  const showSeekOverlay = (text: string) => {
    setSeekOverlay({ show: true, text });
    if (seekOverlayTimeoutRef.current) {
      clearTimeout(seekOverlayTimeoutRef.current);
    }
    seekOverlayTimeoutRef.current = setTimeout(() => {
      setSeekOverlay(null);
    }, 1200);
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '00:00';
    const hours = Math.floor(timeInSecs / 3600);
    const minutes = Math.floor((timeInSecs % 3600) / 60);
    const seconds = Math.floor(timeInSecs % 60);

    const pad = (n: number) => (n < 10 ? `0${n}` : n);

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen bg-black overflow-hidden z-50 flex items-center justify-center cursor-none"
    >
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Center Seek/Volume Overlay Indicator */}
      {seekOverlay?.show && (
        <div className="absolute bg-black/75 px-6 py-4 rounded-2xl border border-white/10 text-white font-bold text-lg animate-scaleIn drop-shadow-lg z-30">
          {seekOverlay.text}
        </div>
      )}

      {/* TV Controls Bar overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-12 transition-opacity duration-500 z-20 space-y-6 flex flex-col justify-end ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-300 font-semibold mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden relative">
            <div
              className="bg-red-600 h-full rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Lower buttons list */}
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all font-bold text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <div className="text-xs text-gray-400 font-medium">
              Sử dụng các phím mũi tên trên Remote để: Tua phim (Trái/Phải), Tăng giảm âm lượng (Lên/Xuống), OK/Giữa để Tạm dừng.
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white" />
            )}
            {isMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
