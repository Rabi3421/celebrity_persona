"use client";

import { useState } from 'react';
import MovieHero from './MovieHero';
import SynopsisCast from './SynopsisCast';
import RatingsSection from './RatingsSection';
import UserReviews from './UserReviews';

interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string[];
  director: string;
  runtime: string;
  poster: string;
  posterAlt: string;
  backdrop: string;
  backdropAlt: string;
  synopsis: string;
  cast: Array<{
    id: string;
    name: string;
    character: string;
    image: string;
    imageAlt: string;
  }>;
  ratings: {
    imdb: {score: number;votes: string;};
    rottenTomatoes: {critics: number;audience: number;};
    aggregated: number;
  };
  reviews: Array<{
    id: string;
    author: string;
    avatar: string;
    avatarAlt: string;
    rating: number;
    date: string;
    content: string;
    helpful: number;
  }>;
}

export default function MovieDetailsInteractive() {
  const movies: Movie[] = [
  {
    id: 'movie_1',
    title: 'The Stellar Journey',
    year: 2026,
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    director: 'Christopher Nolan',
    runtime: '2h 45m',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_10b87f808-1767099695114.png",
    posterAlt: 'Movie poster showing dramatic space scene with astronaut',
    backdrop: "https://images.unsplash.com/photo-1681233774177-d48b941efb96",
    backdropAlt: 'Cinematic backdrop with stars and nebula',
    synopsis:
    'In a future where humanity faces extinction, a team of astronauts embarks on a perilous journey through a wormhole to find a new home for mankind. As they traverse distant galaxies, they confront the mysteries of time, space, and the human spirit. This epic tale explores themes of love, sacrifice, and the indomitable will to survive against all odds.',
    cast: [
    {
      id: 'cast_1',
      name: 'Matthew McConaughey',
      character: 'Cooper',
      image: "https://images.unsplash.com/photo-1662032370568-3ea9738888c7",
      imageAlt: 'Matthew McConaughey in astronaut suit'
    },
    {
      id: 'cast_2',
      name: 'Anne Hathaway',
      character: 'Brand',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1bf522312-1763300682862.png",
      imageAlt: 'Anne Hathaway in space mission gear'
    },
    {
      id: 'cast_3',
      name: 'Jessica Chastain',
      character: 'Murph',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d9365ee3-1767273466450.png",
      imageAlt: 'Jessica Chastain as scientist'
    },
    {
      id: 'cast_4',
      name: 'Michael Caine',
      character: 'Professor Brand',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_151a0ba56-1763293199705.png",
      imageAlt: 'Michael Caine as professor'
    }],

    ratings: {
      imdb: { score: 8.7, votes: '1.8M' },
      rottenTomatoes: { critics: 92, audience: 88 },
      aggregated: 89
    },
    reviews: [
    {
      id: 'review_1',
      author: 'Sarah Mitchell',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_115b700a9-1763294224785.png",
      avatarAlt: 'Sarah Mitchell profile picture',
      rating: 5,
      date: '2026-01-15',
      content:
      'An absolute masterpiece! The visuals are stunning, and the emotional depth is incredible. Nolan has outdone himself with this one. The way time dilation is portrayed is both scientifically accurate and emotionally devastating.',
      helpful: 342
    },
    {
      id: 'review_2',
      author: 'James Rodriguez',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1dc64ab65-1763293842844.png",
      avatarAlt: 'James Rodriguez profile picture',
      rating: 4,
      date: '2026-01-20',
      content:
      'Visually spectacular with great performances. Some plot points were confusing, but overall a thrilling experience. The soundtrack by Hans Zimmer elevates every scene to epic proportions.',
      helpful: 189
    },
    {
      id: 'review_3',
      author: 'Emily Chen',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png",
      avatarAlt: 'Emily Chen profile picture',
      rating: 5,
      date: '2026-01-25',
      content:
      'This movie changed my perspective on space exploration. The father-daughter relationship at the core of the story is beautifully portrayed. A must-watch for sci-fi fans!',
      helpful: 276
    }]

  }];


  const [selectedMovie] = useState<Movie>(movies[0]);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      <MovieHero movie={selectedMovie} />
      <div className="mt-12 space-y-12">
        <SynopsisCast
          synopsis={selectedMovie.synopsis}
          cast={selectedMovie.cast} />
        
        <RatingsSection ratings={selectedMovie.ratings} />
        <UserReviews reviews={selectedMovie.reviews} />
      </div>
    </div>);

}