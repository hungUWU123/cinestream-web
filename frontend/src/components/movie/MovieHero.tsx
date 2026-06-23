'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '@/types';
import { getImageUrl } from '@/types';

interface MovieHeroProps {
  movies?: Movie[];
  movie?: Movie;
}

export default function MovieHero({ movies = [], movie }: MovieHeroProps) {
  const slideMovies = movies.length > 0 ? movies : movie ? [movie] : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slideMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideMovies.length);
    }, 6000); // Auto-advance every 6 seconds
    return () => clearInterval(interval);
  }, [slideMovies.length]);

  if (slideMovies.length === 0) return null;

  const currentMovie = slideMovies[currentIndex];

  const rating =
    currentMovie.tmdbRating && currentMovie.tmdbRating > 0
      ? currentMovie.tmdbRating.toFixed(1)
      : currentMovie.imdbRating && currentMovie.imdbRating > 0
      ? currentMovie.imdbRating.toFixed(1)
      : null;

  return (
    <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden bg-black">
      {/* Background Poster Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={getImageUrl(currentMovie.posterUrl || currentMovie.thumbUrl)}
            alt={currentMovie.name}
            fill
            priority
            sizes="100vw"
            className="object-cover scale-[1.02] filter blur-[0.5px]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradients (Z-index 10) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />

      {/* Hero Content (Z-index 20) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-x-0 bottom-0 z-20 container-main pb-16 md:pb-24"
        >
          <div className="max-w-2xl space-y-4 md:space-y-6">
            {/* Badge & Meta */}
            <div className="flex flex-wrap items-center gap-3">
              {currentMovie.quality && (
                <span className="badge badge-red font-semibold">{currentMovie.quality}</span>
              )}
              {currentMovie.lang && (
                <span className="badge badge-glass font-semibold">{currentMovie.lang}</span>
              )}
              <div className="flex items-center gap-1.5 text-gray-300 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>{currentMovie.year}</span>
              </div>
              {currentMovie.time && (
                <div className="flex items-center gap-1.5 text-gray-300 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{currentMovie.time}</span>
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 backdrop-blur-sm px-2 py-0.5 rounded text-sm font-bold border border-yellow-500/30">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span>{rating}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
              {currentMovie.name}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-400 font-medium tracking-wide">
              {currentMovie.originName}
            </p>

            {/* Synopsis */}
            {currentMovie.content && (
              <p className="text-sm md:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
                {currentMovie.content}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={`/watch/${currentMovie.slug}`}
                className="btn btn-primary px-6 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all duration-300 shadow-xl shadow-red-600/25"
              >
                <Play className="w-5 h-5 fill-white" />
                Xem Phim
              </Link>
              <Link
                href={`/movies/${currentMovie.slug}`}
                className="btn btn-ghost bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all duration-300 border border-white/10 text-white"
              >
                <Info className="w-5 h-5" />
                Thông Tin
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators (Dots) */}
      {slideMovies.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {slideMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-red-600 w-6' : 'bg-white/30 hover:bg-white/60 w-1.5'
              }`}
              title={`Chuyển tới slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Buttons (Left/Right Arrows) */}
      {slideMovies.length > 1 && (
        <div className="hidden md:flex absolute bottom-6 right-6 z-30 items-center gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + slideMovies.length) % slideMovies.length)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105"
            title="Slide trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % slideMovies.length)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105"
            title="Slide sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
