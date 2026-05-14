import { stripHtml, truncate } from './site';

type AnyRecord = Record<string, any>;

export type CelebrityFact = {
  label: string;
  value: string;
};

export type CelebrityProfileSection = {
  id: string;
  title: string;
};

export type CelebrityFaq = {
  question: string;
  answer: string;
};

export type CelebritySocialLink = {
  platform: string;
  label: string;
  href: string;
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  threads: 'Threads',
  imdb: 'IMDb',
  wikipedia: 'Wikipedia',
  website: 'Official website',
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function unique(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = text(raw);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function sentenceList(values: string[], fallback = ''): string {
  const items = values.filter(Boolean);
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function fact(label: string, value?: string | number | null): CelebrityFact | null {
  if (value === undefined || value === null || value === '') return null;
  return { label, value: String(value) };
}

export function formatCelebrityDate(raw?: string): string {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function cleanProfileText(value?: string, maxLength = 220): string {
  return truncate(stripHtml(value || ''), maxLength);
}

export function getCelebrityProfession(celebrity: AnyRecord): string {
  return textArray(celebrity.occupation || celebrity.profession).join(', ');
}

export function getCelebrityPrimaryImage(celebrity: AnyRecord): string {
  return text(celebrity.profileImage) || text(celebrity.coverImage);
}

export function getCelebrityHeroImage(celebrity: AnyRecord): string {
  return text(celebrity.coverImage) || getCelebrityPrimaryImage(celebrity);
}

export function getCelebritySummary(celebrity: AnyRecord, maxLength = 260): string {
  const name = text(celebrity.name) || 'This celebrity';
  const profession = getCelebrityProfession(celebrity);
  const intro = cleanProfileText(celebrity.introduction || celebrity.career || celebrity.earlyLife, maxLength);

  if (intro) return intro;

  return truncate(
    [
      `${name} is a celebrity profile on CelebrityPersona`,
      profession ? `covering ${profession.toLowerCase()}` : '',
      celebrity.nationality ? `from ${celebrity.nationality}` : '',
      'with biography, career, movies, style coverage, quick facts, and related entertainment updates.',
    ].filter(Boolean).join(' '),
    maxLength
  );
}

export function getCelebrityQuickFacts(celebrity: AnyRecord): CelebrityFact[] {
  const profession = getCelebrityProfession(celebrity);
  const citizenship = textArray(celebrity.citizenship).join(', ');
  const education = textArray(celebrity.education).slice(0, 3).join(', ');
  const knownFor = unique([
    ...textArray(celebrity.works).slice(0, 4),
    ...(Array.isArray(celebrity.movies) ? celebrity.movies.map((movie: AnyRecord) => text(movie.name)).slice(0, 3) : []),
  ]).slice(0, 5);

  return [
    fact('Full name', celebrity.name),
    fact('Known for', sentenceList(knownFor)),
    fact('Occupation', profession),
    fact('Born', formatCelebrityDate(celebrity.born)),
    fact('Birthplace', celebrity.birthPlace),
    fact('Age', celebrity.age ? `${celebrity.age} years` : ''),
    fact('Died', formatCelebrityDate(celebrity.died)),
    fact('Nationality', celebrity.nationality),
    fact('Citizenship', citizenship),
    fact('Years active', celebrity.yearsActive),
    fact('Net worth', celebrity.netWorth),
    fact('Height', celebrity.height),
    fact('Education', education),
  ].filter(Boolean) as CelebrityFact[];
}

export function getCelebritySocialLinks(celebrity: AnyRecord): CelebritySocialLink[] {
  const social = celebrity.socialMedia || {};

  return Object.entries(SOCIAL_LABELS)
    .map(([platform, label]) => ({
      platform,
      label,
      href: text(social[platform]),
    }))
    .filter((link) => link.href);
}

export function getCelebrityProfileSections(
  celebrity: AnyRecord,
  options: { hasRelatedLinks?: boolean } = {}
): CelebrityProfileSection[] {
  const hasBiography = Boolean(celebrity.earlyLife || celebrity.career || celebrity.personalLife);
  const hasFilmography = Boolean(
    (celebrity.movies?.length ?? 0) > 0 ||
    (celebrity.webSeries?.length ?? 0) > 0 ||
    (celebrity.tvShows?.length ?? 0) > 0
  );

  return [
    { id: 'overview', title: 'Overview' },
    { id: 'quick-facts', title: 'Quick facts' },
    hasBiography ? { id: 'biography', title: 'Biography' } : null,
    (celebrity.achievements?.length ?? 0) > 0 ? { id: 'achievements', title: 'Achievements' } : null,
    (celebrity.works?.length ?? 0) > 0 ? { id: 'notable-works', title: 'Notable works' } : null,
    hasFilmography ? { id: 'filmography', title: 'Filmography' } : null,
    (celebrity.awards?.length ?? 0) > 0 ? { id: 'awards', title: 'Awards' } : null,
    (celebrity.trivia?.length ?? 0) > 0 ? { id: 'trivia', title: 'Trivia' } : null,
    (celebrity.philanthropy?.length ?? 0) > 0 ? { id: 'philanthropy', title: 'Philanthropy' } : null,
    (celebrity.controversies?.length ?? 0) > 0 ? { id: 'controversies', title: 'Controversies' } : null,
    (celebrity.quotes?.length ?? 0) > 0 ? { id: 'quotes', title: 'Quotes' } : null,
    (celebrity.galleryImages?.length ?? 0) > 0 || celebrity.profileImage ? { id: 'gallery', title: 'Photos' } : null,
    { id: 'faq', title: 'FAQ' },
    options.hasRelatedLinks ? { id: 'related-coverage', title: 'Related coverage' } : null,
  ].filter(Boolean) as CelebrityProfileSection[];
}

export function getCelebrityTopicLinks(celebrity: AnyRecord) {
  const name = text(celebrity.name) || 'celebrity';
  const encodedName = encodeURIComponent(name);

  return [
    { label: `${name} outfit articles`, href: `/fashion-gallery?celebrity=${encodedName}` },
    { label: `${name} latest news`, href: `/celebrity-news?celebrity=${encodedName}` },
    { label: `${name} movie pages`, href: `/movie-details?celebrity=${encodedName}` },
    { label: `${name} reviews`, href: `/reviews?celebrity=${encodedName}` },
  ];
}

export function getCelebrityFaqs(celebrity: AnyRecord): CelebrityFaq[] {
  const name = text(celebrity.name) || 'this celebrity';
  const profession = getCelebrityProfession(celebrity);
  const knownFor = unique([
    ...textArray(celebrity.works).slice(0, 4),
    ...(Array.isArray(celebrity.movies) ? celebrity.movies.map((movie: AnyRecord) => text(movie.name)).slice(0, 4) : []),
  ]).slice(0, 5);
  const movieNames = Array.isArray(celebrity.movies)
    ? celebrity.movies.map((movie: AnyRecord) => text(movie.name)).filter(Boolean).slice(0, 6)
    : [];
  const socialLinks = getCelebritySocialLinks(celebrity);
  const summary = getCelebritySummary(celebrity, 220);

  const faqs: CelebrityFaq[] = [
    {
      question: `Who is ${name}?`,
      answer: summary || `${name} is covered on CelebrityPersona with biography, career, movies, fashion, and entertainment updates.`,
    },
    knownFor.length
      ? {
          question: `What is ${name} best known for?`,
          answer: `${name} is known for ${sentenceList(knownFor)}${profession ? ` and work as ${profession.toLowerCase()}` : ''}.`,
        }
      : null,
    celebrity.born || celebrity.age
      ? {
          question: `How old is ${name} and when was ${name} born?`,
          answer: [
            celebrity.age ? `${name} is ${celebrity.age} years old.` : '',
            celebrity.born ? `${name} was born on ${formatCelebrityDate(celebrity.born)}.` : '',
            celebrity.birthPlace ? `The listed birthplace is ${celebrity.birthPlace}.` : '',
          ].filter(Boolean).join(' '),
        }
      : null,
    movieNames.length
      ? {
          question: `Which movies feature ${name}?`,
          answer: `${name}'s listed movie credits include ${sentenceList(movieNames)}.`,
        }
      : null,
    celebrity.netWorth
      ? {
          question: `What is ${name}'s net worth?`,
          answer: `${name}'s listed net worth on this profile is ${celebrity.netWorth}.`,
        }
      : null,
    socialLinks.length
      ? {
          question: `Where can fans follow ${name} online?`,
          answer: `${name}'s profile includes official or public links for ${sentenceList(socialLinks.map((link) => link.label))}.`,
        }
      : null,
  ].filter(Boolean) as CelebrityFaq[];

  const seen = new Set<string>();
  return faqs.filter((faq) => {
    const key = faq.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return faq.answer.length > 0;
  }).slice(0, 6);
}

export function getCelebrityKeywordSet(celebrity: AnyRecord): string[] {
  const name = text(celebrity.name);
  const profession = getCelebrityProfession(celebrity);

  return unique([
    name,
    profession,
    celebrity.nationality,
    `${name} biography`,
    `${name} age`,
    `${name} movies`,
    `${name} career`,
    `${name} family`,
    `${name} net worth`,
    `${name} outfits`,
    `${name} latest news`,
    'celebrity profile',
    'celebrity biography',
    'celebrity fashion',
    ...textArray(celebrity.categories),
    ...textArray(celebrity.tags),
    ...textArray(celebrity.works).slice(0, 8),
  ]);
}
