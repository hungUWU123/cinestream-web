import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/movies/${slug}`, {
      next: { revalidate: 3600 }, // Cache dynamic metadata for 1 hour
    });

    if (!response.ok) throw new Error('Failed to fetch movie');
    const movie = await response.json();

    if (!movie) {
      return {
        title: 'Xem Phim Hay - HùngCinema',
        description: 'Xem phim vietsub chất lượng cao tại HùngCinema.',
      };
    }

    const title = `Xem Phim ${movie.name} (${movie.originName}) [${movie.year}] - HùngCinema`;
    const description = `Xem phim ${movie.name} (${movie.originName}) chất lượng HD Vietsub miễn phí. ${
      movie.content ? movie.content.slice(0, 150) + '...' : ''
    }`;

    let imageUrl = '';
    if (movie.posterUrl) {
      imageUrl = movie.posterUrl.startsWith('http')
        ? movie.posterUrl
        : `${apiUrl}/../uploads/${movie.posterUrl}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'video.episode',
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
    };
  } catch (error) {
    return {
      title: 'HùngCinema - Xem Phim Hay HD Vietsub',
      description: 'Xem phim Full HD/4K vietsub thuyết minh nhanh nhất, chất lượng tốt nhất.',
    };
  }
}

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
