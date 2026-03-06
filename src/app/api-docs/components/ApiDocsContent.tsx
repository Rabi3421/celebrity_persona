'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://celebritypersona.com';

interface Param {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
  values?: string;
}

interface Endpoint {
  id: string;
  method: 'GET';
  path: string;
  summary: string;
  params?: Param[];
  pathParams?: Param[];
  curlExample: string;
  jsExample: string;
  responseExample: string;
}

interface Section {
  id: string;
  label: string;
  icon: string;
  color: string;
  badge: string;
  badgeBg: string;
  description: string;
  baseUrl: string;
  endpoints: Endpoint[];
}

const sections: Section[] = [
  // ── CELEBRITIES ──────────────────────────────────────────────────────────
  {
    id: 'celebrities',
    label: 'Celebrities',
    icon: 'StarIcon',
    color: 'text-primary',
    badge: 'text-primary',
    badgeBg: 'bg-primary/10 border-primary/20',
    description:
      'Retrieve celebrity profiles including their biography, physical attributes, filmography, social media, and more.',
    baseUrl: `${BASE}/api/v1/celebrities`,
    endpoints: [
      {
        id: 'celebrities-list',
        method: 'GET',
        path: '/api/v1/celebrities',
        summary: 'List celebrities',
        params: [
          { name: 'page',        type: 'integer', required: false, default: '1',      description: 'Page number for pagination.' },
          { name: 'limit',       type: 'integer', required: false, default: '20',     description: 'Number of results per page. Maximum: 50.' },
          { name: 'search',      type: 'string',  required: false,                    description: 'Search celebrities by name (case-insensitive).' },
          { name: 'occupation',  type: 'string',  required: false,                    description: 'Filter by occupation (e.g. Actor, Singer).' },
          { name: 'nationality', type: 'string',  required: false,                    description: 'Filter by nationality (e.g. American, British).' },
          { name: 'sort',        type: 'string',  required: false, default: 'latest', description: 'Sort order.', values: 'latest · oldest · name_asc · name_desc' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/celebrities?page=1&limit=10&sort=latest" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/celebrities?page=1&limit=10&sort=latest',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data, pagination } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "celebrities",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 248,
    "pages": 25
  },
  "data": [
    {
      "_id": "64f3a1b2c8d9e0f1a2b3c4d5",
      "name": "Ryan Gosling",
      "slug": "ryan-gosling",
      "profileImage": "https://cdn.example.com/ryan-gosling.jpg",
      "occupation": ["Actor", "Director"],
      "nationality": "Canadian",
      "netWorth": "$70 million",
      "born": "1980-11-12",
      "age": 45,
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}`,
      },
      {
        id: 'celebrities-single',
        method: 'GET',
        path: '/api/v1/celebrities/{slug}',
        summary: 'Get celebrity by slug',
        pathParams: [
          { name: 'slug', type: 'string', required: true, description: 'The URL-safe slug of the celebrity (e.g. ryan-gosling).' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/celebrities/ryan-gosling" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/celebrities/ryan-gosling',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "celebrities",
  "data": {
    "_id": "64f3a1b2c8d9e0f1a2b3c4d5",
    "name": "Ryan Gosling",
    "slug": "ryan-gosling",
    "born": "1980-11-12",
    "birthPlace": "London, Ontario, Canada",
    "age": 45,
    "nationality": "Canadian",
    "occupation": ["Actor", "Director"],
    "height": "6 ft 0 in",
    "netWorth": "$70 million",
    "introduction": "Ryan Thomas Gosling is a Canadian actor...",
    "career": "Gosling began his career as a child actor...",
    "socialMedia": {
      "instagram": "https://instagram.com/ryangosling"
    },
    "profileImage": "https://cdn.example.com/ryan-gosling.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}`,
      },
    ],
  },

  // ── OUTFITS ──────────────────────────────────────────────────────────────
  {
    id: 'outfits',
    label: 'Outfits',
    icon: 'SparklesIcon',
    color: 'text-secondary',
    badge: 'text-secondary',
    badgeBg: 'bg-secondary/10 border-secondary/20',
    description:
      'Browse celebrity outfit collections including designer details, purchase links, event context, and brand information.',
    baseUrl: `${BASE}/api/v1/outfits`,
    endpoints: [
      {
        id: 'outfits-list',
        method: 'GET',
        path: '/api/v1/outfits',
        summary: 'List outfits',
        params: [
          { name: 'page',      type: 'integer', required: false, default: '1',      description: 'Page number for pagination.' },
          { name: 'limit',     type: 'integer', required: false, default: '20',     description: 'Number of results per page. Maximum: 50.' },
          { name: 'search',    type: 'string',  required: false,                    description: 'Search outfits by title.' },
          { name: 'celebrity', type: 'string',  required: false,                    description: 'Filter by celebrity slug (e.g. ryan-gosling).' },
          { name: 'category',  type: 'string',  required: false,                    description: 'Filter by outfit category (e.g. Casual, Formal).' },
          { name: 'brand',     type: 'string',  required: false,                    description: 'Filter by brand name.' },
          { name: 'sort',      type: 'string',  required: false, default: 'latest', description: 'Sort order.', values: 'latest · oldest · popular · title_asc' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/outfits?celebrity=ryan-gosling&limit=5" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/outfits?celebrity=ryan-gosling&limit=5',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data, pagination } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "outfits",
  "pagination": { "page": 1, "limit": 5, "total": 38, "pages": 8 },
  "data": [
    {
      "_id": "65a4b2c3d4e5f6a7b8c9d0e1",
      "title": "Met Gala 2024 Look",
      "slug": "ryan-gosling-met-gala-2024",
      "celebrity": {
        "name": "Ryan Gosling",
        "slug": "ryan-gosling",
        "profileImage": "https://cdn.example.com/ryan-gosling.jpg"
      },
      "images": ["https://cdn.example.com/outfit1.jpg"],
      "event": "Met Gala 2024",
      "designer": "Gucci",
      "brand": "Gucci",
      "category": "Formal",
      "color": "Black",
      "price": "$4,500",
      "purchaseLink": "https://gucci.com/...",
      "tags": ["Met Gala", "Gucci", "Tuxedo"],
      "likesCount": 1240,
      "isFeatured": true,
      "createdAt": "2024-05-07T12:00:00.000Z"
    }
  ]
}`,
      },
      {
        id: 'outfits-single',
        method: 'GET',
        path: '/api/v1/outfits/{slug}',
        summary: 'Get outfit by slug',
        pathParams: [
          { name: 'slug', type: 'string', required: true, description: 'The URL-safe slug of the outfit.' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/outfits/ryan-gosling-met-gala-2024" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/outfits/ryan-gosling-met-gala-2024',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "outfits",
  "data": {
    "_id": "65a4b2c3d4e5f6a7b8c9d0e1",
    "title": "Met Gala 2024 Look",
    "slug": "ryan-gosling-met-gala-2024",
    "celebrity": {
      "name": "Ryan Gosling",
      "slug": "ryan-gosling",
      "nationality": "Canadian"
    },
    "images": ["https://cdn.example.com/outfit1.jpg"],
    "event": "Met Gala 2024",
    "designer": "Gucci",
    "description": "A stunning black tuxedo with gold lapels...",
    "tags": ["Met Gala", "Gucci", "Tuxedo"],
    "purchaseLink": "https://gucci.com/...",
    "price": "$4,500",
    "brand": "Gucci",
    "category": "Formal",
    "likesCount": 1240,
    "createdAt": "2024-05-07T12:00:00.000Z"
  }
}`,
      },
    ],
  },

  // ── NEWS ─────────────────────────────────────────────────────────────────
  {
    id: 'news',
    label: 'News',
    icon: 'NewspaperIcon',
    color: 'text-accent',
    badge: 'text-accent',
    badgeBg: 'bg-accent/10 border-accent/20',
    description:
      'Access celebrity news articles including full content, category, author, associated celebrity, and publication metadata.',
    baseUrl: `${BASE}/api/v1/news`,
    endpoints: [
      {
        id: 'news-list',
        method: 'GET',
        path: '/api/v1/news',
        summary: 'List news articles',
        params: [
          { name: 'page',      type: 'integer', required: false, default: '1',      description: 'Page number for pagination.' },
          { name: 'limit',     type: 'integer', required: false, default: '20',     description: 'Number of results per page. Maximum: 50.' },
          { name: 'search',    type: 'string',  required: false,                    description: 'Search articles by title.' },
          { name: 'category',  type: 'string',  required: false,                    description: 'Filter by news category (e.g. Fashion, Movies).' },
          { name: 'celebrity', type: 'string',  required: false,                    description: 'Filter by celebrity slug.' },
          { name: 'featured',  type: 'boolean', required: false,                    description: 'Return only featured articles.', values: 'true · false' },
          { name: 'sort',      type: 'string',  required: false, default: 'latest', description: 'Sort order.', values: 'latest · oldest · popular' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/news?category=Fashion&limit=5" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/news?category=Fashion&limit=5&sort=latest',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data, pagination } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "news",
  "pagination": { "page": 1, "limit": 5, "total": 194, "pages": 39 },
  "data": [
    {
      "_id": "66b5c3d4e5f6a7b8c9d0e1f2",
      "title": "Ryan Gosling's Barbie Press Tour Outfits Ranked",
      "slug": "ryan-gosling-barbie-press-tour-outfits-ranked",
      "excerpt": "From pink suits to classic tuxedos, every look rated.",
      "thumbnail": "https://cdn.example.com/news1.jpg",
      "author": "Emma Wilson",
      "category": "Fashion",
      "tags": ["Barbie", "Fashion", "Press Tour"],
      "publishDate": "2024-07-22T08:00:00.000Z",
      "featured": true,
      "celebrity": {
        "name": "Ryan Gosling",
        "slug": "ryan-gosling"
      },
      "createdAt": "2024-07-22T08:00:00.000Z"
    }
  ]
}`,
      },
      {
        id: 'news-single',
        method: 'GET',
        path: '/api/v1/news/{slug}',
        summary: 'Get news article by slug',
        pathParams: [
          { name: 'slug', type: 'string', required: true, description: 'The URL-safe slug of the news article.' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/news/ryan-gosling-barbie-press-tour-outfits-ranked" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/news/ryan-gosling-barbie-press-tour-outfits-ranked',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "news",
  "data": {
    "_id": "66b5c3d4e5f6a7b8c9d0e1f2",
    "title": "Ryan Gosling's Barbie Press Tour Outfits Ranked",
    "slug": "ryan-gosling-barbie-press-tour-outfits-ranked",
    "content": "<p>The Barbie press tour gave us some of the most...</p>",
    "excerpt": "From pink suits to classic tuxedos, every look rated.",
    "thumbnail": "https://cdn.example.com/news1.jpg",
    "author": "Emma Wilson",
    "category": "Fashion",
    "tags": ["Barbie", "Fashion", "Press Tour"],
    "publishDate": "2024-07-22T08:00:00.000Z",
    "featured": true,
    "celebrity": {
      "name": "Ryan Gosling",
      "slug": "ryan-gosling",
      "nationality": "Canadian"
    }
  }
}`,
      },
    ],
  },

  // ── MOVIES ───────────────────────────────────────────────────────────────
  {
    id: 'movies',
    label: 'Movies',
    icon: 'FilmIcon',
    color: 'text-purple-400',
    badge: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/20',
    description:
      'Retrieve upcoming and released movie data including cast, synopsis, trailer, ticket links, box office projections, and release dates.',
    baseUrl: `${BASE}/api/v1/movies`,
    endpoints: [
      {
        id: 'movies-list',
        method: 'GET',
        path: '/api/v1/movies',
        summary: 'List movies',
        params: [
          { name: 'page',     type: 'integer', required: false, default: '1',      description: 'Page number for pagination.' },
          { name: 'limit',    type: 'integer', required: false, default: '20',     description: 'Number of results per page. Maximum: 50.' },
          { name: 'search',   type: 'string',  required: false,                    description: 'Search movies by title.' },
          { name: 'genre',    type: 'string',  required: false,                    description: 'Filter by genre (e.g. Action, Drama, Comedy).' },
          { name: 'status',   type: 'string',  required: false,                    description: 'Filter by movie status.', values: 'upcoming · released · in-production' },
          { name: 'featured', type: 'boolean', required: false,                    description: 'Return only featured movies.', values: 'true · false' },
          { name: 'sort',     type: 'string',  required: false, default: 'latest', description: 'Sort order.', values: 'latest · oldest · release_asc · release_desc · title_asc' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/movies?genre=Action&status=upcoming" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/movies?genre=Action&status=upcoming&limit=10',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data, pagination } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "movies",
  "pagination": { "page": 1, "limit": 10, "total": 56, "pages": 6 },
  "data": [
    {
      "_id": "67c6d4e5f6a7b8c9d0e1f2g3",
      "title": "The Gray Man 2",
      "slug": "the-gray-man-2",
      "releaseDate": "2025-07-04T00:00:00.000Z",
      "poster": "https://cdn.example.com/gray-man-2.jpg",
      "genre": ["Action", "Thriller"],
      "director": "Anthony Russo",
      "status": "upcoming",
      "synopsis": "Court Gentry returns for another globe-trotting mission...",
      "anticipationScore": 87,
      "language": ["English"],
      "featured": true,
      "createdAt": "2024-09-01T00:00:00.000Z"
    }
  ]
}`,
      },
      {
        id: 'movies-single',
        method: 'GET',
        path: '/api/v1/movies/{slug}',
        summary: 'Get movie by slug',
        pathParams: [
          { name: 'slug', type: 'string', required: true, description: 'The URL-safe slug of the movie.' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/movies/the-gray-man-2" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/movies/the-gray-man-2',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "movies",
  "data": {
    "_id": "67c6d4e5f6a7b8c9d0e1f2g3",
    "title": "The Gray Man 2",
    "slug": "the-gray-man-2",
    "releaseDate": "2025-07-04T00:00:00.000Z",
    "poster": "https://cdn.example.com/gray-man-2.jpg",
    "backdrop": "https://cdn.example.com/gray-man-2-backdrop.jpg",
    "genre": ["Action", "Thriller"],
    "director": "Anthony Russo",
    "writers": ["Joe Russo", "Christopher Markus"],
    "cast": [
      { "name": "Ryan Gosling", "character": "Court Gentry", "role": "Lead" }
    ],
    "synopsis": "Court Gentry returns...",
    "trailer": "https://youtube.com/watch?v=...",
    "ticketLinks": [
      { "platform": "Fandango", "url": "https://fandango.com/...", "available": true }
    ],
    "budget": 200000000,
    "anticipationScore": 87,
    "duration": 122,
    "mpaaRating": "PG-13",
    "status": "upcoming"
  }
}`,
      },
    ],
  },

  // ── REVIEWS ──────────────────────────────────────────────────────────────
  {
    id: 'reviews',
    label: 'Reviews',
    icon: 'ChatBubbleLeftRightIcon',
    color: 'text-rose-400',
    badge: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/20',
    description:
      'Access movie reviews and ratings including critic scores, audience scores, pros and cons, verdicts, and aggregated IMDb/Rotten Tomatoes data.',
    baseUrl: `${BASE}/api/v1/reviews`,
    endpoints: [
      {
        id: 'reviews-list',
        method: 'GET',
        path: '/api/v1/reviews',
        summary: 'List reviews',
        params: [
          { name: 'page',      type: 'integer', required: false, default: '1',      description: 'Page number for pagination.' },
          { name: 'limit',     type: 'integer', required: false, default: '20',     description: 'Number of results per page. Maximum: 50.' },
          { name: 'search',    type: 'string',  required: false,                    description: 'Search reviews by movie title.' },
          { name: 'minRating', type: 'float',   required: false, default: '0',      description: 'Minimum rating filter (0–10).' },
          { name: 'maxRating', type: 'float',   required: false, default: '10',     description: 'Maximum rating filter (0–10).' },
          { name: 'featured',  type: 'boolean', required: false,                    description: 'Return only featured reviews.', values: 'true · false' },
          { name: 'sort',      type: 'string',  required: false, default: 'latest', description: 'Sort order.', values: 'latest · oldest · rating_high · rating_low' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/reviews?minRating=8&sort=rating_high&limit=5" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/reviews?minRating=8&sort=rating_high&limit=5',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data, pagination } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "reviews",
  "pagination": { "page": 1, "limit": 5, "total": 72, "pages": 15 },
  "data": [
    {
      "_id": "68d7e5f6a7b8c9d0e1f2g3h4",
      "title": "Barbie (2023) Review",
      "slug": "barbie-2023-review",
      "movieTitle": "Barbie",
      "poster": "https://cdn.example.com/barbie.jpg",
      "rating": 9.1,
      "excerpt": "A visually stunning and surprisingly profound film...",
      "author": { "name": "James Porter", "credentials": "Senior Film Critic" },
      "publishDate": "2023-07-21T00:00:00.000Z",
      "featured": true,
      "scores": {
        "criticsScore": 88,
        "audienceScore": 83,
        "imdbRating": 6.9,
        "rottenTomatoesScore": 88
      },
      "verdict": "A must-watch cinematic experience.",
      "stats": { "views": 15420, "likes": 3240 }
    }
  ]
}`,
      },
      {
        id: 'reviews-single',
        method: 'GET',
        path: '/api/v1/reviews/{slug}',
        summary: 'Get review by slug',
        pathParams: [
          { name: 'slug', type: 'string', required: true, description: 'The URL-safe slug of the review.' },
        ],
        curlExample: `curl -X GET "${BASE}/api/v1/reviews/barbie-2023-review" \\
  -H "x-api-key: YOUR_API_KEY"`,
        jsExample: `const res = await fetch(
  '${BASE}/api/v1/reviews/barbie-2023-review',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
const { data } = await res.json();`,
        responseExample: `{
  "success": true,
  "version": "v1",
  "resource": "reviews",
  "data": {
    "_id": "68d7e5f6a7b8c9d0e1f2g3h4",
    "title": "Barbie (2023) Review",
    "slug": "barbie-2023-review",
    "movieTitle": "Barbie",
    "poster": "https://cdn.example.com/barbie.jpg",
    "rating": 9.1,
    "content": "<p>Greta Gerwig's Barbie is a genre-defying film...</p>",
    "excerpt": "A visually stunning and surprisingly profound film.",
    "author": {
      "name": "James Porter",
      "bio": "Senior film critic with 12 years experience.",
      "credentials": "Senior Film Critic"
    },
    "movieDetails": {
      "releaseYear": 2023,
      "director": "Greta Gerwig",
      "genre": ["Comedy", "Fantasy"],
      "runtime": 114
    },
    "scores": {
      "criticsScore": 88,
      "audienceScore": 83,
      "imdbRating": 6.9,
      "rottenTomatoesScore": 88
    },
    "pros": ["Visually inventive", "Sharp screenplay", "Excellent performances"],
    "cons": ["Slightly uneven second act"],
    "verdict": "A must-watch cinematic experience.",
    "publishDate": "2023-07-21T00:00:00.000Z",
    "stats": { "views": 15420, "likes": 3240 }
  }
}`,
      },
    ],
  },
];

const navItems = [
  { id: 'introduction',   label: 'Introduction',    icon: 'BookOpenIcon' },
  { id: 'authentication', label: 'Authentication',   icon: 'ShieldCheckIcon' },
  { id: 'base-url',       label: 'Base URL',         icon: 'GlobeAltIcon' },
  { id: 'pagination',     label: 'Pagination',       icon: 'Squares2X2Icon' },
  { id: 'errors',         label: 'Error Handling',   icon: 'ExclamationCircleIcon' },
  { id: 'rate-limits',    label: 'Rate Limits',      icon: 'ChartBarIcon' },
  { id: 'celebrities',    label: 'Celebrities',      icon: 'StarIcon' },
  { id: 'outfits',        label: 'Outfits',          icon: 'SparklesIcon' },
  { id: 'news',           label: 'News',             icon: 'NewspaperIcon' },
  { id: 'movies',         label: 'Movies',           icon: 'FilmIcon' },
  { id: 'reviews',        label: 'Reviews',          icon: 'ChatBubbleLeftRightIcon' },
  { id: 'changelog',      label: 'Changelog',        icon: 'ClockIcon' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider bg-accent/20 text-accent border border-accent/30">
      {method}
    </span>
  );
}

function CodeBlock({ code, lang = 'bash', filename }: { code: string; lang?: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const colors: Record<string, string> = {
    bash: 'text-amber-300',
    js:   'text-blue-300',
    json: 'text-green-300',
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 text-xs font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/60" />
          {filename && <span className="ml-2 text-neutral-500 text-[11px]">{filename}</span>}
          {!filename && <span className="ml-2 text-neutral-500 text-[11px]">{lang}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors text-[11px]"
        >
          <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={13} className={copied ? 'text-accent' : ''} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code */}
      <pre className={`p-4 overflow-x-auto leading-relaxed ${colors[lang] || 'text-neutral-300'} bg-black/40`}>
        {code}
      </pre>
    </div>
  );
}

function ParamTable({ params, isPath = false }: { params: Param[]; isPath?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
      <div className="grid grid-cols-[110px_70px_60px_1fr] bg-white/5 border-b border-white/10 px-4 py-2.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
        <span>Parameter</span>
        <span>Type</span>
        <span>{isPath ? 'Path' : 'Required'}</span>
        <span>Description</span>
      </div>
      {params.map((p, i) => (
        <div
          key={p.name}
          className={`grid grid-cols-[110px_70px_60px_1fr] px-4 py-3 gap-2 ${i < params.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}
        >
          <span className="font-mono text-primary font-semibold self-start">{p.name}</span>
          <span className="text-purple-300 self-start">{p.type}</span>
          <span className={`self-start font-medium ${isPath || p.required ? 'text-rose-400' : 'text-neutral-500'}`}>
            {isPath ? 'required' : p.required ? 'yes' : 'no'}
          </span>
          <span className="text-neutral-400 leading-relaxed">
            {p.description}
            {p.default && <span className="ml-1.5 text-neutral-600">Default: <code className="text-primary">{p.default}</code></span>}
            {p.values && (
              <span className="block mt-1 text-neutral-600">
                Values: <code className="text-secondary">{p.values}</code>
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SectionDivider({ id, title, icon }: { id: string; title: string; icon: string }) {
  return (
    <div id={id} className="flex items-center gap-3 pt-2 pb-1 scroll-mt-28">
      <Icon name={icon as any} size={18} className="text-primary flex-shrink-0" />
      <h2 className="font-playfair text-xl font-bold text-white">{title}</h2>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function IntroductionSection() {
  return (
    <div className="space-y-4">
      <SectionDivider id="introduction" title="Introduction" icon="BookOpenIcon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-4">
        <p className="text-neutral-300 leading-relaxed">
          The <span className="text-primary font-semibold">CelebrityPersona API v1</span> provides programmatic access to our full database of celebrity profiles, fashion outfits, news articles, upcoming movies, and movie reviews.
        </p>
        <p className="text-neutral-400 leading-relaxed text-sm">
          All endpoints are read-only (<code className="text-accent bg-white/5 px-1.5 py-0.5 rounded">GET</code>). Authentication is done with a personal API key passed in the <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded">x-api-key</code> request header. You can generate your key from the <Link href="/dashboard" className="text-primary hover:text-primary/80 underline underline-offset-2">dashboard → API Access</Link> section.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Current version', value: 'v1', icon: 'TagIcon' },
            { label: 'Protocol', value: 'HTTPS only', icon: 'LockClosedIcon' },
            { label: 'Response format', value: 'JSON', icon: 'CodeBracketIcon' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <Icon name={item.icon as any} size={16} className="text-primary flex-shrink-0" />
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-white text-sm font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthenticationSection() {
  return (
    <div className="space-y-4">
      <SectionDivider id="authentication" title="Authentication" icon="ShieldCheckIcon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm">How it works</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Every request must include your API key in the <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded font-mono">x-api-key</code> HTTP header. There is no OAuth or session-based authentication — just your key on every call.
          </p>
        </div>

        <CodeBlock
          lang="bash"
          filename="Required header"
          code={`x-api-key: cp_live_your_api_key_here`}
        />

        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm">Getting your API key</h3>
          <ol className="space-y-2 text-sm text-neutral-400">
            {[
              'Log in to your CelebrityPersona account.',
              'Go to Dashboard → API Access.',
              'Click "Generate API Key" — your key is shown once immediately.',
              'To view the key again later, click "Reveal" and enter your account password.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/80 text-xs leading-relaxed">
            <span className="font-semibold">Keep your key secret.</span> Never expose it in client-side JavaScript, public repositories, or browser console logs. If your key is compromised, revoke it from the dashboard and generate a new one.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm">Missing or invalid key response</h3>
          <CodeBlock
            lang="json"
            filename="401 Unauthorized"
            code={`{
  "success": false,
  "error": "INVALID_API_KEY",
  "message": "The provided API key is invalid or has been revoked."
}`}
          />
        </div>
      </div>
    </div>
  );
}

function BaseUrlSection() {
  return (
    <div className="space-y-4">
      <SectionDivider id="base-url" title="Base URL" icon="GlobeAltIcon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-4">
        <p className="text-neutral-400 text-sm">All API endpoints are relative to the following base URL:</p>
        <CodeBlock lang="bash" code={`https://celebritypersona.com`} />
        <p className="text-neutral-400 text-sm">
          A full endpoint URL is formed by appending the path to the base. For example:
        </p>
        <CodeBlock
          lang="bash"
          code={`https://celebritypersona.com/api/v1/celebrities?page=1&limit=20`}
        />
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <Icon name="InformationCircleIcon" size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-200/70 text-xs leading-relaxed">
            All requests must be made over <strong className="text-blue-200">HTTPS</strong>. HTTP requests will be redirected or rejected.
          </p>
        </div>
      </div>
    </div>
  );
}

function PaginationSection() {
  return (
    <div className="space-y-4">
      <SectionDivider id="pagination" title="Pagination" icon="Squares2X2Icon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-neutral-400 text-sm leading-relaxed">
          All list endpoints return paginated results. Use the <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded">page</code> and <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded">limit</code> query parameters to navigate through results.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { param: 'page',  desc: 'Page to retrieve (starts at 1)',  default: '1' },
            { param: 'limit', desc: 'Items per page (max: 50)',         default: '20' },
          ].map((p) => (
            <div key={p.param} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <code className="text-primary font-mono text-sm">{p.param}</code>
              <p className="text-neutral-400 text-xs mt-1">{p.desc}</p>
              <p className="text-neutral-600 text-xs mt-1">Default: <code className="text-neutral-400">{p.default}</code></p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm">Pagination object in response</h3>
          <CodeBlock
            lang="json"
            filename="pagination field"
            code={`"pagination": {
  "page": 2,       // current page
  "limit": 20,     // items per page
  "total": 248,    // total items in database
  "pages": 13      // total pages available
}`}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm">Example — fetching page 3</h3>
          <CodeBlock
            lang="bash"
            code={`curl "${BASE}/api/v1/celebrities?page=3&limit=20" \\
  -H "x-api-key: YOUR_API_KEY"`}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorsSection() {
  const errors = [
    { code: 200, status: 'OK',                    color: 'text-accent',    bg: 'bg-accent/10',    desc: 'Request succeeded. Response body contains the requested data.' },
    { code: 401, status: 'Unauthorized',          color: 'text-amber-400', bg: 'bg-amber-500/10', desc: 'API key is missing, invalid, or has been revoked. Check your x-api-key header.' },
    { code: 404, status: 'Not Found',             color: 'text-red-400',   bg: 'bg-red-500/10',   desc: 'The requested resource (celebrity, outfit, etc.) does not exist.' },
    { code: 429, status: 'Too Many Requests',     color: 'text-orange-400',bg: 'bg-orange-500/10',desc: 'Monthly quota exceeded. Upgrade your plan or wait for the quota to reset.' },
    { code: 500, status: 'Internal Server Error', color: 'text-red-400',   bg: 'bg-red-500/10',   desc: 'An unexpected server error occurred. Contact support if the issue persists.' },
  ];

  return (
    <div className="space-y-4">
      <SectionDivider id="errors" title="Error Handling" icon="ExclamationCircleIcon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-neutral-400 text-sm leading-relaxed">
          All error responses follow a consistent JSON structure with a <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded">success: false</code> flag and a human-readable <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded">message</code>.
        </p>

        <CodeBlock
          lang="json"
          filename="Error response shape"
          code={`{
  "success": false,
  "error": "QUOTA_EXCEEDED",          // machine-readable error code
  "message": "Monthly quota of 100 requests exceeded.",
  "quota": {                          // only present on 429 errors
    "used": 100,
    "total": 100,
    "resetsOn": "2026-03-01T00:00:00.000Z"
  }
}`}
        />

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-[70px_1fr_2fr] bg-white/5 border-b border-white/10 px-4 py-2.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
            <span>Code</span>
            <span>Status</span>
            <span>Meaning</span>
          </div>
          {errors.map((e, i) => (
            <div key={e.code} className={`grid grid-cols-[70px_1fr_2fr] px-4 py-3 ${i < errors.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
              <span className={`font-mono font-bold text-sm ${e.color}`}>{e.code}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded self-start w-fit ${e.bg} ${e.color}`}>{e.status}</span>
              <span className="text-neutral-400 text-xs leading-relaxed">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RateLimitsSection() {
  return (
    <div className="space-y-4">
      <SectionDivider id="rate-limits" title="Rate Limits" icon="ChartBarIcon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-neutral-400 text-sm leading-relaxed">
          API usage is measured in monthly requests. Each successful API call counts as one request. Quota resets on the <strong className="text-white">1st of every month at 00:00 UTC</strong>.
        </p>

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_1fr_1fr] bg-white/5 border-b border-white/10 px-4 py-2.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
            <span>Plan</span>
            <span>Requests / month</span>
            <span>Price</span>
            <span>Access</span>
          </div>
          {[
            { plan: 'Free',       requests: '100',    price: 'Free',         access: 'All endpoints', highlight: false },
            { plan: 'Starter',    requests: '1,000',  price: 'Contact us',   access: 'All endpoints', highlight: false },
            { plan: 'Pro',        requests: '10,000', price: 'Contact us',   access: 'All endpoints', highlight: true },
            { plan: 'Enterprise', requests: 'Unlimited', price: 'Contact us', access: 'All endpoints + priority support', highlight: false },
          ].map((t, i) => (
            <div key={t.plan} className={`grid grid-cols-[100px_1fr_1fr_1fr] px-4 py-3 text-xs ${i < 3 ? 'border-b border-white/5' : ''} ${t.highlight ? 'bg-primary/5' : 'hover:bg-white/[0.02]'} transition-colors`}>
              <span className={`font-semibold ${t.highlight ? 'text-primary' : 'text-white'}`}>{t.plan}</span>
              <span className={t.highlight ? 'text-primary' : 'text-neutral-300'}>{t.requests}</span>
              <span className="text-neutral-400">{t.price}</span>
              <span className="text-neutral-500">{t.access}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Icon name="BoltIcon" size={15} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-neutral-300 text-xs leading-relaxed">
            To upgrade your plan, email{' '}
            <a href="mailto:info@celebritypersona.com?subject=API Quota Upgrade" className="text-primary underline underline-offset-2">
              info@celebritypersona.com
            </a>{' '}
            with your registered email and the plan you want. Upgrades are applied same day.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm">Quota exceeded response (429)</h3>
          <CodeBlock
            lang="json"
            filename="429 Too Many Requests"
            code={`{
  "success": false,
  "error": "QUOTA_EXCEEDED",
  "message": "Monthly quota of 100 requests exceeded. Upgrade your plan to continue.",
  "quota": {
    "used": 100,
    "total": 100,
    "resetsOn": "2026-03-01T00:00:00.000Z"
  }
}`}
          />
        </div>
      </div>
    </div>
  );
}

function ResourceSection({ section }: { section: Section }) {
  return (
    <div className="space-y-4">
      <SectionDivider id={section.id} title={section.label} icon={section.icon} />

      {/* Overview */}
      <div className={`rounded-2xl border p-5 ${section.badgeBg}`}>
        <p className="text-sm text-neutral-300 leading-relaxed">{section.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {section.endpoints.map((ep) => (
            <div key={ep.id} className="flex items-center gap-1.5 text-xs font-mono bg-black/30 border border-white/10 rounded-lg px-3 py-1.5">
              <MethodBadge method={ep.method} />
              <span className="text-neutral-300">{ep.path}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Each endpoint */}
      {section.endpoints.map((ep) => (
        <div key={ep.id} id={ep.id} className="glass-card border border-border rounded-2xl overflow-hidden scroll-mt-28">
          {/* Endpoint header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <MethodBadge method={ep.method} />
            <code className={`font-mono text-sm font-semibold ${section.color}`}>{ep.path}</code>
            <span className="text-neutral-500 text-sm">{ep.summary}</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Path params */}
            {ep.pathParams && ep.pathParams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold flex items-center gap-1.5">
                  <Icon name="ArrowRightCircleIcon" size={13} />
                  Path Parameters
                </h4>
                <ParamTable params={ep.pathParams} isPath />
              </div>
            )}

            {/* Query params */}
            {ep.params && ep.params.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold flex items-center gap-1.5">
                  <Icon name="AdjustmentsHorizontalIcon" size={13} />
                  Query Parameters
                </h4>
                <ParamTable params={ep.params} />
              </div>
            )}

            {/* Required header reminder */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-xs">
              <Icon name="ShieldCheckIcon" size={14} className="text-primary flex-shrink-0" />
              <span className="text-neutral-400">
                Required header:{' '}
                <code className="text-primary bg-white/5 px-1.5 py-0.5 rounded font-mono">x-api-key: YOUR_API_KEY</code>
              </span>
            </div>

            {/* Examples side by side */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold flex items-center gap-1.5">
                <Icon name="CodeBracketIcon" size={13} />
                Request Examples
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <CodeBlock lang="bash" filename="cURL" code={ep.curlExample} />
                <CodeBlock lang="js" filename="JavaScript (fetch)" code={ep.jsExample} />
              </div>
            </div>

            {/* Response example */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold flex items-center gap-1.5">
                <Icon name="DocumentTextIcon" size={13} />
                Example Response
              </h4>
              <CodeBlock lang="json" filename="200 OK" code={ep.responseExample} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangelogSection() {
  return (
    <div className="space-y-4">
      <SectionDivider id="changelog" title="Changelog" icon="ClockIcon" />
      <div className="glass-card border border-border rounded-2xl p-6 space-y-4">
        {[
          {
            version: 'v1.0.0',
            date: '25 Feb 2026',
            badge: 'bg-accent/20 text-accent border-accent/30',
            badgeLabel: 'Current',
            changes: [
              'Initial release of CelebrityPersona Public API.',
              'Endpoints: celebrities, outfits, news, movies, reviews.',
              'API key management: generate, reveal (with password), revoke.',
              'Usage tracking: monthly quota, daily hit counters.',
              'Free tier: 100 requests / month.',
            ],
          },
        ].map((entry) => (
          <div key={entry.version} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1" />
              <div className="w-px flex-1 bg-white/10 mt-2" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-bold text-white text-sm">{entry.version}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${entry.badge}`}>{entry.badgeLabel}</span>
                <span className="text-xs text-neutral-500">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                    <Icon name="CheckCircleIcon" size={14} className="text-accent flex-shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ApiDocsContent() {
  const [activeNav, setActiveNav] = useState('introduction');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Highlight active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveNav(id);
    setMobileNavOpen(false);
  }

  const resourceSections = sections.filter((s) =>
    navItems.some((n) => n.id === s.id)
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-24">

      {/* ── Page hero ──────────────────────────────────────────────────────── */}
      <div className="mb-10 py-10 px-6 rounded-2xl glass-card border border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                API Reference
              </span>
              <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded-full font-mono font-bold">v1</span>
            </div>
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
              CelebrityPersona API
            </h1>
            <p className="text-neutral-400 max-w-xl leading-relaxed text-sm">
              Everything you need to query celebrities, outfits, news, movies, and reviews programmatically. All endpoints are GET-only and require an API key.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="KeyIcon" size={16} />
              Get your API key
            </Link>
            <a
              href="mailto:info@celebritypersona.com?subject=API Support"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-neutral-300 hover:text-white hover:border-white/30 font-medium text-sm transition-all"
            >
              <Icon name="EnvelopeIcon" size={16} />
              API support
            </a>
          </div>
        </div>
      </div>

      {/* ── Mobile nav toggle ──────────────────────────────────────────────── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="w-full flex items-center justify-between px-4 py-3 glass-card border border-border rounded-xl text-sm text-white"
        >
          <span className="flex items-center gap-2">
            <Icon name="ListBulletIcon" size={16} className="text-primary" />
            {navItems.find((n) => n.id === activeNav)?.label || 'Navigate'}
          </span>
          <Icon name={mobileNavOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-neutral-400" />
        </button>
        {mobileNavOpen && (
          <div className="mt-1 glass-card border border-border rounded-xl p-2 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                  activeNav === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon name={item.icon as any} size={14} className="flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="flex gap-8 items-start">

        {/* Left sidebar — sticky nav */}
        <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0 sticky top-24">
          <div className="glass-card border border-border rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-widest text-neutral-600 font-semibold px-3 pt-2 pb-3">On this page</p>
            <nav className="space-y-0.5">
              {navItems.map((item, idx) => {
                // Visual separator before resource sections
                const isFirstResource = item.id === 'celebrities';
                return (
                  <div key={item.id}>
                    {isFirstResource && (
                      <div className="flex items-center gap-2 px-3 py-2 mt-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] uppercase tracking-widest text-neutral-600">Endpoints</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                    )}
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all group ${
                        activeNav === item.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon
                        name={item.icon as any}
                        size={14}
                        className={`flex-shrink-0 transition-colors ${activeNav === item.id ? 'text-primary' : 'text-neutral-600 group-hover:text-neutral-400'}`}
                      />
                      <span className="leading-tight">{item.label}</span>
                      {activeNav === item.id && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* Key CTA */}
            <div className="mt-4 mx-1 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
              <p className="text-xs text-neutral-400 mb-2">Need an API key?</p>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
              >
                <Icon name="KeyIcon" size={12} />
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </aside>

        {/* Right — main content */}
        <div ref={mainRef} className="flex-1 min-w-0 space-y-10">
          <IntroductionSection />
          <AuthenticationSection />
          <BaseUrlSection />
          <PaginationSection />
          <ErrorsSection />
          <RateLimitsSection />
          {resourceSections.map((section) => (
            <ResourceSection key={section.id} section={section} />
          ))}
          <ChangelogSection />
        </div>

      </div>
    </div>
  );
}
