export const HOME_TITLE = 'Celebrity Style, Fashion, Movies & Entertainment News';
export const HOME_DESCRIPTION =
  'Explore celebrity profiles, shoppable celebrity outfits, entertainment news, movie details, and reviews from CelebrityPersona.';

export const HOME_FALLBACK_IMAGE = '/assets/images/no_image.png';
export const HOME_HERO_IMAGE =
  'https://img.rocket.new/generatedImages/rocket_gen_img_1d4aad93b-1770398321397.png';

export type HomeCelebrity = {
  id: string;
  name: string;
  path: string;
  profession: string;
  image: string;
  alt: string;
  description: string;
  metric?: string;
};

export type HomeArticle = {
  id: string;
  title: string;
  path: string;
  excerpt: string;
  image: string;
  alt: string;
  category: string;
  date: string;
  dateTime?: string;
  readTime: string;
  celebrity?: string;
};

export type HomeOutfit = {
  id: string;
  title: string;
  path: string;
  celebrityName: string;
  occasion: string;
  image: string;
  alt: string;
  price?: string;
  description: string;
};

export type HomeMovie = {
  id: string;
  title: string;
  path: string;
  releaseDate: string;
  dateTime?: string;
  cast: string;
  genre: string;
  poster: string;
  alt: string;
  description: string;
};

export type HomeUpload = {
  id: string;
  title: string;
  path: string;
  uploaderName: string;
  image: string;
  alt: string;
  category: string;
  views: string;
  likes: string;
};

export const primaryNavigation = [
  { label: 'Celebrity Profiles', href: '/celebrity-profiles' },
  { label: 'Fashion Gallery', href: '/fashion-gallery' },
  { label: 'Celebrity News', href: '/celebrity-news' },
  { label: 'Movies', href: '/movie-details' },
  { label: 'Upcoming Movies', href: '/upcoming-movies' },
  { label: 'Reviews', href: '/reviews' },
];

export const fallbackCelebrities: HomeCelebrity[] = [
  {
    id: 'fallback-celebrity-emma-watson',
    name: 'Emma Watson',
    path: '/celebrity-profiles',
    profession: 'Actress and activist',
    image: HOME_HERO_IMAGE,
    alt: 'Emma Watson inspired editorial portrait in an elegant black dress',
    description: 'Profile, style notes, career highlights, and latest public appearances.',
    metric: 'Featured profile',
  },
  {
    id: 'fallback-celebrity-zendaya',
    name: 'Zendaya',
    path: '/celebrity-profiles',
    profession: 'Actress and style icon',
    image: 'https://images.unsplash.com/photo-1608216874348-f0acf1cc149e',
    alt: 'Zendaya inspired fashion portrait with curly hair and white styling',
    description: 'Red carpet fashion, movie updates, and trend-setting celebrity looks.',
    metric: 'Style spotlight',
  },
  {
    id: 'fallback-celebrity-chris-hemsworth',
    name: 'Chris Hemsworth',
    path: '/celebrity-profiles',
    profession: 'Actor',
    image: 'https://images.unsplash.com/photo-1616707808904-e012afa93dba',
    alt: 'Chris Hemsworth inspired casual celebrity portrait',
    description: 'Movie roles, fitness features, style inspiration, and entertainment news.',
    metric: 'Movie star',
  },
];

export const fallbackArticles: HomeArticle[] = [
  {
    id: 'fallback-news-zendaya-oscars',
    title: 'Zendaya Makes History at the Oscars 2026',
    path: '/celebrity-news',
    excerpt: 'Awards season fashion, red carpet moments, and celebrity news updates in one place.',
    image: 'https://images.unsplash.com/photo-1704087443363-53b5338c937c',
    alt: 'Awards ceremony with red carpet and golden stage lighting',
    category: 'Awards',
    date: 'Feb 9, 2026',
    dateTime: '2026-02-09',
    readTime: '5 min read',
    celebrity: 'Zendaya',
  },
  {
    id: 'fallback-news-emma-fashion',
    title: 'Emma Watson Launches Sustainable Fashion Line',
    path: '/celebrity-news',
    excerpt: 'A closer look at sustainable celebrity style and shoppable fashion inspiration.',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1107d2191-1766599828252.png',
    alt: 'Sustainable fashion display with natural fabrics and plants',
    category: 'Fashion',
    date: 'Feb 8, 2026',
    dateTime: '2026-02-08',
    readTime: '3 min read',
    celebrity: 'Emma Watson',
  },
  {
    id: 'fallback-news-movies',
    title: 'Tom Holland Confirms Spider-Man 4 Production',
    path: '/celebrity-news',
    excerpt: 'Production updates, cast notes, and upcoming movie coverage for fans.',
    image: 'https://images.unsplash.com/photo-1704580097493-5defcc86ea07',
    alt: 'Movie production set with cameras and dramatic lighting',
    category: 'Movies',
    date: 'Feb 7, 2026',
    dateTime: '2026-02-07',
    readTime: '4 min read',
    celebrity: 'Tom Holland',
  },
];

export const fallbackOutfits: HomeOutfit[] = [
  {
    id: 'fallback-outfit-emma-blazer',
    title: 'Elegant neutral blazer look',
    path: '/fashion-gallery',
    celebrityName: 'Emma Watson',
    occasion: 'Red carpet',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_105afe58d-1768666763976.png',
    alt: 'Elegant beige blazer with gold buttons over a white silk shirt',
    price: '$$$',
    description: 'A polished celebrity-inspired outfit with structured tailoring and soft neutrals.',
  },
  {
    id: 'fallback-outfit-zendaya-airport',
    title: 'Airport denim layers',
    path: '/fashion-gallery',
    celebrityName: 'Zendaya',
    occasion: 'Airport',
    image: 'https://images.unsplash.com/photo-1545333756-bf0d13df146e',
    alt: 'Casual denim jacket with white t-shirt and black jeans',
    price: '$$',
    description: 'A relaxed travel outfit built around denim layers and everyday essentials.',
  },
  {
    id: 'fallback-outfit-margot-party',
    title: 'Satin evening party look',
    path: '/fashion-gallery',
    celebrityName: 'Margot Robbie',
    occasion: 'Party',
    image: 'https://images.unsplash.com/photo-1700064817900-6c16021b304e',
    alt: 'Glamorous pink satin dress with silver heels',
    price: '$$$',
    description: 'A polished evening outfit with satin texture, shine, and soft color.',
  },
];

export const fallbackMovies: HomeMovie[] = [
  {
    id: 'fallback-movie-spider-man-beyond',
    title: 'Spider-Man: Beyond',
    path: '/upcoming-movies',
    releaseDate: 'Mar 15, 2026',
    dateTime: '2026-03-15',
    cast: 'Tom Holland, Zendaya, Benedict Cumberbatch',
    genre: 'Action, Superhero',
    poster: 'https://img.rocket.new/generatedImages/rocket_gen_img_124fe76af-1764763084150.png',
    alt: 'Dramatic superhero movie poster with a city skyline at night',
    description: 'Upcoming release details, cast updates, and entertainment coverage.',
  },
  {
    id: 'fallback-movie-last-symphony',
    title: 'The Last Symphony',
    path: '/upcoming-movies',
    releaseDate: 'Apr 22, 2026',
    dateTime: '2026-04-22',
    cast: 'Emma Watson, Timothee Chalamet, Saoirse Ronan',
    genre: 'Drama, Romance',
    poster: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d16b6d34-1770609260183.png',
    alt: 'Elegant period drama poster with a classical music theme',
    description: 'Movie synopsis, cast information, and release-date tracking.',
  },
  {
    id: 'fallback-movie-dune-messiah',
    title: 'Dune: Messiah',
    path: '/upcoming-movies',
    releaseDate: 'Jun 12, 2026',
    dateTime: '2026-06-12',
    cast: 'Timothee Chalamet, Zendaya, Florence Pugh',
    genre: 'Sci-Fi, Adventure',
    poster: 'https://img.rocket.new/generatedImages/rocket_gen_img_13d440ff9-1770609261588.png',
    alt: 'Epic science fiction poster with desert landscape and stars',
    description: 'Release news, cast notes, and fan-focused movie details.',
  },
];

export const fallbackUploads: HomeUpload[] = [
  {
    id: 'fallback-upload-casual',
    title: 'Emma Watson inspired casual look',
    path: '/fashion-gallery',
    uploaderName: 'Sarah Chen',
    image: 'https://images.unsplash.com/photo-1610850756109-1f9b7abb5cdf',
    alt: 'Casual beige sweater with light blue jeans and white sneakers',
    category: 'Casual',
    views: '3.2K',
    likes: '234',
  },
  {
    id: 'fallback-upload-airport',
    title: 'Tom Holland airport style',
    path: '/fashion-gallery',
    uploaderName: 'Mike Johnson',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1308d5eaf-1770609261808.png',
    alt: 'Sporty bomber jacket with navy joggers and running shoes',
    category: 'Airport',
    views: '2.8K',
    likes: '189',
  },
  {
    id: 'fallback-upload-red-carpet',
    title: 'Zendaya red carpet recreation',
    path: '/fashion-gallery',
    uploaderName: 'Lisa Park',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_147d7b671-1770185029925.png',
    alt: 'Elegant emerald green gown with crystal embellishments',
    category: 'Red carpet',
    views: '5.6K',
    likes: '412',
  },
];

export function safeImage(src: unknown, fallback = HOME_FALLBACK_IMAGE) {
  if (typeof src !== 'string') return fallback;
  const value = src.trim();
  if (!value) return fallback;
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  return fallback;
}

export function formatDisplayDate(value: unknown, fallback = 'Latest update') {
  if (!value) return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function isoDate(value: unknown) {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function compactNumber(value: unknown, fallback = 'Featured') {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(number);
}

export function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 220))} min read`;
}
