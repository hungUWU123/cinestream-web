'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Eye, Play } from 'lucide-react';
import type { Movie } from '@/types';
import { getImageUrl } from '@/types';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const rating = movie.userRatingAvg && movie.userRatingAvg > 0
    ? movie.userRatingAvg.toFixed(1)
    : movie.tmdbRating && movie.tmdbRating > 0
    ? movie.tmdbRating.toFixed(1)
    : movie.imdbRating && movie.imdbRating > 0
    ? movie.imdbRating.toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/movies/${movie.slug}`} className="block movie-card group">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={getImageUrl(movie.thumbUrl || movie.posterUrl)}
            alt={movie.name}
            fill
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-white ml-1" />
            </div>
          </div>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {movie.quality && (
              <span className="badge badge-red text-[10px]">{movie.quality}</span>
            )}
            {movie.type === 'SERIES' && movie.episodeCurrent && (
              <span className="badge badge-glass text-[10px]">{movie.episodeCurrent}</span>
            )}
          </div>

          {/* Rating */}
          {rating && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-white font-semibold">{rating}</span>
              </div>
            </div>
          )}

          {/* Bottom Info on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-2 text-gray-300">
              {movie.lang && (
                <span className="text-[10px] font-medium">{movie.lang}</span>
              )}
              {movie.viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px]">{(movie.viewCount / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-2">
          <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
            {movie.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{movie.originName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600">{movie.year}</span>
            {movie.genres && movie.genres.length > 0 && (
              <span className="text-xs text-gray-600 truncate">
                {movie.genres[0].genre.name}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Skeleton version
export function MovieCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[2/3] rounded-[var(--radius-md)]" />
      <div className="p-2 space-y-2">
        <div className="skeleton h-3.5 rounded w-4/5" />
        <div className="skeleton h-2.5 rounded w-3/5" />
      </div>
    </div>
  );
}
