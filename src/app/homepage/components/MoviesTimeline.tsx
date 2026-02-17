"use client";

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Movie {
  id: string;
  title: string;
  releaseDate: string;
  cast: string[];
  genre: string;
  poster: string;
  alt: string;
}

export default function MoviesTimeline() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const movies: Movie[] = [
  {
    id: 'movie_1',
    title: 'Spider-Man: Beyond',
    releaseDate: 'Mar 15, 2026',
    cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch'],
    genre: 'Action, Superhero',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_124fe76af-1764763084150.png",
    alt: 'Dramatic superhero movie poster with city skyline at night'
  },
  {
    id: 'movie_2',
    title: 'The Last Symphony',
    releaseDate: 'Apr 22, 2026',
    cast: ['Emma Watson', 'Timothée Chalamet', 'Saoirse Ronan'],
    genre: 'Drama, Romance',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1d16b6d34-1770609260183.png",
    alt: 'Elegant period drama poster with classical music theme'
  },
  {
    id: 'movie_3',
    title: 'Deadpool 3',
    releaseDate: 'May 8, 2026',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    genre: 'Action, Comedy',
    poster: "https://images.unsplash.com/photo-1667314072951-e152741b37b9",
    alt: 'Bold action comedy poster with vibrant red and black colors'
  },
  {
    id: 'movie_4',
    title: 'Dune: Messiah',
    releaseDate: 'Jun 12, 2026',
    cast: ['Timothée Chalamet', 'Zendaya', 'Florence Pugh'],
    genre: 'Sci-Fi, Adventure',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_13d440ff9-1770609261588.png",
    alt: 'Epic science fiction poster with desert landscape and stars'
  },
  {
    id: 'movie_5',
    title: 'Thor: Ragnarok Returns',
    releaseDate: 'Jul 20, 2026',
    cast: ['Chris Hemsworth', 'Natalie Portman', 'Christian Bale'],
    genre: 'Action, Fantasy',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_15a3fd607-1770609262664.png",
    alt: 'Powerful fantasy poster with lightning and mythological themes'
  },
  {
    id: 'movie_6',
    title: 'Barbie: Dream World',
    releaseDate: 'Aug 5, 2026',
    cast: ['Margot Robbie', 'Ryan Gosling', 'Issa Rae'],
    genre: 'Comedy, Fantasy',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_13520db80-1765810342762.png",
    alt: 'Vibrant pink and colorful poster with whimsical design'
  },
  {
    id: 'movie_7',
    title: 'The Dark Knight Returns',
    releaseDate: 'Sep 18, 2026',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Colin Farrell'],
    genre: 'Action, Thriller',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1e365d242-1766936318654.png",
    alt: 'Dark and gritty superhero poster with Gotham City backdrop'
  },
  {
    id: 'movie_8',
    title: 'Oppenheimer: Legacy',
    releaseDate: 'Oct 10, 2026',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'],
    genre: 'Drama, Biography',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1394da3a0-1765262083518.png",
    alt: 'Historical drama poster with atomic explosion imagery'
  },
  {
    id: 'movie_9',
    title: 'Avatar: The Seed Bearer',
    releaseDate: 'Nov 15, 2026',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
    genre: 'Sci-Fi, Adventure',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_1ef47f866-1770609260671.png",
    alt: 'Stunning sci-fi poster with bioluminescent alien world'
  },
  {
    id: 'movie_10',
    title: 'Wonka: The Golden Ticket',
    releaseDate: 'Dec 20, 2026',
    cast: ['Timothée Chalamet', 'Olivia Colman', 'Hugh Grant'],
    genre: 'Fantasy, Musical',
    poster: "https://img.rocket.new/generatedImages/rocket_gen_img_157c0a4cb-1765810344932.png",
    alt: 'Magical fantasy poster with chocolate factory and golden accents'
  }];


  const handlePrev = () => {
    setSelectedIndex((prev) => prev === 0 ? movies.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => prev === movies.length - 1 ? 0 : prev + 1);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-montserrat text-xs uppercase tracking-wider text-primary mb-4 block">
            Coming Soon
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            Upcoming Movies
          </h2>
          <p className="font-inter text-lg text-neutral-400 max-w-2xl mx-auto">
            Mark your calendar for the most anticipated releases of 2026
          </p>
        </div>

        {/* Timeline Navigation */}
        <div className="relative mb-12">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePrev}
              className="glass-card p-3 rounded-full hover:glow-gold transition-all">
              
              <Icon name="ChevronLeftIcon" size={20} className="text-white" />
            </button>
            <div className="flex-1 mx-8 overflow-x-auto custom-scrollbar">
              <div className="flex gap-4 min-w-max">
                {movies.map((movie, index) =>
                <button
                  key={movie.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full transition-all ${
                  index === selectedIndex ?
                  'bg-primary text-black font-medium' : 'glass-card text-neutral-400 hover:text-white'}`
                  }>
                  
                    <span className="text-sm whitespace-nowrap">{movie.releaseDate}</span>
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={handleNext}
              className="glass-card p-3 rounded-full hover:glow-gold transition-all">
              
              <Icon name="ChevronRightIcon" size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Selected Movie Display */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          style={{ opacity: isHydrated ? 1 : 0 }}>
          
          {/* Movie Poster */}
          <div className="glass-card rounded-3xl overflow-hidden hover:glow-gold transition-all duration-500">
            <div className="relative aspect-[2/3]">
              <AppImage
                src={movies[selectedIndex].poster}
                alt={movies[selectedIndex].alt}
                className="w-full h-full object-cover" />
              
              <div className="absolute top-6 right-6">
                <span className="glass-card px-4 py-2 rounded-full text-sm font-medium text-white">
                  {movies[selectedIndex].genre}
                </span>
              </div>
            </div>
          </div>

          {/* Movie Details */}
          <div className="space-y-8">
            <div>
              <span className="text-sm text-neutral-500 mb-2 block">
                {movies[selectedIndex].releaseDate}
              </span>
              <h3 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
                {movies[selectedIndex].title}
              </h3>
              <p className="text-base text-neutral-400 mb-6">
                An epic cinematic experience featuring an all-star cast and groundbreaking
                visual effects.
              </p>
            </div>

            {/* Cast */}
            <div>
              <h4 className="font-montserrat text-xs uppercase tracking-wider text-primary mb-4">
                Starring
              </h4>
              <div className="flex flex-wrap gap-3">
                {movies[selectedIndex].cast.map((actor, idx) =>
                <span
                  key={`cast_${idx}`}
                  className="glass-card px-4 py-2 rounded-full text-sm text-white">
                  
                    {actor}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="glass-card px-8 py-4 rounded-full hover:glow-gold transition-all flex-1">
                <span className="text-base font-medium text-white">Watch Trailer</span>
              </button>
              <button className="glass-card p-4 rounded-full hover:glow-gold transition-all">
                <Icon name="BookmarkIcon" size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>);

}