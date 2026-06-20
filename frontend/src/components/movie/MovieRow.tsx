'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard, { MovieCardSkeleton } from './MovieCard';
import type { Movie } from '@/types';
import Link from 'next/link';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
  viewAllLink?: string;
  icon?: React.ReactNode;
}

export default function MovieRow({ title, movies, loading, viewAllLink, icon }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.7;
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title flex items-center gap-2">
          {icon && <span className="text-red-500">{icon}</span>}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link href={viewAllLink} className="text-sm text-gray-400 hover:text-red-400 transition-colors mr-2">
              Xem tất cả →
            </Link>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row */}
      <div ref={rowRef} className="movies-row">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: 180, flexShrink: 0 }}>
                <MovieCardSkeleton />
              </div>
            ))
          : movies.map((movie, i) => (
              <div key={movie.id} style={{ width: 180, flexShrink: 0 }}>
                <MovieCard movie={movie} index={i} />
              </div>
            ))}
      </div>
    </section>
  );
}
