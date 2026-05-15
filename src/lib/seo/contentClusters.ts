import 'server-only';

type AnyRecord = Record<string, any>;

export type ContentClusterSeed = {
  entityType: 'celebrity' | 'movie' | 'outfit' | 'news' | 'review';
  name: string;
  slug?: string;
  primaryTopic: string;
  terms: string[];
  tags: string[];
  categories: string[];
  movieTitles: string[];
  people: string[];
};

const CLUSTER_STOP_TERMS = new Set([
  'actor',
  'actress',
  'artist',
  'celebrity',
  'celebrities',
  'fashion',
  'film',
  'films',
  'movie',
  'movies',
  'news',
  'profile',
  'review',
  'reviews',
  'style',
  'upcoming',
]);

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asTextArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(asTextArray);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values: string[], limit = 18): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = text(raw);
    const key = normalizeTerm(value);
    if (!key || key.length <= 2 || CLUSTER_STOP_TERMS.has(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }

  return result;
}

function movieNames(celebrity: AnyRecord): string[] {
  if (!Array.isArray(celebrity.movies)) return [];
  return unique(celebrity.movies.map((movie: AnyRecord) => text(movie.name)), 12);
}

export function buildCelebrityContentCluster(celebrity: AnyRecord): ContentClusterSeed {
  const name = text(celebrity.name) || 'Celebrity';
  const tags = unique([
    ...asTextArray(celebrity.tags),
    ...asTextArray(celebrity.seo?.tags),
    ...asTextArray(celebrity.seo?.relatedTopics),
  ]);
  const categories = unique(asTextArray(celebrity.categories), 12);
  const occupations = unique(asTextArray(celebrity.occupation || celebrity.profession), 8);
  const titles = movieNames(celebrity);
  const people = unique([name, ...asTextArray(celebrity.relatedCelebrities)], 10);
  const primaryTopic = categories[0] || occupations[0] || tags[0] || name;

  return {
    entityType: 'celebrity',
    name,
    slug: text(celebrity.slug),
    primaryTopic,
    terms: unique([
      name,
      ...categories,
      ...occupations,
      ...tags,
      ...titles,
      text(celebrity.nationality),
    ]),
    tags,
    categories,
    movieTitles: titles,
    people,
  };
}

export function buildClusterBrowseLinks(cluster: ContentClusterSeed) {
  const name = encodeURIComponent(cluster.name);
  const topic = encodeURIComponent(cluster.primaryTopic);

  return [
    { label: `${cluster.name} movie pages`, href: `/movie-details?celebrity=${name}` },
    { label: `${cluster.name} upcoming movies`, href: `/upcoming-movies?celebrity=${name}` },
    { label: `${cluster.name} outfit pages`, href: `/fashion-gallery?celebrity=${name}` },
    { label: `${cluster.name} news articles`, href: `/celebrity-news?celebrity=${name}` },
    { label: `${cluster.name} movie reviews`, href: `/reviews?celebrity=${name}` },
    { label: `${cluster.primaryTopic} celebrity cluster`, href: `/celebrity-profiles?topic=${topic}` },
  ];
}
