'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Movie {
  id: number;
  title: string;
  release: string;
  genre: string[];
  director: string;
  cast: string[];
  description: string;
  poster: string;
  backdrop: string;
  trailer: string;
  rating: number;
  runtime: number;
  budget: string;
  studio: string;
  anticipationScore: number;
  tags: string[];
}

const upcomingMovies: Movie[] = [
  {
    id: 1,
    title: 'Skyline Rising',
    release: '2026-03-15',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    director: 'Christopher Nolan',
    cast: ['Ryan Gosling', 'Emma Stone', 'Oscar Isaac', 'Lupita Nyong\'o'],
    description: 'In a world where gravity itself becomes a weapon, a group of rebels must navigate floating cities to prevent an ecological catastrophe that threatens to tear the planet apart.',
    poster: '/assets/images/skyline-rising-poster.jpg',
    backdrop: '/assets/images/skyline-rising-backdrop.jpg',
    trailer: 'https://youtube.com/watch?v=example1',
    rating: 4.8,
    runtime: 148,
    budget: '$200M',
    studio: 'Warner Bros',
    anticipationScore: 96,
    tags: ['IMAX', 'Dolby Atmos', 'Visual Spectacle']
  },
  {
    id: 2,
    title: 'Neon Nights',
    release: '2026-04-02',
    genre: ['Drama', 'Romance', 'Neo-Noir'],
    director: 'Denis Villeneuve',
    cast: ['Zendaya', 'Timothée Chalamet', 'Michael Shannon', 'Tilda Swinton'],
    description: 'Set in a cyberpunk Tokyo, a mysterious hacker falls in love with an AI consciousness, blurring the lines between reality and digital existence in this visually stunning neo-noir thriller.',
    poster: '/assets/images/neon-nights-poster.jpg',
    backdrop: '/assets/images/neon-nights-backdrop.jpg',
    trailer: 'https://youtube.com/watch?v=example2',
    rating: 4.6,
    runtime: 135,
    budget: '$150M',
    studio: 'A24',
    anticipationScore: 92,
    tags: ['Cyberpunk', 'Visual Poetry', 'Art House']
  },
  {
    id: 3,
    title: 'Echoes of Tomorrow',
    release: '2026-05-20',
    genre: ['Adventure', 'Family', 'Fantasy'],
    director: 'Taika Waititi',
    cast: ['Tom Holland', 'Anya Taylor-Joy', 'Brian Cox', 'Cate Blanchett'],
    description: 'When a young inventor discovers a device that can glimpse into alternate timelines, they must navigate infinite possibilities to save their family from a temporal catastrophe.',
    poster: '/assets/images/echoes-poster.jpg',
    backdrop: '/assets/images/echoes-backdrop.jpg',
    trailer: 'https://youtube.com/watch?v=example3',
    rating: 4.4,
    runtime: 127,
    budget: '$180M',
    studio: 'Disney',
    anticipationScore: 89,
    tags: ['Time Travel', 'Family-Friendly', 'Adventure']
  },
  {
    id: 4,
    title: 'The Last Symphony',
    release: '2026-06-12',
    genre: ['Drama', 'Musical', 'Biography'],
    director: 'Damien Chazelle',
    cast: ['Lady Gaga', 'Adam Driver', 'Mahershala Ali', 'Meryl Streep'],
    description: 'The untold story of a legendary composer\'s final masterpiece, exploring themes of legacy, love, and the power of music to transcend time and connect souls across generations.',
    poster: '/assets/images/symphony-poster.jpg',
    backdrop: '/assets/images/symphony-backdrop.jpg',
    trailer: 'https://youtube.com/watch?v=example4',
    rating: 4.7,
    runtime: 142,
    budget: '$120M',
    studio: 'Lionsgate',
    anticipationScore: 94,
    tags: ['Oscar Contender', 'Musical', 'Emotional Journey']
  },
  {
    id: 5,
    title: 'Quantum Heist',
    release: '2026-07-04',
    genre: ['Action', 'Comedy', 'Sci-Fi'],
    director: 'Russo Brothers',
    cast: ['Chris Evans', 'Scarlett Johansson', 'Donald Glover', 'Margot Robbie'],
    description: 'A team of quantum physicists turned thieves must steal from multiple dimensions simultaneously in this mind-bending heist comedy that redefines the impossible.',
    poster: '/assets/images/quantum-heist-poster.jpg',
    backdrop: '/assets/images/quantum-heist-backdrop.jpg',
    trailer: 'https://youtube.com/watch?v=example5',
    rating: 4.3,
    runtime: 134,
    budget: '$220M',
    studio: 'Marvel Studios',
    anticipationScore: 91,
    tags: ['Summer Blockbuster', 'Comedy', 'Mind-Bending']
  },
  {
    id: 6,
    title: 'Silent Earth',
    release: '2026-08-15',
    genre: ['Horror', 'Thriller', 'Post-Apocalyptic'],
    director: 'Jordan Peele',
    cast: ['Lupita Nyong\'o', 'Daniel Kaluuya', 'Winston Duke', 'Elisabeth Moss'],
    description: 'In a world where sound attracts deadly creatures, the last survivors must find a way to communicate and rebuild society in complete silence.',
    poster: '/assets/images/silent-earth-poster.jpg',
    backdrop: '/assets/images/silent-earth-backdrop.jpg',
    trailer: 'https://youtube.com/watch?v=example6',
    rating: 4.5,
    runtime: 118,
    budget: '$90M',
    studio: 'Universal Pictures',
    anticipationScore: 88,
    tags: ['Horror', 'Innovative', 'Suspenseful']
  }
];

export default function UpcomingMoviesInteractive() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('anticipation');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredMovie, setHoveredMovie] = useState<number | null>(null);

  const genres = ['all', ...Array.from(new Set(upcomingMovies.flatMap(movie => movie.genre)))];
  const moviesPerPage = 6;

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const filteredAndSortedMovies = upcomingMovies
    .filter(movie => {
      const matchesFilter = filter === 'all' || movie.genre.includes(filter);
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          movie.director.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          movie.cast.some(actor => actor.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'anticipation':
          return b.anticipationScore - a.anticipationScore;
        case 'release':
          return new Date(a.release).getTime() - new Date(b.release).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedMovies.length / moviesPerPage);
  const currentMovies = filteredAndSortedMovies.slice(
    (currentPage - 1) * moviesPerPage,
    currentPage * moviesPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Released';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getAnticipationColor = (score: number) => {
    if (score >= 95) return 'text-green-500';
    if (score >= 90) return 'text-blue-500';
    if (score >= 85) return 'text-yellow-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Upcoming Movies 2026
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Discover the most anticipated films of the year. From blockbuster spectacles to indie masterpieces.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-lg">
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                🎬 {upcomingMovies.length} Movies
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                🏆 {upcomingMovies.filter(m => m.anticipationScore > 90).length} Highly Anticipated
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                🎭 {genres.length - 1} Genres
              </span>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Filters and Search */}
      <section className="container mx-auto px-4 py-8 sticky top-32 bg-background/95 backdrop-blur-sm z-20 border-b">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search movies, directors, actors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="anticipation">Most Anticipated</option>
              <option value="release">Release Date</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {currentMovies.length} of {filteredAndSortedMovies.length} movies
          </div>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={filter + sortBy + searchTerm + currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {currentMovies.map((movie, index) => (
              <motion.article
                key={movie.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                onMouseEnter={() => setHoveredMovie(movie.id)}
                onMouseLeave={() => setHoveredMovie(null)}
                onClick={() => setSelectedMovie(movie)}
              >
                {/* Movie Poster */}
                <div className="relative h-80 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-6xl">
                    🎬
                  </div>
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
                    {formatDate(movie.release)}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold flex items-center gap-1">
                    ⭐ {movie.rating}
                  </div>
                  
                  {/* Anticipation Score */}
                  <div className={`absolute bottom-4 left-4 font-bold text-lg ${getAnticipationColor(movie.anticipationScore)}`}>
                    {movie.anticipationScore}% 🔥
                  </div>
                  
                  {/* Hover Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredMovie === movie.id ? 1 : 0 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2">
                      ▶️ Watch Trailer
                    </button>
                  </motion.div>
                </div>
                
                {/* Movie Info */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {movie.genre.slice(0, 2).map(g => (
                      <span key={g} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {movie.title}
                  </h2>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {movie.description}
                  </p>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>🎬 <strong>Director:</strong> {movie.director}</div>
                    <div>⭐ <strong>Cast:</strong> {movie.cast.slice(0, 2).join(', ')}{movie.cast.length > 2 && '...'}</div>
                    <div>🏢 <strong>Studio:</strong> {movie.studio}</div>
                    <div>⏱️ <strong>Runtime:</strong> {movie.runtime} min</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {movie.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                    Learn More
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              ← Previous
            </button>
            
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'border hover:bg-gray-100'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* Movie Detail Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-80 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-gray-500 text-8xl">🎬</div>
                <button
                  onClick={() => setSelectedMovie(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMovie.genre.map(g => (
                    <span key={g} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {g}
                    </span>
                  ))}
                </div>
                
                <h1 className="text-4xl font-bold mb-4">{selectedMovie.title}</h1>
                
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Movie Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Release Date:</strong> {new Date(selectedMovie.release).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div><strong>Director:</strong> {selectedMovie.director}</div>
                      <div><strong>Runtime:</strong> {selectedMovie.runtime} minutes</div>
                      <div><strong>Studio:</strong> {selectedMovie.studio}</div>
                      <div><strong>Budget:</strong> {selectedMovie.budget}</div>
                      <div className="flex items-center gap-2">
                        <strong>Anticipation Score:</strong> 
                        <span className={`font-bold ${getAnticipationColor(selectedMovie.anticipationScore)}`}>
                          {selectedMovie.anticipationScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cast</h3>
                    <div className="space-y-1 text-sm">
                      {selectedMovie.cast.map(actor => (
                        <div key={actor} className="text-gray-700">{actor}</div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Synopsis</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedMovie.description}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovie.tags.map(tag => (
                      <span key={tag} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    🎬 Watch Trailer
                  </button>
                  <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    📅 Add to Watchlist
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    🔔 Set Reminder
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
