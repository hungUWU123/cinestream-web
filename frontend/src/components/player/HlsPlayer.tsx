'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Settings } from 'lucide-react';
import { watchHistoryAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface HlsPlayerProps {
  src: string;
  movieId: string;
  episodeId: string;
  initialProgress?: number; // in seconds
  onProgressSave?: (progress: number) => void;
}

export default function HlsPlayer({
  src,
  movieId,
  episodeId,
  initialProgress = 0,
  onProgressSave,
}: HlsPlayerProps) {
  const { isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // States for custom player controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHlsActive, setIsHlsActive] = useState(false);

  // Progress update ref to debounce API calls
  const lastSavedProgressRef = useRef<number>(0);

  // 1. Initialize Player & HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsHlsActive(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Load stream
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
        // Seek to initialProgress once ready
        if (initialProgress > 0) {
          video.currentTime = initialProgress;
        }
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
              // Cannot recover
              hls.destroy();
              setIsHlsActive(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari native HLS support
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (initialProgress > 0) {
          video.currentTime = initialProgress;
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialProgress]);

  // 2. Track Playback & Save History
  const saveProgress = async (progressTime: number, durationTime: number) => {
    if (!isAuthenticated || !movieId || !episodeId || durationTime <= 0) return;
    
    // Only save if progress has changed by more than 8 seconds
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
      console.error('Error saving watch history:', err);
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

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
      // Immediately save progress on pause
      saveProgress(video.currentTime, video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  // Sync fullscreen state from browser/OS events to avoid desync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Sync iOS native fullscreen events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWebkitBegin = () => setIsFullscreen(true);
    const handleWebkitEnd = () => setIsFullscreen(false);

    video.addEventListener('webkitbeginfullscreen', handleWebkitBegin);
    video.addEventListener('webkitendfullscreen', handleWebkitEnd);

    return () => {
      video.removeEventListener('webkitbeginfullscreen', handleWebkitBegin);
      video.removeEventListener('webkitendfullscreen', handleWebkitEnd);
    };
  }, []);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // Check if it's iOS (iPhone/iPad) which doesn't support requestFullscreen on div elements
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS && typeof (video as any).webkitEnterFullscreen === 'function') {
      try {
        (video as any).webkitEnterFullscreen();
      } catch (err) {
        console.error('Error entering iOS fullscreen:', err);
      }
      return;
    }

    // Standard Fullscreen API for other devices
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Keep controls visible on mouse move
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  // Format seconds to MM:SS or HH:MM:SS
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
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 group shadow-2xl"
    >
      <video
        ref={videoRef}
        onClick={handlePlayPause}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4 transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-white/90 drop-shadow">
            HLS Stream {isHlsActive ? 'Active' : 'Fallback'}
          </span>
        </div>

        {/* Bottom bar controls */}
        <div className="space-y-3">
          {/* Progress timeline */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300 font-medium select-none">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-red-600 h-1 rounded-lg bg-white/20 cursor-pointer transition-all hover:h-1.5"
            />
            <span className="text-xs text-gray-300 font-medium select-none">{formatTime(duration)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Play / Pause */}
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-red-500 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              {/* Skip backward 10s */}
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime -= 10;
                }}
                className="text-white hover:text-red-500 transition-colors"
                title="Tua lại 10s"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden md:block w-0 group-hover/volume:w-20 accent-red-600 h-1 rounded bg-white/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
