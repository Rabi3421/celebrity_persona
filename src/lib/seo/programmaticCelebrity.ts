import 'server-only';

import type { Metadata } from 'next';
import {
  cleanProfileText,
  formatCelebrityDate,
  getCelebrityFaqs,
  getCelebrityHeroImage,
  getCelebrityKeywordSet,
  getCelebrityProfession,
  getCelebrityQuickFacts,
  type CelebrityFaq,
} from './celebrityProfile';
import { createMetadata, stripHtml, truncate } from './site';

type AnyRecord = Record<string, any>;

export type ProgrammaticCelebrityTopic =
  | 'movies'
  | 'awards'
  | 'controversies'
  | 'fashion'
  | 'relationships'
  | 'net-worth'
  | 'faqs';

export type ProgrammaticRelatedItem = {
  title: string;
  href?: string;
  description?: string;
  image?: string;
  eyebrow?: string;
};

export type ProgrammaticCelebrityResources = {
  moviePages?: ProgrammaticRelatedItem[];
  upcomingMovies?: ProgrammaticRelatedItem[];
  reviews?: ProgrammaticRelatedItem[];
  outfits?: ProgrammaticRelatedItem[];
  news?: ProgrammaticRelatedItem[];
};

export type ProgrammaticCelebritySection = {
  id: string;
  eyebrow?: string;
  heading: string;
  description?: string;
  body?: string;
  items?: ProgrammaticRelatedItem[];
  facts?: Array<{ label: string; value: string }>;
  faqs?: CelebrityFaq[];
  table?: {
    headers: string[];
    rows: string[][];
  };
};

export type ProgrammaticCelebrityPageModel = {
  topic: ProgrammaticCelebrityTopic;
  path: string;
  label: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  keywords: string[];
  image?: string;
  sections: ProgrammaticCelebritySection[];
  itemList: ProgrammaticRelatedItem[];
  faqs: CelebrityFaq[];
};

type TopicDefinition = {
  label: string;
  shortLabel: string;
  heading: (name: string) => string;
  title: (name: string) => string;
  description: (celebrity: AnyRecord) => string;
  keywords: (name: string) => string[];
  priority: number;
};

export const PROGRAMMATIC_CELEBRITY_TOPICS: Record<ProgrammaticCelebrityTopic, TopicDefinition> = {
  movies: {
    label: 'Movies',
    shortLabel: 'Movies',
    heading: (name) => `${name} Movies, Filmography and Screen Credits`,
    title: (name) => `${name} Movies, Filmography, Reviews and Upcoming Projects`,
    description: (celebrity) =>
      `Explore ${celebrity.name}'s movies, filmography, screen roles, related movie pages, reviews, and upcoming projects.`,
    keywords: (name) => [`${name} movies`, `${name} filmography`, `${name} movie list`, `${name} upcoming movies`, `${name} reviews`],
    priority: 0.68,
  },
  awards: {
    label: 'Awards',
    shortLabel: 'Awards',
    heading: (name) => `${name} Awards, Nominations and Career Recognition`,
    title: (name) => `${name} Awards, Nominations, Wins and Career Highlights`,
    description: (celebrity) =>
      `See ${celebrity.name}'s awards, nominations, wins, achievements, recognized work, and career highlights.`,
    keywords: (name) => [`${name} awards`, `${name} nominations`, `${name} award list`, `${name} achievements`],
    priority: 0.62,
  },
  controversies: {
    label: 'Controversies',
    shortLabel: 'Controversies',
    heading: (name) => `${name} Controversies, Public Context and Timeline`,
    title: (name) => `${name} Controversies, Public Issues and Timeline`,
    description: (celebrity) =>
      `Read contextual information about ${celebrity.name}'s public controversies, timelines, and related entertainment coverage.`,
    keywords: (name) => [`${name} controversies`, `${name} controversy`, `${name} public issue`, `${name} news timeline`],
    priority: 0.5,
  },
  fashion: {
    label: 'Fashion',
    shortLabel: 'Fashion',
    heading: (name) => `${name} Fashion, Outfits and Style Inspiration`,
    title: (name) => `${name} Fashion, Outfits, Style and Shop-the-Look Articles`,
    description: (celebrity) =>
      `Explore ${celebrity.name}'s fashion, outfit articles, style inspiration, image gallery, brands, and celebrity looks.`,
    keywords: (name) => [`${name} fashion`, `${name} outfits`, `${name} style`, `${name} clothes`, `${name} look`],
    priority: 0.66,
  },
  relationships: {
    label: 'Relationships',
    shortLabel: 'Relationships',
    heading: (name) => `${name} Relationships, Family and Personal Life`,
    title: (name) => `${name} Relationships, Family, Spouse and Personal Life`,
    description: (celebrity) =>
      `Learn about ${celebrity.name}'s relationships, spouse, family, parents, siblings, children, and personal life details.`,
    keywords: (name) => [`${name} relationships`, `${name} family`, `${name} spouse`, `${name} wife`, `${name} parents`],
    priority: 0.58,
  },
  'net-worth': {
    label: 'Net Worth',
    shortLabel: 'Net Worth',
    heading: (name) => `${name} Net Worth, Career Earnings and Success Factors`,
    title: (name) => `${name} Net Worth, Income Sources, Career and Assets`,
    description: (celebrity) =>
      `Review ${celebrity.name}'s listed net worth, career drivers, movie work, awards, and public success indicators.`,
    keywords: (name) => [`${name} net worth`, `${name} income`, `${name} assets`, `${name} salary`, `${name} wealth`],
    priority: 0.6,
  },
  faqs: {
    label: 'FAQs',
    shortLabel: 'FAQs',
    heading: (name) => `${name} FAQs: Age, Movies, Career, Family and Net Worth`,
    title: (name) => `${name} FAQs, Quick Facts, Age, Movies and Biography Answers`,
    description: (celebrity) =>
      `Find quick answers to frequently asked questions about ${celebrity.name}, including biography, age, movies, family, and net worth.`,
    keywords: (name) => [`${name} FAQs`, `${name} questions`, `${name} age`, `${name} facts`, `${name} biography answers`],
    priority: 0.57,
  },
};

export const PROGRAMMATIC_CELEBRITY_TOPIC_SLUGS = Object.keys(
  PROGRAMMATIC_CELEBRITY_TOPICS
) as ProgrammaticCelebrityTopic[];

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function sentenceList(values: string[]): string {
  const items = values.filter(Boolean);
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function unique<T extends { href?: string; title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = item.href || item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function totalTextLength(values: unknown): number {
  return textArray(values)
    .map((item) => stripHtml(item).length)
    .reduce((sum, length) => sum + length, 0);
}

function movieCredits(celebrity: AnyRecord) {
  return Array.isArray(celebrity.movies) ? celebrity.movies.filter((movie: AnyRecord) => text(movie.name)) : [];
}

function webSeriesCredits(celebrity: AnyRecord) {
  return Array.isArray(celebrity.webSeries) ? celebrity.webSeries.filter((item: AnyRecord) => text(item.name)) : [];
}

function tvCredits(celebrity: AnyRecord) {
  return Array.isArray(celebrity.tvShows) ? celebrity.tvShows.filter((item: AnyRecord) => text(item.name)) : [];
}

function awardCredits(celebrity: AnyRecord) {
  return Array.isArray(celebrity.awards) ? celebrity.awards.filter((award: AnyRecord) => text(award.title)) : [];
}

function relationshipFacts(celebrity: AnyRecord) {
  return [
    celebrity.spouse ? { label: 'Spouse', value: celebrity.spouse } : null,
    textArray(celebrity.parents).length ? { label: 'Parents', value: textArray(celebrity.parents).join(', ') } : null,
    textArray(celebrity.siblings).length ? { label: 'Siblings', value: textArray(celebrity.siblings).join(', ') } : null,
    textArray(celebrity.children).length ? { label: 'Children', value: textArray(celebrity.children).join(', ') } : null,
    textArray(celebrity.relatives).length ? { label: 'Relatives', value: textArray(celebrity.relatives).join(', ') } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function fashionSignals(celebrity: AnyRecord, resources: ProgrammaticCelebrityResources) {
  const tags = [...textArray(celebrity.tags), ...textArray(celebrity.categories)].join(' ').toLowerCase();
  return {
    outfits: resources.outfits?.length || 0,
    galleryImages: Array.isArray(celebrity.galleryImages) ? celebrity.galleryImages.length : 0,
    hasFashionTopic: /fashion|style|outfit|look|designer|wardrobe/.test(tags),
  };
}

function makePath(celebrity: AnyRecord, topic: ProgrammaticCelebrityTopic): string {
  return `/celebrity-profiles/${celebrity.slug}/${topic}`;
}

function tableRows(items: AnyRecord[], columns: Array<{ key: string; fallback?: string }>): string[][] {
  return items.map((item) => columns.map((column) => text(item[column.key]) || column.fallback || '-'));
}

function makeItemList(resources: ProgrammaticCelebrityResources): ProgrammaticRelatedItem[] {
  return unique([
    ...(resources.moviePages || []),
    ...(resources.upcomingMovies || []),
    ...(resources.reviews || []),
    ...(resources.outfits || []),
    ...(resources.news || []),
  ]);
}

export function normalizeProgrammaticCelebrityTopic(raw?: string): ProgrammaticCelebrityTopic | null {
  const topic = text(raw).toLowerCase();
  return PROGRAMMATIC_CELEBRITY_TOPIC_SLUGS.includes(topic as ProgrammaticCelebrityTopic)
    ? topic as ProgrammaticCelebrityTopic
    : null;
}

export function hasProgrammaticCelebrityContent(
  celebrity: AnyRecord,
  topic: ProgrammaticCelebrityTopic,
  resources: ProgrammaticCelebrityResources = {}
): boolean {
  switch (topic) {
    case 'movies':
      return movieCredits(celebrity).length + webSeriesCredits(celebrity).length + tvCredits(celebrity).length +
        (resources.moviePages?.length || 0) + (resources.upcomingMovies?.length || 0) + (resources.reviews?.length || 0) > 0;
    case 'awards':
      return awardCredits(celebrity).length > 0 || textArray(celebrity.achievements).length > 0;
    case 'controversies':
      return textArray(celebrity.controversies).length > 0 && totalTextLength(celebrity.controversies) >= 60;
    case 'fashion': {
      const signal = fashionSignals(celebrity, resources);
      return signal.outfits > 0 || signal.galleryImages >= 3 || signal.hasFashionTopic;
    }
    case 'relationships':
      return relationshipFacts(celebrity).length > 0 ||
        Boolean(celebrity.spouse) ||
        (Array.isArray(celebrity.marriages) && celebrity.marriages.length > 0) ||
        cleanProfileText(celebrity.personalLife, 260).length >= 90;
    case 'net-worth':
      return Boolean(celebrity.netWorth) && (
        cleanProfileText(celebrity.career || celebrity.introduction, 260).length >= 80 ||
        movieCredits(celebrity).length > 0 ||
        awardCredits(celebrity).length > 0
      );
    case 'faqs':
      return getCelebrityFaqs(celebrity).length >= 3;
    default:
      return false;
  }
}

export function getCelebrityProgrammaticTopicLinks(celebrity: AnyRecord) {
  return PROGRAMMATIC_CELEBRITY_TOPIC_SLUGS
    .filter((topic) => hasProgrammaticCelebrityContent(celebrity, topic))
    .map((topic) => ({
      label: `${celebrity.name} ${PROGRAMMATIC_CELEBRITY_TOPICS[topic].shortLabel}`,
      href: makePath(celebrity, topic),
    }));
}

export function createProgrammaticCelebrityMetadata(
  celebrity: AnyRecord,
  topic: ProgrammaticCelebrityTopic,
  resources: ProgrammaticCelebrityResources = {}
): Metadata {
  const model = buildProgrammaticCelebrityPageModel(celebrity, topic, resources);

  return createMetadata({
    title: model.title,
    description: model.description,
    path: model.path,
    images: [getCelebrityHeroImage(celebrity), celebrity.profileImage],
    imageAlt: `${celebrity.name} ${PROGRAMMATIC_CELEBRITY_TOPICS[topic].label}`,
    keywords: model.keywords,
    type: 'profile',
    publishedTime: celebrity.createdAt,
    modifiedTime: celebrity.updatedAt,
  });
}

export function buildProgrammaticCelebrityPageModel(
  celebrity: AnyRecord,
  topic: ProgrammaticCelebrityTopic,
  resources: ProgrammaticCelebrityResources = {}
): ProgrammaticCelebrityPageModel {
  const definition = PROGRAMMATIC_CELEBRITY_TOPICS[topic];
  const name = text(celebrity.name) || 'Celebrity';
  const path = makePath(celebrity, topic);
  const profession = getCelebrityProfession(celebrity);
  const quickFacts = getCelebrityQuickFacts(celebrity);
  const faqs = getCelebrityFaqs(celebrity);
  const allItems = makeItemList(resources);
  const sections: ProgrammaticCelebritySection[] = [];
  const intro = truncate(
    [
      definition.description(celebrity),
      profession ? `${name} is listed as ${profession.toLowerCase()}.` : '',
      celebrity.nationality ? `This page focuses on ${name}'s ${definition.shortLabel.toLowerCase()} details for long-tail celebrity search queries.` : '',
    ].filter(Boolean).join(' '),
    420
  );

  if (quickFacts.length > 0) {
    sections.push({
      id: 'quick-facts',
      eyebrow: 'Profile context',
      heading: `${name} quick facts`,
      description: `Core profile context for ${name} before exploring ${definition.shortLabel.toLowerCase()} details.`,
      facts: quickFacts.slice(0, 9),
    });
  }

  if (topic === 'movies') {
    const movies = movieCredits(celebrity);
    const webSeries = webSeriesCredits(celebrity);
    const tvShows = tvCredits(celebrity);

    if (movies.length > 0) {
      sections.push({
        id: 'movie-credits',
        eyebrow: 'Filmography',
        heading: `${name} movie credits`,
        description: `${name}'s listed movie credits, roles, years, directors, and genres.`,
        table: {
          headers: ['Year', 'Movie', 'Role', 'Director', 'Genre'],
          rows: tableRows([...movies].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)), [
            { key: 'year' },
            { key: 'name' },
            { key: 'role' },
            { key: 'director' },
            { key: 'genre' },
          ]),
        },
      });
    }

    if (webSeries.length > 0 || tvShows.length > 0) {
      sections.push({
        id: 'screen-series',
        eyebrow: 'Series',
        heading: `${name} web series and TV shows`,
        description: `Additional screen appearances for ${name}.`,
        table: {
          headers: ['Year', 'Title', 'Role', 'Platform / Channel', 'Genre'],
          rows: [
            ...webSeries.map((item: AnyRecord) => [
              text(item.year) || '-',
              text(item.name) || '-',
              text(item.role) || '-',
              text(item.platform) || '-',
              text(item.genre) || '-',
            ]),
            ...tvShows.map((item: AnyRecord) => [
              text(item.year) || '-',
              text(item.name) || '-',
              text(item.role) || '-',
              text(item.channel) || '-',
              text(item.genre) || '-',
            ]),
          ],
        },
      });
    }

    if (resources.moviePages?.length) {
      sections.push({
        id: 'movie-pages',
        eyebrow: 'Internal links',
        heading: `${name} movie pages`,
        description: `Crawlable movie detail pages associated with ${name}.`,
        items: resources.moviePages,
      });
    }

    if (resources.upcomingMovies?.length) {
      sections.push({
        id: 'upcoming-movies',
        eyebrow: 'Release tracker',
        heading: `${name} upcoming movies`,
        description: `Upcoming movie pages connected to ${name}.`,
        items: resources.upcomingMovies,
      });
    }

    if (resources.reviews?.length) {
      sections.push({
        id: 'reviews',
        eyebrow: 'Reviews',
        heading: `${name} related movie reviews`,
        description: `Movie review pages connected to ${name}'s screen work.`,
        items: resources.reviews,
      });
    }
  }

  if (topic === 'awards') {
    const awards = awardCredits(celebrity);
    if (awards.length > 0) {
      sections.push({
        id: 'awards-list',
        eyebrow: 'Awards',
        heading: `${name} awards and nominations`,
        description: `${name}'s listed awards, nominated work, organization, and results.`,
        table: {
          headers: ['Year', 'Award', 'Category', 'Organization', 'Work'],
          rows: tableRows([...awards].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)), [
            { key: 'year' },
            { key: 'title' },
            { key: 'category' },
            { key: 'organization' },
            { key: 'work' },
          ]),
        },
      });
    }

    if (textArray(celebrity.achievements).length > 0) {
      sections.push({
        id: 'achievements',
        eyebrow: 'Career highlights',
        heading: `${name} achievement highlights`,
        items: textArray(celebrity.achievements).map((item, index) => ({
          title: `Achievement ${index + 1}`,
          description: cleanProfileText(item, 260),
        })),
      });
    }
  }

  if (topic === 'controversies') {
    sections.push({
      id: 'controversy-context',
      eyebrow: 'Public record',
      heading: `${name} controversy context`,
      description: `Contextual notes about public controversies connected to ${name}.`,
      items: textArray(celebrity.controversies).map((item, index) => ({
        title: `${name} controversy item ${index + 1}`,
        description: cleanProfileText(item, 320),
      })),
    });
  }

  if (topic === 'fashion') {
    if (resources.outfits?.length) {
      sections.push({
        id: 'outfit-articles',
        eyebrow: 'Fashion articles',
        heading: `${name} outfit articles`,
        description: `Celebrity fashion articles and outfit pages connected to ${name}.`,
        items: resources.outfits,
      });
    }

    if (Array.isArray(celebrity.galleryImages) && celebrity.galleryImages.length > 0) {
      sections.push({
        id: 'style-gallery',
        eyebrow: 'Image signals',
        heading: `${name} style gallery`,
        description: `Image references that support ${name}'s fashion and celebrity style topic cluster.`,
        items: celebrity.galleryImages.slice(0, 12).map((image: string, index: number) => ({
          title: `${name} style image ${index + 1}`,
          image,
          description: `${name} fashion and style image ${index + 1}.`,
        })),
      });
    }
  }

  if (topic === 'relationships') {
    if (relationshipFacts(celebrity).length > 0) {
      sections.push({
        id: 'relationship-facts',
        eyebrow: 'Family',
        heading: `${name} relationship and family facts`,
        facts: relationshipFacts(celebrity),
      });
    }

    if (Array.isArray(celebrity.marriages) && celebrity.marriages.length > 0) {
      sections.push({
        id: 'marriages',
        eyebrow: 'Marriage timeline',
        heading: `${name} marriages`,
        items: celebrity.marriages.map((marriage: AnyRecord) => ({
          title: text(marriage.name) || `${name} marriage`,
          description: [
            marriage.marriedYear ? `Married in ${marriage.marriedYear}` : '',
            marriage.currentlyMarried ? 'currently married' : '',
            marriage.divorcedYear ? `divorced in ${marriage.divorcedYear}` : '',
          ].filter(Boolean).join(', '),
        })),
      });
    }

    if (celebrity.personalLife) {
      sections.push({
        id: 'personal-life',
        eyebrow: 'Biography context',
        heading: `${name} personal life`,
        body: cleanProfileText(celebrity.personalLife, 900),
      });
    }
  }

  if (topic === 'net-worth') {
    sections.push({
      id: 'net-worth-summary',
      eyebrow: 'Wealth signal',
      heading: `${name} listed net worth`,
      description: celebrity.netWorth
        ? `${name}'s listed net worth on CelebrityPersona is ${celebrity.netWorth}.`
        : `No verified net worth value is listed for ${name}.`,
      facts: [
        celebrity.netWorth ? { label: 'Listed net worth', value: celebrity.netWorth } : null,
        profession ? { label: 'Career', value: profession } : null,
        movieCredits(celebrity).length ? { label: 'Movie credits', value: String(movieCredits(celebrity).length) } : null,
        awardCredits(celebrity).length ? { label: 'Awards listed', value: String(awardCredits(celebrity).length) } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>,
    });

    if (celebrity.career || celebrity.introduction) {
      sections.push({
        id: 'career-drivers',
        eyebrow: 'Career factors',
        heading: `${name} career factors behind public value`,
        body: cleanProfileText(celebrity.career || celebrity.introduction, 1000),
      });
    }
  }

  if (topic === 'faqs') {
    sections.push({
      id: 'faq-list',
      eyebrow: 'Quick answers',
      heading: `${name} frequently asked questions`,
      description: `Concise answers for common long-tail searches about ${name}.`,
      faqs,
    });
  }

  if (resources.news?.length) {
    sections.push({
      id: 'related-news',
      eyebrow: 'Fresh coverage',
      heading: `${name} related news`,
      description: `News articles that help connect this ${definition.shortLabel.toLowerCase()} page to fresh editorial coverage.`,
      items: resources.news,
    });
  }

  return {
    topic,
    path,
    label: definition.label,
    title: definition.title(name),
    h1: definition.heading(name),
    description: truncate(definition.description(celebrity), 155),
    intro,
    keywords: [
      ...definition.keywords(name),
      ...getCelebrityKeywordSet(celebrity),
      ...textArray(celebrity.works).map((work) => `${name} ${work}`),
    ],
    image: getCelebrityHeroImage(celebrity),
    sections,
    itemList: allItems,
    faqs: topic === 'faqs' ? faqs : [],
  };
}

export function createProgrammaticBreadcrumbs(celebrity: AnyRecord, topic: ProgrammaticCelebrityTopic) {
  return [
    { name: 'Home', path: '/' },
    { name: 'Celebrity Profiles', path: '/celebrity-profiles' },
    { name: celebrity.name, path: `/celebrity-profiles/${celebrity.slug}` },
    { name: PROGRAMMATIC_CELEBRITY_TOPICS[topic].label, path: makePath(celebrity, topic) },
  ];
}

export function topicPriority(topic: ProgrammaticCelebrityTopic): number {
  return PROGRAMMATIC_CELEBRITY_TOPICS[topic].priority;
}
