"use client";

import { useState } from 'react';
import AggregatedScores from './AggregatedScores';
import FilterBar from './FilterBar';
import ReviewsList from './ReviewsList';

interface Review {
  id: string;
  movieTitle: string;
  moviePoster: string;
  moviePosterAlt: string;
  author: string;
  avatar: string;
  avatarAlt: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
  verified: boolean;
}

interface AggregatedRatings {
  imdb: {score: number;votes: string;};
  rottenTomatoes: {critics: number;audience: number;};
  aggregated: number;
  totalReviews: number;
  averageRating: number;
}

export default function ReviewsInteractive() {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const aggregatedRatings: AggregatedRatings = {
    imdb: { score: 8.7, votes: '2.4M' },
    rottenTomatoes: { critics: 92, audience: 88 },
    aggregated: 89,
    totalReviews: 1847,
    averageRating: 4.3
  };

  const allReviews: Review[] = [
  {
    id: 'review_1',
    movieTitle: 'The Stellar Journey',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_146821808-1768161022230.png",
    moviePosterAlt: 'The Stellar Journey movie poster',
    author: 'Sarah Mitchell',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_115b700a9-1763294224785.png",
    avatarAlt: 'Sarah Mitchell profile photo',
    rating: 5,
    date: '2026-02-05T14:30:00Z',
    content:
    'An absolute masterpiece! The cinematography is breathtaking, and the emotional depth of the story left me in tears. Christopher Nolan has outdone himself with this one. The performances are stellar, especially McConaughey\'s portrayal of a father torn between duty and love. A must-watch for any sci-fi enthusiast.',
    helpful: 342,
    verified: true
  },
  {
    id: 'review_2',
    movieTitle: 'The Stellar Journey',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_146821808-1768161022230.png",
    moviePosterAlt: 'The Stellar Journey movie poster',
    author: 'Marcus Chen',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1c1934fbd-1763293154553.png",
    avatarAlt: 'Marcus Chen profile photo',
    rating: 4,
    date: '2026-02-04T09:15:00Z',
    content:
    'Visually stunning and intellectually engaging. The science behind the story is well-researched, though some plot points felt a bit rushed. The soundtrack by Hans Zimmer is hauntingly beautiful. Overall, a solid 4 stars for an ambitious and thought-provoking film.',
    helpful: 218,
    verified: true
  },
  {
    id: 'review_3',
    movieTitle: 'Crimson Horizon',
    moviePoster: "https://images.unsplash.com/photo-1468527873268-f09d466af3c6",
    moviePosterAlt: 'Crimson Horizon movie poster',
    author: 'Emily Rodriguez',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png",
    avatarAlt: 'Emily Rodriguez profile photo',
    rating: 5,
    date: '2026-02-03T18:45:00Z',
    content:
    'This film exceeded all my expectations! The action sequences are perfectly choreographed, and the character development is exceptional. The twist at the end completely caught me off guard. I\'ve already watched it twice and plan to see it again. Highly recommended!',
    helpful: 456,
    verified: true
  },
  {
    id: 'review_4',
    movieTitle: 'Echoes of Tomorrow',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_17923adc8-1766517393557.png",
    moviePosterAlt: 'Echoes of Tomorrow movie poster',
    author: 'David Thompson',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1bf0c7d42-1763291659174.png",
    avatarAlt: 'David Thompson profile photo',
    rating: 3,
    date: '2026-02-02T11:20:00Z',
    content:
    'A decent watch with some interesting concepts, but the pacing felt uneven. The first half was engaging, but the second half dragged a bit. The special effects are top-notch, and the cast delivers solid performances. Worth watching if you\'re a fan of the genre.',
    helpful: 127,
    verified: false
  },
  {
    id: 'review_5',
    movieTitle: 'The Stellar Journey',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_146821808-1768161022230.png",
    moviePosterAlt: 'The Stellar Journey movie poster',
    author: 'Jessica Park',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_12800f9da-1763297638844.png",
    avatarAlt: 'Jessica Park profile photo',
    rating: 5,
    date: '2026-02-01T16:00:00Z',
    content:
    'One of the best films I\'ve seen in years! The emotional resonance is powerful, and the themes of love transcending time and space are beautifully executed. Anne Hathaway and Matthew McConaughey have incredible chemistry. The ending left me speechless.',
    helpful: 389,
    verified: true
  },
  {
    id: 'review_6',
    movieTitle: 'Midnight Serenade',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_19de7306d-1770610893944.png",
    moviePosterAlt: 'Midnight Serenade movie poster',
    author: 'Alex Johnson',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d3c47105-1763293003147.png",
    avatarAlt: 'Alex Johnson profile photo',
    rating: 4,
    date: '2026-01-31T13:30:00Z',
    content:
    'A beautifully crafted romantic drama with stellar performances. The cinematography captures the mood perfectly, and the soundtrack is enchanting. Some scenes felt a bit slow, but overall it\'s a touching and memorable film. Great for a cozy movie night.',
    helpful: 203,
    verified: true
  },
  {
    id: 'review_7',
    movieTitle: 'The Stellar Journey',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_146821808-1768161022230.png",
    moviePosterAlt: 'The Stellar Journey movie poster',
    author: 'Michael Brown',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1bf0c7d42-1763291659174.png",
    avatarAlt: 'Michael Brown profile photo',
    rating: 2,
    date: '2026-01-30T10:15:00Z',
    content:
    'While the visuals are impressive, I found the story to be overly complicated and confusing. The runtime is too long, and some scenes could have been cut. It\'s not a bad film, but it didn\'t live up to the hype for me. Fans of complex narratives might enjoy it more.',
    helpful: 89,
    verified: false
  },
  {
    id: 'review_8',
    movieTitle: 'Crimson Horizon',
    moviePoster: "https://images.unsplash.com/photo-1468527873268-f09d466af3c6",
    moviePosterAlt: 'Crimson Horizon movie poster',
    author: 'Olivia Martinez',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b86c5c3e-1763301834510.png",
    avatarAlt: 'Olivia Martinez profile photo',
    rating: 5,
    date: '2026-01-29T15:45:00Z',
    content:
    'Absolutely phenomenal! The director\'s vision is clear in every frame. The performances are raw and authentic, and the story is both thrilling and emotionally resonant. This is cinema at its finest. I can\'t recommend it enough!',
    helpful: 521,
    verified: true
  },
  {
    id: 'review_9',
    movieTitle: 'Echoes of Tomorrow',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_17923adc8-1766517393557.png",
    moviePosterAlt: 'Echoes of Tomorrow movie poster',
    author: 'Daniel Lee',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ae0f3431-1763296290027.png",
    avatarAlt: 'Daniel Lee profile photo',
    rating: 4,
    date: '2026-01-28T12:00:00Z',
    content:
    'A thought-provoking film with excellent world-building. The premise is intriguing, and the execution is mostly solid. Some dialogue felt a bit forced, but the overall experience was enjoyable. The ending sets up a potential sequel nicely.',
    helpful: 165,
    verified: true
  },
  {
    id: 'review_10',
    movieTitle: 'The Stellar Journey',
    moviePoster: "https://img.rocket.new/generatedImages/rocket_gen_img_146821808-1768161022230.png",
    moviePosterAlt: 'The Stellar Journey movie poster',
    author: 'Sophia Williams',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png",
    avatarAlt: 'Sophia Williams profile photo',
    rating: 5,
    date: '2026-01-27T08:30:00Z',
    content:
    'A cinematic triumph! Every aspect of this film is meticulously crafted. The performances are outstanding, the score is unforgettable, and the visuals are awe-inspiring. This is the kind of film that reminds you why you love movies. A true masterpiece!',
    helpful: 612,
    verified: true
  }];


  // Filter reviews by rating
  const filteredReviews = selectedRating ?
  allReviews.filter((review) => review.rating === selectedRating) :
  allReviews;

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'helpful') {
      return b.helpful - a.helpful;
    } else if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      {/* Page Header */}
      <div className="mb-12 animate-fade-in-up">
        <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
          Reviews & Ratings
        </h1>
        <p className="text-neutral-400 text-lg max-w-3xl">
          Explore comprehensive reviews from our community, aggregated scores from
          IMDb and Rotten Tomatoes, and find the perfect movie for your next watch.
        </p>
      </div>

      {/* Aggregated Scores */}
      <AggregatedScores ratings={aggregatedRatings} />

      {/* Filter Bar */}
      <FilterBar
        selectedRating={selectedRating}
        onRatingChange={setSelectedRating}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalReviews={filteredReviews.length} />
      

      {/* Reviews List */}
      <ReviewsList reviews={sortedReviews} />
    </div>);

}