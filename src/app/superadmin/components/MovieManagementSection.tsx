'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useAuth } from '@/context/AuthContext';
import { uploadImage, validateImageFile } from '@/lib/imageUpload';
import {
  AVAILABILITY_STATUSES,
  isMovieReleased,
  MOVIE_STATUSES,
  PUBLISH_STATUSES,
  slugifyMovie,
} from '@/lib/upcomingMovies';

type PersonCredit = {
  name: string;
  slug?: string;
  profileUrl?: string;
  image?: string;
  roleName?: string;
  characterDescription?: string;
  displayOrder?: number;
};

type CrewCredit = {
  name: string;
  slug?: string;
  profileUrl?: string;
  image?: string;
};

type GalleryImage = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
};

type ReferenceLink = {
  title?: string;
  url?: string;
  sourceName?: string;
};

type MovieForm = {
  id?: string;
  title: string;
  originalTitle: string;
  slug: string;
  tagline: string;
  excerpt: string;
  status: string;
  movieType: string;
  languages: string[];
  originalLanguage: string;
  country: string;
  genres: string[];
  subgenres: string[];
  certification: string;
  runtimeValue: string;
  runtimeUnit: 'minutes' | 'hours';
  isFeatured: boolean;
  isTrending: boolean;
  isEditorPick: boolean;
  releaseDate: string;
  releaseDateText: string;
  releaseYear: string;
  theatricalReleaseDate: string;
  ottReleaseDate: string;
  ottPlatform: string;
  streamingPlatform: string;
  worldwideRelease: boolean;
  indiaRelease: boolean;
  releaseCountries: string[];
  releaseLanguages: string[];
  dubbedLanguages: string[];
  preorderOrWatchlistUrl: string;
  ticketBookingUrl: string;
  whereToWatchText: string;
  availabilityStatus: string;
  leadCast: PersonCredit[];
  supportingCast: PersonCredit[];
  cameoCast: PersonCredit[];
  director: CrewCredit[];
  producers: CrewCredit[];
  writers: CrewCredit[];
  screenplay: string[];
  storyBy: string[];
  musicDirector: string[];
  cinematographer: string[];
  editor: string[];
  productionDesigner: string[];
  costumeDesigner: string[];
  actionDirector: string[];
  choreographer: string[];
  castingDirector: string[];
  productionCompanies: string[];
  distributor: string;
  ottPartner: string;
  synopsis: string;
  plotSummary: string;
  storyline: string;
  premise: string;
  officialDescription: string;
  whatToExpect: string;
  trailerBreakdown: string;
  castPerformanceExpectations: string;
  whyThisMovieIsImportant: string;
  audienceBuzz: string;
  similarMovies: string[];
  finalPreviewNote: string;
  spoilerWarning: boolean;
  spoilerContent: string;
  posterImage: string;
  posterImageAlt: string;
  posterImageCaption: string;
  backdropImage: string;
  featuredImage: string;
  galleryImages: GalleryImage[];
  trailerUrl: string;
  teaserUrl: string;
  videoEmbedUrl: string;
  youtubeVideoId: string;
  trailerThumbnail: string;
  trailerDuration: string;
  trailerPublishedAt: string;
  officialClipUrls: string[];
  instagramEmbedUrl: string;
  xEmbedUrl: string;
  productionStatus: string;
  filmingStartDate: string;
  filmingEndDate: string;
  filmingLocations: string[];
  budget: string;
  boxOfficeCollection: string;
  productionCompany: string;
  distributorName: string;
  musicLabel: string;
  aspectRatio: string;
  soundMix: string;
  color: string;
  primaryFilmingLanguage: string;
  officialWebsite: string;
  imdbUrl: string;
  wikipediaUrl: string;
  platformUrl: string;
  youtubeTrailerUrl: string;
  pressReleaseUrl: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  isSourceVerified: boolean;
  sourceCreditText: string;
  additionalReferences: ReferenceLink[];
  factCheckNotes: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  contentTags: string[];
  breadcrumbTitle: string;
  enableMovieSchema: boolean;
  enableArticleSchema: boolean;
  enableVideoObjectSchema: boolean;
  schemaMovieName: string;
  schemaMovieDescription: string;
  schemaMovieImage: string;
  schemaReleaseDate: string;
  schemaDirector: string[];
  schemaActor: string[];
  schemaGenre: string[];
  schemaCountryOfOrigin: string;
  schemaDuration: string;
  schemaArticleHeadline: string;
  schemaArticleDescription: string;
  schemaArticleSection: string;
  schemaVideoName: string;
  schemaVideoDescription: string;
  schemaVideoThumbnail: string;
  schemaVideoUploadDate: string;
  schemaVideoDuration: string;
  publisherName: string;
  publisherLogo: string;
  mainEntityOfPage: string;
  schemaKeywords: string[];
  publishStatus: 'draft' | 'scheduled' | 'published' | 'archived';
  publishedAt: string;
  scheduledAt: string;
  authorName: string;
  reviewerName: string;
  readingTime: string;
};

type MovieRow = {
  id: string;
  title: string;
  slug: string;
  posterImage?: string;
  releaseDate?: string;
  releaseDateText?: string;
  releaseYear?: number;
  genres?: string[];
  languages?: string[];
  status?: string;
  publishStatus?: string;
  availabilityStatus?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isEditorPick?: boolean;
  updatedAt?: string;
};

type TabKey =
  | 'basic'
  | 'release'
  | 'cast'
  | 'story'
  | 'media'
  | 'production'
  | 'sources'
  | 'seo'
  | 'schema'
  | 'publishing';

type Toast = { type: 'success' | 'error'; message: string } | null;

const PAGE_SIZES = [10, 20, 50];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-400',
  scheduled: 'bg-sky-500/20 text-sky-400',
  draft: 'bg-yellow-500/20 text-yellow-400',
  archived: 'bg-neutral-500/20 text-neutral-400',
  announced: 'bg-blue-500/20 text-blue-400',
  in_production: 'bg-purple-500/20 text-purple-400',
  post_production: 'bg-indigo-500/20 text-indigo-400',
  trailer_released: 'bg-red-500/20 text-red-400',
  coming_soon: 'bg-cyan-500/20 text-cyan-400',
  released: 'bg-emerald-500/20 text-emerald-400',
  postponed: 'bg-orange-500/20 text-orange-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'basic', label: 'Basic Info', icon: 'FilmIcon' },
  { key: 'release', label: 'Release & Availability', icon: 'CalendarDaysIcon' },
  { key: 'cast', label: 'Cast & Crew', icon: 'UsersIcon' },
  { key: 'story', label: 'Story & Content', icon: 'DocumentTextIcon' },
  { key: 'media', label: 'Media', icon: 'PhotoIcon' },
  { key: 'production', label: 'Production Details', icon: 'Cog6ToothIcon' },
  { key: 'sources', label: 'External Links & Sources', icon: 'LinkIcon' },
  { key: 'seo', label: 'SEO', icon: 'MagnifyingGlassIcon' },
  { key: 'schema', label: 'Schema', icon: 'CodeBracketIcon' },
  { key: 'publishing', label: 'Publishing', icon: 'PaperAirplaneIcon' },
];

const EMPTY_FORM: MovieForm = {
  title: '',
  originalTitle: '',
  slug: '',
  tagline: '',
  excerpt: '',
  status: 'announced',
  movieType: 'Feature Film',
  languages: [],
  originalLanguage: '',
  country: '',
  genres: [],
  subgenres: [],
  certification: '',
  runtimeValue: '',
  runtimeUnit: 'minutes',
  isFeatured: false,
  isTrending: false,
  isEditorPick: false,
  releaseDate: '',
  releaseDateText: '',
  releaseYear: '',
  theatricalReleaseDate: '',
  ottReleaseDate: '',
  ottPlatform: '',
  streamingPlatform: '',
  worldwideRelease: false,
  indiaRelease: false,
  releaseCountries: [],
  releaseLanguages: [],
  dubbedLanguages: [],
  preorderOrWatchlistUrl: '',
  ticketBookingUrl: '',
  whereToWatchText: '',
  availabilityStatus: 'coming_soon',
  leadCast: [],
  supportingCast: [],
  cameoCast: [],
  director: [],
  producers: [],
  writers: [],
  screenplay: [],
  storyBy: [],
  musicDirector: [],
  cinematographer: [],
  editor: [],
  productionDesigner: [],
  costumeDesigner: [],
  actionDirector: [],
  choreographer: [],
  castingDirector: [],
  productionCompanies: [],
  distributor: '',
  ottPartner: '',
  synopsis: '',
  plotSummary: '',
  storyline: '',
  premise: '',
  officialDescription: '',
  whatToExpect: '',
  trailerBreakdown: '',
  castPerformanceExpectations: '',
  whyThisMovieIsImportant: '',
  audienceBuzz: '',
  similarMovies: [],
  finalPreviewNote: '',
  spoilerWarning: false,
  spoilerContent: '',
  posterImage: '',
  posterImageAlt: '',
  posterImageCaption: '',
  backdropImage: '',
  featuredImage: '',
  galleryImages: [],
  trailerUrl: '',
  teaserUrl: '',
  videoEmbedUrl: '',
  youtubeVideoId: '',
  trailerThumbnail: '',
  trailerDuration: '',
  trailerPublishedAt: '',
  officialClipUrls: [],
  instagramEmbedUrl: '',
  xEmbedUrl: '',
  productionStatus: '',
  filmingStartDate: '',
  filmingEndDate: '',
  filmingLocations: [],
  budget: '',
  boxOfficeCollection: '',
  productionCompany: '',
  distributorName: '',
  musicLabel: '',
  aspectRatio: '',
  soundMix: '',
  color: '',
  primaryFilmingLanguage: '',
  officialWebsite: '',
  imdbUrl: '',
  wikipediaUrl: '',
  platformUrl: '',
  youtubeTrailerUrl: '',
  pressReleaseUrl: '',
  sourceType: 'official',
  sourceName: '',
  sourceUrl: '',
  sourcePublishedAt: '',
  isSourceVerified: false,
  sourceCreditText: '',
  additionalReferences: [],
  factCheckNotes: '',
  focusKeyword: '',
  secondaryKeywords: [],
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  contentTags: [],
  breadcrumbTitle: '',
  enableMovieSchema: true,
  enableArticleSchema: true,
  enableVideoObjectSchema: false,
  schemaMovieName: '',
  schemaMovieDescription: '',
  schemaMovieImage: '',
  schemaReleaseDate: '',
  schemaDirector: [],
  schemaActor: [],
  schemaGenre: [],
  schemaCountryOfOrigin: '',
  schemaDuration: '',
  schemaArticleHeadline: '',
  schemaArticleDescription: '',
  schemaArticleSection: 'Upcoming Movies',
  schemaVideoName: '',
  schemaVideoDescription: '',
  schemaVideoThumbnail: '',
  schemaVideoUploadDate: '',
  schemaVideoDuration: '',
  publisherName: 'CelebrityPersona',
  publisherLogo: '',
  mainEntityOfPage: '',
  schemaKeywords: [],
  publishStatus: 'draft',
  publishedAt: '',
  scheduledAt: '',
  authorName: '',
  reviewerName: '',
  readingTime: '',
};

const ARRAY_FIELDS: Array<keyof MovieForm> = [
  'languages',
  'genres',
  'subgenres',
  'releaseCountries',
  'releaseLanguages',
  'dubbedLanguages',
  'screenplay',
  'storyBy',
  'musicDirector',
  'cinematographer',
  'editor',
  'productionDesigner',
  'costumeDesigner',
  'actionDirector',
  'choreographer',
  'castingDirector',
  'productionCompanies',
  'similarMovies',
  'officialClipUrls',
  'filmingLocations',
  'secondaryKeywords',
  'contentTags',
  'schemaDirector',
  'schemaActor',
  'schemaGenre',
  'schemaKeywords',
];

const REQUIRED_PUBLISH_FIELDS: Array<keyof MovieForm> = [
  'title',
  'slug',
  'excerpt',
  'movieType',
  'synopsis',
  'posterImage',
  'posterImageAlt',
  'sourceType',
  'sourceName',
  'sourceUrl',
  'focusKeyword',
  'metaTitle',
  'metaDescription',
  'publishStatus',
];

function toDateInput(value?: string | Date) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function splitLines(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value?: string[]) {
  return (value || []).join('\n');
}

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function serializeMovieRow(movie: any): MovieRow {
  return {
    id: String(movie.id || movie._id || ''),
    title: movie.title || '',
    slug: movie.slug || '',
    posterImage: movie.posterImage || movie.poster || '',
    releaseDate: movie.releaseDate,
    releaseDateText: movie.releaseDateText,
    releaseYear: movie.releaseYear,
    genres: movie.genres || movie.genre || [],
    languages: movie.languages || movie.language || [],
    status: movie.status,
    publishStatus: movie.publishStatus,
    availabilityStatus: movie.availabilityStatus,
    isFeatured: Boolean(movie.isFeatured ?? movie.featured),
    isTrending: Boolean(movie.isTrending),
    isEditorPick: Boolean(movie.isEditorPick),
    updatedAt: movie.updatedAt,
  };
}

function hydrateForm(movie: any): MovieForm {
  const form: MovieForm = { ...EMPTY_FORM };
  const data = { ...movie };
  form.id = data.id || data._id;

  for (const key of Object.keys(form) as Array<keyof MovieForm>) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    if (ARRAY_FIELDS.includes(key))
      (form as any)[key] = Array.isArray(value) ? value : splitLines(String(value));
    else if (key.endsWith('Date') || key.endsWith('At')) (form as any)[key] = toDateInput(value);
    else (form as any)[key] = value;
  }

  form.releaseYear = data.releaseYear ? String(data.releaseYear) : '';
  form.runtimeValue = data.runtimeValue ? String(data.runtimeValue) : '';
  form.readingTime = data.readingTime ? String(data.readingTime) : '';
  form.posterImage = data.posterImage || data.poster || '';
  form.backdropImage = data.backdropImage || data.backdrop || '';
  form.featuredImage = data.featuredImage || '';
  form.trailerUrl = data.trailerUrl || data.trailer || '';
  form.languages = data.languages || data.language || [];
  form.genres = data.genres || data.genre || [];
  form.posterImageAlt = data.posterImageAlt || data.seoData?.altText || '';
  form.metaTitle = data.metaTitle || data.seoData?.metaTitle || '';
  form.metaDescription = data.metaDescription || data.seoData?.metaDescription || '';
  form.focusKeyword = data.focusKeyword || data.seoData?.focusKeyword || '';
  form.secondaryKeywords = data.secondaryKeywords || data.seoData?.keywords || [];
  form.ogTitle = data.ogTitle || data.seoData?.ogTitle || '';
  form.ogDescription = data.ogDescription || data.seoData?.ogDescription || '';
  form.ogImage = data.ogImage || data.seoData?.ogImage || '';
  form.twitterTitle = data.twitterTitle || data.seoData?.twitterTitle || '';
  form.twitterDescription = data.twitterDescription || data.seoData?.twitterDescription || '';
  form.twitterImage = data.twitterImage || data.seoData?.twitterImage || '';
  form.robotsIndex = data.robotsIndex ?? data.seoData?.robotsIndex ?? true;
  form.robotsFollow = data.robotsFollow ?? data.seoData?.robotsFollow ?? true;
  form.leadCast = data.leadCast?.length
    ? data.leadCast
    : (data.cast || []).map((item: any, index: number) => ({
        name: item.name,
        slug: item.slug || slugifyMovie(item.name || ''),
        profileUrl:
          item.profileUrl || `/celebrity-profiles/${item.slug || slugifyMovie(item.name || '')}`,
        image: item.image,
        roleName: item.role || item.roleName || item.character,
        characterDescription: item.characterDescription || item.character,
        displayOrder: item.displayOrder ?? index + 1,
      }));
  form.director = Array.isArray(data.director)
    ? data.director
    : data.director
      ? [
          {
            name: data.director,
            slug: slugifyMovie(data.director),
            profileUrl: `/celebrity-profiles/${slugifyMovie(data.director)}`,
          },
        ]
      : [];
  form.producers = Array.isArray(data.producers)
    ? data.producers.map((item: any) =>
        typeof item === 'string' ? { name: item, slug: slugifyMovie(item) } : item
      )
    : [];
  form.writers = Array.isArray(data.writers)
    ? data.writers.map((item: any) =>
        typeof item === 'string' ? { name: item, slug: slugifyMovie(item) } : item
      )
    : [];
  form.galleryImages = data.galleryImages?.length
    ? data.galleryImages
    : (data.images || []).map((url: string) => ({
        url,
        alt: `${data.title} gallery image`,
        caption: '',
        credit: '',
        sourceUrl: '',
      }));
  form.publishStatus = data.publishStatus || (data.status === 'published' ? 'published' : 'draft');
  return form;
}

export default function MovieManagementSection() {
  const { authHeaders } = useAuth();
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [releaseState, setReleaseState] = useState<'upcoming' | 'released'>('upcoming');
  const [statusFilter, setStatusFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('basic');
  const [form, setForm] = useState<MovieForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<Toast>(null);
  const [confirmArchive, setConfirmArchive] = useState<MovieRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MovieRow | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const slugEdited = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const setBusy = (id: string, value: boolean) =>
    setBusyMap((previous) => ({ ...previous, [id]: value }));

  const fetchMovies = useCallback(
    async (nextPage = page, nextLimit = limit) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(nextPage), limit: String(nextLimit) });
        params.set('releaseState', releaseState);
        if (query.trim()) params.set('q', query.trim());
        if (statusFilter) params.set('status', statusFilter);
        if (publishFilter) params.set('publishStatus', publishFilter);
        const response = await fetch(`/api/superadmin/movies?${params}`, {
          headers: authHeaders(),
        });
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || data.message || 'Failed to load movies');
        setMovies((data.data || []).map(serializeMovieRow));
        setTotal(data.total || 0);
        setPage(data.page || nextPage);
        setLimit(data.limit || nextLimit);
        setPages(data.pages || 1);
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Failed to load movies');
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, limit, page, publishFilter, query, releaseState, statusFilter]
  );

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  const seoWarnings = useMemo(() => {
    const keyword = form.focusKeyword.trim().toLowerCase();
    if (!keyword) return ['Focus keyword is missing.'];
    const checks = [
      ['title', form.title],
      ['slug', form.slug],
      ['excerpt', form.excerpt],
      ['meta title', form.metaTitle],
      ['meta description', form.metaDescription],
      ['synopsis', stripHtml(form.synopsis)],
    ];
    return checks
      .filter(
        ([, value]) =>
          !String(value || '')
            .toLowerCase()
            .includes(keyword)
      )
      .map(([name]) => `Focus keyword is missing from ${name}.`);
  }, [
    form.excerpt,
    form.focusKeyword,
    form.metaDescription,
    form.metaTitle,
    form.slug,
    form.synopsis,
    form.title,
  ]);

  const patchForm = (patch: Partial<MovieForm>) =>
    setForm((previous) => ({ ...previous, ...patch }));

  const setField = <K extends keyof MovieForm>(key: K, value: MovieForm[K]) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      if (key === 'title') {
        const title = String(value);
        if (!slugEdited.current) next.slug = slugifyMovie(title);
        if (!previous.metaTitle)
          next.metaTitle = `${title} release date, cast, trailer and OTT updates`.slice(0, 90);
        if (!previous.ogTitle) next.ogTitle = next.metaTitle;
        if (!previous.twitterTitle) next.twitterTitle = next.metaTitle;
        if (!previous.schemaMovieName) next.schemaMovieName = title;
        if (!previous.schemaArticleHeadline) next.schemaArticleHeadline = next.metaTitle;
        if (!previous.breadcrumbTitle) next.breadcrumbTitle = title;
      }
      if (key === 'excerpt') {
        const excerpt = String(value);
        if (!previous.metaDescription) next.metaDescription = excerpt.slice(0, 160);
        if (!previous.ogDescription) next.ogDescription = excerpt.slice(0, 200);
        if (!previous.twitterDescription) next.twitterDescription = excerpt.slice(0, 200);
        if (!previous.schemaMovieDescription) next.schemaMovieDescription = excerpt;
        if (!previous.schemaArticleDescription) next.schemaArticleDescription = excerpt;
      }
      if (key === 'posterImage') {
        const image = String(value);
        if (!previous.ogImage) next.ogImage = image;
        if (!previous.twitterImage) next.twitterImage = image;
        if (!previous.schemaMovieImage) next.schemaMovieImage = image;
        if (!previous.schemaVideoThumbnail)
          next.schemaVideoThumbnail = previous.trailerThumbnail || image;
      }
      if (key === 'releaseDate') {
        const date = String(value);
        const year = date ? String(new Date(date).getFullYear()) : '';
        next.releaseYear = Number.isNaN(Number(year)) ? '' : year;
        if (!previous.schemaReleaseDate) next.schemaReleaseDate = date;
        if (!previous.focusKeyword && previous.title)
          next.focusKeyword = `${previous.title} release date`;
      }
      if (key === 'ottPlatform') {
        const platform = String(value);
        if (platform && previous.title && !previous.focusKeyword)
          next.focusKeyword = `${previous.title} ${platform} release date`;
        if (platform && !previous.whereToWatchText)
          next.whereToWatchText = `The movie is expected to stream on ${platform}.`;
      }
      if (key === 'trailerUrl' || key === 'youtubeVideoId') {
        next.enableVideoObjectSchema = true;
        if (!previous.schemaVideoName && previous.title)
          next.schemaVideoName = `${previous.title} Official Trailer`;
        if (!previous.schemaVideoDescription) next.schemaVideoDescription = previous.excerpt;
        if (!previous.schemaVideoThumbnail)
          next.schemaVideoThumbnail = previous.trailerThumbnail || previous.posterImage;
      }
      return next;
    });
  };

  const setArray = (key: keyof MovieForm, value: string) => {
    patchForm({ [key]: splitLines(value) } as Partial<MovieForm>);
  };

  const selectImage = async (field: keyof MovieForm, folder: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const validation = validateImageFile(file);
      if (validation) {
        showToast('error', validation);
        return;
      }
      setUploadingField(String(field));
      try {
        const url = await uploadImage(
          file,
          `movies/${form.slug || slugifyMovie(form.title) || 'movie'}/${folder}`
        );
        setField(field, url as any);
        showToast('success', 'Image uploaded');
      } catch {
        showToast('error', 'Image upload failed');
      } finally {
        setUploadingField(null);
      }
    };
    input.click();
  };

  const validate = (publishStatus = form.publishStatus) => {
    const nextErrors: Record<string, string> = {};
    const urlFields: Array<keyof MovieForm> = [
      'sourceUrl',
      'officialWebsite',
      'imdbUrl',
      'wikipediaUrl',
      'platformUrl',
      'trailerUrl',
      'youtubeTrailerUrl',
      'canonicalUrl',
      'ticketBookingUrl',
      'preorderOrWatchlistUrl',
    ];
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (publishStatus === 'published') {
      for (const field of REQUIRED_PUBLISH_FIELDS) {
        if (!String(form[field] || '').trim()) nextErrors[field] = 'Required before publish';
      }
      if (!form.languages.length) nextErrors.languages = 'At least one language is required';
      if (!form.genres.length) nextErrors.genres = 'At least one genre is required';
      if (!form.publishedAt) nextErrors.publishedAt = 'Published movies need a published date';
      if (!form.isSourceVerified && !form.sourceCreditText.trim())
        nextErrors.sourceCreditText = 'Add a verified source or clear source credit';
    }
    if (publishStatus === 'scheduled' && !form.scheduledAt)
      nextErrors.scheduledAt = 'Scheduled movies need a scheduled date';
    for (const field of urlFields) {
      if (!isValidUrl(String(form[field] || ''))) nextErrors[field] = 'Enter a valid http(s) URL';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (publishStatus = form.publishStatus) => ({
    ...form,
    publishStatus,
    releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
    runtimeValue: form.runtimeValue ? Number(form.runtimeValue) : undefined,
    readingTime: form.readingTime ? Number(form.readingTime) : undefined,
    publishedAt:
      publishStatus === 'published'
        ? form.publishedAt || new Date().toISOString()
        : form.publishedAt || undefined,
    schemaActor: form.schemaActor.length
      ? form.schemaActor
      : form.leadCast.map((item) => item.name).filter(Boolean),
    schemaDirector: form.schemaDirector.length
      ? form.schemaDirector
      : form.director.map((item) => item.name).filter(Boolean),
    schemaGenre: form.schemaGenre.length ? form.schemaGenre : form.genres,
    schemaKeywords: form.schemaKeywords.length
      ? form.schemaKeywords
      : [...form.secondaryKeywords, ...form.contentTags],
  });

  const save = async (publishStatus: MovieForm['publishStatus']) => {
    if (!validate(publishStatus)) {
      showToast('error', 'Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    setApiError('');
    try {
      const response = await fetch(
        editingId ? `/api/superadmin/movies/${editingId}` : '/api/superadmin/movies',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(publishStatus)),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error || data.message || 'Save failed');
      }
      setEditingId(data.data.id || data.data._id);
      setForm(hydrateForm(data.data));
      setPanelOpen(true);
      showToast(
        'success',
        publishStatus === 'published'
          ? 'Movie published'
          : publishStatus === 'archived'
            ? 'Movie archived'
            : 'Movie saved'
      );
      fetchMovies(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      setApiError(message);
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    slugEdited.current = false;
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setApiError('');
    setTab('basic');
    setPanelOpen(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setErrors({});
    setApiError('');
    setTab('basic');
  };

  const openEdit = async (movie: MovieRow) => {
    setPanelOpen(true);
    setEditingId(movie.id);
    setTab('basic');
    setApiError('');
    try {
      const response = await fetch(`/api/superadmin/movies/${movie.id}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load movie');
      const hydrated = hydrateForm(data.data);
      slugEdited.current = hydrated.slug !== slugifyMovie(hydrated.title);
      setForm(hydrated);
      setTimeout(
        () => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        50
      );
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to load movie');
      setPanelOpen(false);
    }
  };

  const archiveMovie = async (movie: MovieRow, hard = false) => {
    try {
      const response = await fetch(
        `/api/superadmin/movies/${movie.id}${hard ? '?hard=true' : ''}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || data.message || 'Action failed');
      showToast('success', hard ? 'Movie deleted' : 'Movie archived');
      fetchMovies(page);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Action failed');
    } finally {
      setConfirmArchive(null);
      setConfirmDelete(null);
    }
  };

  const updateMovieQuick = async (movie: MovieRow, patch: Partial<MovieRow>) => {
    setBusy(movie.id, true);
    try {
      const response = await fetch(`/api/superadmin/movies/${movie.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || data.message || 'Update failed');
      const updated = serializeMovieRow(data.data);
      setMovies((previous) => previous.map((item) => (item.id === movie.id ? updated : item)));
      showToast('success', `"${movie.title}" updated`);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusy(movie.id, false);
    }
  };

  const updatePerson = (
    key: 'leadCast' | 'supportingCast' | 'cameoCast',
    index: number,
    patch: Partial<PersonCredit>
  ) => {
    const rows = [...form[key]];
    rows[index] = { ...rows[index], ...patch };
    if (patch.name && !patch.slug) {
      rows[index].slug = slugifyMovie(patch.name);
      rows[index].profileUrl = `/celebrity-profiles/${rows[index].slug}`;
    }
    patchForm({ [key]: rows } as Partial<MovieForm>);
    if (key === 'leadCast') {
      const actorNames = rows.map((item) => item.name).filter(Boolean);
      patchForm({
        schemaActor: actorNames,
        secondaryKeywords: Array.from(
          new Set([...form.secondaryKeywords, ...actorNames.map((name) => `${name} ${form.title}`)])
        ),
      });
    }
  };

  const updateCrew = (
    key: 'director' | 'producers' | 'writers',
    index: number,
    patch: Partial<CrewCredit>
  ) => {
    const rows = [...form[key]];
    rows[index] = { ...rows[index], ...patch };
    if (patch.name && !patch.slug) {
      rows[index].slug = slugifyMovie(patch.name);
      rows[index].profileUrl = `/celebrity-profiles/${rows[index].slug}`;
    }
    patchForm({ [key]: rows } as Partial<MovieForm>);
    if (key === 'director')
      patchForm({ schemaDirector: rows.map((item) => item.name).filter(Boolean) });
  };

  const inputClass = (field?: keyof MovieForm) =>
    `w-full min-w-0 box-border rounded-xl border bg-white/5 px-3 py-2.5 font-montserrat text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-yellow-500/60 ${
      field && errors[field] ? 'border-red-500/70' : 'border-white/10'
    }`;

  const Field = ({
    field,
    label,
    type = 'text',
    placeholder,
    helper,
  }: {
    field: keyof MovieForm;
    label: string;
    type?: string;
    placeholder?: string;
    helper?: string;
  }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400 font-montserrat">
        {label}
      </label>
      <input
        type={type}
        value={String(form[field] || '')}
        onChange={(event) => setField(field, event.target.value as any)}
        placeholder={placeholder}
        className={inputClass(field)}
      />
      {helper && <p className="mt-1 text-xs text-neutral-500 font-montserrat">{helper}</p>}
      {errors[field] && (
        <p className="mt-1 text-xs text-red-400 font-montserrat">{errors[field]}</p>
      )}
    </div>
  );

  const TextArea = ({
    field,
    label,
    rows = 3,
    helper,
  }: {
    field: keyof MovieForm;
    label: string;
    rows?: number;
    helper?: string;
  }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400 font-montserrat">
        {label}
      </label>
      <textarea
        rows={rows}
        value={String(form[field] || '')}
        onChange={(event) => setField(field, event.target.value as any)}
        className={`${inputClass(field)} resize-y`}
      />
      {helper && <p className="mt-1 text-xs text-neutral-500 font-montserrat">{helper}</p>}
      {errors[field] && (
        <p className="mt-1 text-xs text-red-400 font-montserrat">{errors[field]}</p>
      )}
    </div>
  );

  const TagInput = ({
    field,
    label,
    helper,
  }: {
    field: keyof MovieForm;
    label: string;
    helper?: string;
  }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400 font-montserrat">
        {label}
      </label>
      <textarea
        rows={3}
        value={joinLines(form[field] as string[])}
        onChange={(event) => setArray(field, event.target.value)}
        placeholder="One per line, commas also work"
        className={`${inputClass(field)} resize-y`}
      />
      {helper && <p className="mt-1 text-xs text-neutral-500 font-montserrat">{helper}</p>}
      {errors[field] && (
        <p className="mt-1 text-xs text-red-400 font-montserrat">{errors[field]}</p>
      )}
    </div>
  );

  const Toggle = ({
    field,
    label,
    helper,
  }: {
    field: keyof MovieForm;
    label: string;
    helper?: string;
  }) => (
    <button
      type="button"
      onClick={() => setField(field, !form[field] as any)}
      className={`rounded-xl border p-4 text-left transition-all ${form[field] ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white font-montserrat">{label}</span>
        <span
          className={`h-5 w-10 rounded-full p-0.5 transition ${form[field] ? 'bg-yellow-500' : 'bg-white/15'}`}
        >
          <span
            className={`block h-4 w-4 rounded-full bg-white transition ${form[field] ? 'translate-x-5' : ''}`}
          />
        </span>
      </div>
      {helper && <p className="mt-1 text-xs text-neutral-500 font-montserrat">{helper}</p>}
    </button>
  );

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-yellow-300 font-montserrat">
        {title}
      </h3>
      {children}
    </section>
  );

  const PersonRepeater = ({
    title,
    field,
  }: {
    title: string;
    field: 'leadCast' | 'supportingCast' | 'cameoCast';
  }) => (
    <Card title={title}>
      <div className="space-y-3">
        {form[field].map((person, index) => (
          <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                className={inputClass()}
                value={person.name}
                onChange={(event) => updatePerson(field, index, { name: event.target.value })}
                placeholder="Celebrity name"
              />
              <input
                className={inputClass()}
                value={person.slug || ''}
                onChange={(event) => updatePerson(field, index, { slug: event.target.value })}
                placeholder="celebrity-slug"
              />
              <input
                className={inputClass()}
                value={person.roleName || ''}
                onChange={(event) => updatePerson(field, index, { roleName: event.target.value })}
                placeholder="Role / character"
              />
              <input
                className={inputClass()}
                type="number"
                value={person.displayOrder || ''}
                onChange={(event) =>
                  updatePerson(field, index, { displayOrder: Number(event.target.value) })
                }
                placeholder="Order"
              />
              <input
                className={`${inputClass()} md:col-span-2`}
                value={person.profileUrl || ''}
                onChange={(event) => updatePerson(field, index, { profileUrl: event.target.value })}
                placeholder="/celebrity-profiles/slug"
              />
              <input
                className={`${inputClass()} md:col-span-2`}
                value={person.image || ''}
                onChange={(event) => updatePerson(field, index, { image: event.target.value })}
                placeholder="Image URL"
              />
              <textarea
                className={`${inputClass()} md:col-span-4`}
                rows={2}
                value={person.characterDescription || ''}
                onChange={(event) =>
                  updatePerson(field, index, { characterDescription: event.target.value })
                }
                placeholder="Character description"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  patchForm({
                    [field]: form[field].filter((_, i) => i !== index),
                  } as Partial<MovieForm>)
                }
                className="text-xs text-red-300 hover:text-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patchForm({
              [field]: [
                ...form[field],
                {
                  name: '',
                  slug: '',
                  profileUrl: '',
                  image: '',
                  roleName: '',
                  characterDescription: '',
                  displayOrder: form[field].length + 1,
                },
              ],
            } as Partial<MovieForm>)
          }
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10"
        >
          Add {title}
        </button>
      </div>
    </Card>
  );

  const CrewRepeater = ({
    title,
    field,
  }: {
    title: string;
    field: 'director' | 'producers' | 'writers';
  }) => (
    <Card title={title}>
      <div className="space-y-3">
        {form[field].map((person, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:grid-cols-4"
          >
            <input
              className={inputClass()}
              value={person.name}
              onChange={(event) => updateCrew(field, index, { name: event.target.value })}
              placeholder="Name"
            />
            <input
              className={inputClass()}
              value={person.slug || ''}
              onChange={(event) => updateCrew(field, index, { slug: event.target.value })}
              placeholder="slug"
            />
            <input
              className={inputClass()}
              value={person.profileUrl || ''}
              onChange={(event) => updateCrew(field, index, { profileUrl: event.target.value })}
              placeholder="Profile URL"
            />
            <div className="flex gap-2">
              <input
                className={inputClass()}
                value={person.image || ''}
                onChange={(event) => updateCrew(field, index, { image: event.target.value })}
                placeholder="Image URL"
              />
              <button
                type="button"
                onClick={() =>
                  patchForm({
                    [field]: form[field].filter((_, i) => i !== index),
                  } as Partial<MovieForm>)
                }
                className="rounded-lg border border-red-500/30 px-3 text-xs text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patchForm({
              [field]: [...form[field], { name: '', slug: '', profileUrl: '', image: '' }],
            } as Partial<MovieForm>)
          }
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10"
        >
          Add {title}
        </button>
      </div>
    </Card>
  );

  const MediaField = ({
    field,
    label,
    folder,
  }: {
    field: keyof MovieForm;
    label: string;
    folder: string;
  }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          className={inputClass(field)}
          value={String(form[field] || '')}
          onChange={(event) => setField(field, event.target.value as any)}
          placeholder="https://..."
        />
        <button
          type="button"
          onClick={() => selectImage(field, folder)}
          className="rounded-xl border border-white/10 px-3 text-sm text-neutral-200 hover:bg-white/10"
          disabled={uploadingField === field}
        >
          {uploadingField === field ? 'Uploading' : 'Upload'}
        </button>
      </div>
      {errors[field] && <p className="mt-1 text-xs text-red-400">{errors[field]}</p>}
    </div>
  );

  const renderTab = () => {
    if (tab === 'basic')
      return (
        <div className="space-y-5">
          <Card title="Identity">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="title" label="Title" placeholder="Movie title" />
              <Field field="originalTitle" label="Original Title" />
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Slug
                </label>
                <input
                  className={inputClass('slug')}
                  value={form.slug}
                  onChange={(event) => {
                    slugEdited.current = true;
                    setField('slug', slugifyMovie(event.target.value) as any);
                  }}
                />
                {errors.slug && <p className="mt-1 text-xs text-red-400">{errors.slug}</p>}
              </div>
              <Field field="tagline" label="Tagline" />
              <div className="md:col-span-2">
                <TextArea
                  field="excerpt"
                  label="Excerpt"
                  helper="Used in cards, SEO defaults, and article schema."
                />
              </div>
            </div>
          </Card>
          <Card title="Classification">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Movie Status
                </label>
                <select
                  value={form.status}
                  onChange={(event) => setField('status', event.target.value as any)}
                  className={inputClass('status')}
                >
                  {MOVIE_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {labelize(item)}
                    </option>
                  ))}
                </select>
              </div>
              <Field field="movieType" label="Movie Type" placeholder="Feature Film" />
              <Field field="originalLanguage" label="Original Language" />
              <TagInput field="languages" label="Languages" />
              <Field field="country" label="Country" />
              <TagInput field="genres" label="Genres" />
              <TagInput field="subgenres" label="Subgenres" />
              <Field field="certification" label="Certification" placeholder="UA, PG-13" />
              <div className="grid grid-cols-2 gap-2">
                <Field field="runtimeValue" label="Runtime" type="number" />
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Unit
                  </label>
                  <select
                    value={form.runtimeUnit}
                    onChange={(event) => setField('runtimeUnit', event.target.value as any)}
                    className={inputClass()}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Editorial Flags">
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle
                field="isFeatured"
                label="Featured"
                helper="Used by public hero and featured APIs."
              />
              <Toggle
                field="isTrending"
                label="Trending"
                helper="Used by listing sections and filters."
              />
              <Toggle
                field="isEditorPick"
                label="Editor Pick"
                helper="Used by public editorial sections."
              />
            </div>
          </Card>
        </div>
      );

    if (tab === 'release')
      return (
        <div className="space-y-5">
          <Card title="Release Timing">
            <div className="grid gap-4 md:grid-cols-3">
              <Field field="releaseDate" label="Release Date" type="date" />
              <Field
                field="releaseDateText"
                label="Release Date Text"
                placeholder="Expected in 2026"
              />
              <Field field="releaseYear" label="Release Year" type="number" />
              <Field field="theatricalReleaseDate" label="Theatrical Release Date" type="date" />
              <Field field="ottReleaseDate" label="OTT Release Date" type="date" />
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Availability Status
                </label>
                <select
                  value={form.availabilityStatus}
                  onChange={(event) => setField('availabilityStatus', event.target.value as any)}
                  className={inputClass('availabilityStatus')}
                >
                  {AVAILABILITY_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {labelize(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
          <Card title="Availability">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="ottPlatform" label="OTT Platform" />
              <Field field="streamingPlatform" label="Streaming Platform" />
              <Field field="preorderOrWatchlistUrl" label="Preorder / Watchlist URL" />
              <Field field="ticketBookingUrl" label="Ticket Booking URL" />
              <div className="md:col-span-2">
                <TextArea field="whereToWatchText" label="Where To Watch Text" />
              </div>
              <TagInput field="releaseCountries" label="Release Countries" />
              <TagInput field="releaseLanguages" label="Release Languages" />
              <TagInput field="dubbedLanguages" label="Dubbed Languages" />
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle field="worldwideRelease" label="Worldwide Release" />
                <Toggle field="indiaRelease" label="India Release" />
              </div>
            </div>
          </Card>
        </div>
      );

    if (tab === 'cast')
      return (
        <div className="space-y-5">
          <PersonRepeater title="Lead Cast" field="leadCast" />
          <PersonRepeater title="Supporting Cast" field="supportingCast" />
          <PersonRepeater title="Cameo Cast" field="cameoCast" />
          <div className="grid gap-5 xl:grid-cols-3">
            <CrewRepeater title="Director" field="director" />
            <CrewRepeater title="Producers" field="producers" />
            <CrewRepeater title="Writers" field="writers" />
          </div>
          <Card title="Crew Departments">
            <div className="grid gap-4 md:grid-cols-3">
              {(
                [
                  'screenplay',
                  'storyBy',
                  'musicDirector',
                  'cinematographer',
                  'editor',
                  'productionDesigner',
                  'costumeDesigner',
                  'actionDirector',
                  'choreographer',
                  'castingDirector',
                  'productionCompanies',
                ] as Array<keyof MovieForm>
              ).map((field) => (
                <TagInput key={field} field={field} label={labelize(String(field))} />
              ))}
              <Field field="distributor" label="Distributor" />
              <Field field="ottPartner" label="OTT Partner" />
            </div>
          </Card>
        </div>
      );

    if (tab === 'story')
      return (
        <div className="space-y-5">
          <Card title="Core Story">
            <div className="space-y-4">
              <RichTextEditor
                label={
                  <>
                    Synopsis <span className="text-yellow-400">*</span>
                  </>
                }
                value={form.synopsis}
                onChange={(value) => setField('synopsis', value as any)}
              />
              <RichTextEditor
                label="Plot Summary"
                value={form.plotSummary}
                onChange={(value) => setField('plotSummary', value as any)}
              />
              <RichTextEditor
                label="Storyline"
                value={form.storyline}
                onChange={(value) => setField('storyline', value as any)}
              />
              <RichTextEditor
                label="Premise"
                value={form.premise}
                onChange={(value) => setField('premise', value as any)}
              />
              <RichTextEditor
                label="Official Description"
                value={form.officialDescription}
                onChange={(value) => setField('officialDescription', value as any)}
              />
            </div>
          </Card>
          <Card title="Preview Angles">
            <div className="space-y-4">
              <RichTextEditor
                label="What To Expect"
                value={form.whatToExpect}
                onChange={(value) => setField('whatToExpect', value as any)}
              />
              <RichTextEditor
                label="Trailer Breakdown"
                value={form.trailerBreakdown}
                onChange={(value) => setField('trailerBreakdown', value as any)}
              />
              <RichTextEditor
                label="Cast Performance Expectations"
                value={form.castPerformanceExpectations}
                onChange={(value) => setField('castPerformanceExpectations', value as any)}
              />
              <RichTextEditor
                label="Why This Movie Is Important"
                value={form.whyThisMovieIsImportant}
                onChange={(value) => setField('whyThisMovieIsImportant', value as any)}
              />
              <RichTextEditor
                label="Audience Buzz"
                value={form.audienceBuzz}
                onChange={(value) => setField('audienceBuzz', value as any)}
              />
              <TagInput field="similarMovies" label="Similar Movies" />
              <RichTextEditor
                label="Final Preview Note"
                value={form.finalPreviewNote}
                onChange={(value) => setField('finalPreviewNote', value as any)}
              />
              <Toggle field="spoilerWarning" label="Spoiler Warning" />
              {form.spoilerWarning && (
                <RichTextEditor
                  label="Spoiler Content"
                  value={form.spoilerContent}
                  onChange={(value) => setField('spoilerContent', value as any)}
                />
              )}
            </div>
          </Card>
        </div>
      );

    if (tab === 'media')
      return (
        <div className="space-y-5">
          <Card title="Images">
            <div className="grid gap-4 md:grid-cols-2">
              <MediaField field="posterImage" label="Poster Image" folder="poster" />
              <Field field="posterImageAlt" label="Poster Image Alt" />
              <Field field="posterImageCaption" label="Poster Caption" />
              <MediaField field="backdropImage" label="Backdrop Image" folder="backdrop" />
              <MediaField field="featuredImage" label="Featured Image" folder="featured" />
              <MediaField field="trailerThumbnail" label="Trailer Thumbnail" folder="trailer" />
            </div>
          </Card>
          <Card title="Gallery">
            <div className="space-y-3">
              {form.galleryImages.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:grid-cols-5"
                >
                  {(
                    ['url', 'alt', 'caption', 'credit', 'sourceUrl'] as Array<keyof GalleryImage>
                  ).map((field) => (
                    <input
                      key={field}
                      value={item[field] || ''}
                      onChange={(event) => {
                        const rows = [...form.galleryImages];
                        rows[index] = { ...rows[index], [field]: event.target.value };
                        patchForm({ galleryImages: rows });
                      }}
                      className={inputClass()}
                      placeholder={labelize(field)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patchForm({ galleryImages: form.galleryImages.filter((_, i) => i !== index) })
                    }
                    className="text-left text-xs text-red-300 md:col-span-5"
                  >
                    Remove gallery item
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchForm({
                    galleryImages: [
                      ...form.galleryImages,
                      { url: '', alt: '', caption: '', credit: '', sourceUrl: '' },
                    ],
                  })
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10"
              >
                Add Gallery Image
              </button>
            </div>
          </Card>
          <Card title="Video & Embeds">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="trailerUrl" label="Trailer URL" />
              <Field field="teaserUrl" label="Teaser URL" />
              <Field field="videoEmbedUrl" label="Video Embed URL" />
              <Field field="youtubeVideoId" label="YouTube Video ID" />
              <Field
                field="trailerDuration"
                label="Trailer Duration"
                placeholder="PT2M30S or 2:30"
              />
              <Field field="trailerPublishedAt" label="Trailer Published At" type="date" />
              <TagInput field="officialClipUrls" label="Official Clip URLs" />
              <Field field="instagramEmbedUrl" label="Instagram Embed URL" />
              <Field field="xEmbedUrl" label="X Embed URL" />
            </div>
          </Card>
        </div>
      );

    if (tab === 'production')
      return (
        <Card title="Production Details">
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                'productionStatus',
                'filmingStartDate',
                'filmingEndDate',
                'budget',
                'boxOfficeCollection',
                'productionCompany',
                'distributorName',
                'musicLabel',
                'aspectRatio',
                'soundMix',
                'color',
                'primaryFilmingLanguage',
              ] as Array<keyof MovieForm>
            ).map((field) =>
              field === 'filmingStartDate' || field === 'filmingEndDate' ? (
                <Field key={field} field={field} label={labelize(field)} type="date" />
              ) : (
                <Field key={field} field={field} label={labelize(field)} />
              )
            )}
            <TagInput field="filmingLocations" label="Filming Locations" />
          </div>
        </Card>
      );

    if (tab === 'sources')
      return (
        <div className="space-y-5">
          <Card title="External Links">
            <div className="grid gap-4 md:grid-cols-3">
              {(
                [
                  'officialWebsite',
                  'imdbUrl',
                  'wikipediaUrl',
                  'platformUrl',
                  'youtubeTrailerUrl',
                  'pressReleaseUrl',
                ] as Array<keyof MovieForm>
              ).map((field) => (
                <Field key={field} field={field} label={labelize(field)} />
              ))}
            </div>
          </Card>
          <Card title="Primary Source">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="sourceType" label="Source Type" />
              <Field field="sourceName" label="Source Name" />
              <Field field="sourceUrl" label="Source URL" />
              <Field field="sourcePublishedAt" label="Source Published At" type="date" />
              <Toggle field="isSourceVerified" label="Source Verified" />
              <Field field="sourceCreditText" label="Source Credit Text" />
              <div className="md:col-span-2">
                <TextArea field="factCheckNotes" label="Fact Check Notes" rows={4} />
              </div>
            </div>
          </Card>
          <Card title="Additional References">
            <div className="space-y-3">
              {form.additionalReferences.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:grid-cols-4"
                >
                  <input
                    className={inputClass()}
                    value={item.title || ''}
                    onChange={(event) => {
                      const rows = [...form.additionalReferences];
                      rows[index] = { ...rows[index], title: event.target.value };
                      patchForm({ additionalReferences: rows });
                    }}
                    placeholder="Title"
                  />
                  <input
                    className={inputClass()}
                    value={item.url || ''}
                    onChange={(event) => {
                      const rows = [...form.additionalReferences];
                      rows[index] = { ...rows[index], url: event.target.value };
                      patchForm({ additionalReferences: rows });
                    }}
                    placeholder="URL"
                  />
                  <input
                    className={inputClass()}
                    value={item.sourceName || ''}
                    onChange={(event) => {
                      const rows = [...form.additionalReferences];
                      rows[index] = { ...rows[index], sourceName: event.target.value };
                      patchForm({ additionalReferences: rows });
                    }}
                    placeholder="Source"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchForm({
                        additionalReferences: form.additionalReferences.filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                    className="rounded-lg border border-red-500/30 px-3 text-xs text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchForm({
                    additionalReferences: [
                      ...form.additionalReferences,
                      { title: '', url: '', sourceName: '' },
                    ],
                  })
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10"
              >
                Add Reference
              </button>
            </div>
          </Card>
        </div>
      );

    if (tab === 'seo')
      return (
        <div className="space-y-5">
          <Card title="Search Metadata">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="focusKeyword" label="Focus Keyword" />
              <TagInput field="secondaryKeywords" label="Secondary Keywords" />
              <div>
                <Field field="metaTitle" label="Meta Title" />
                <p
                  className={`mt-1 text-xs ${form.metaTitle.length > 60 ? 'text-amber-300' : 'text-neutral-500'}`}
                >
                  {form.metaTitle.length}/60 characters
                </p>
              </div>
              <div>
                <TextArea field="metaDescription" label="Meta Description" rows={3} />
                <p
                  className={`mt-1 text-xs ${form.metaDescription.length > 160 ? 'text-amber-300' : 'text-neutral-500'}`}
                >
                  {form.metaDescription.length}/160 characters
                </p>
              </div>
              <Field field="canonicalUrl" label="Canonical URL" />
              <TagInput field="contentTags" label="Content Tags" />
              <Field field="breadcrumbTitle" label="Breadcrumb Title" />
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle field="robotsIndex" label="Robots Index" />
                <Toggle field="robotsFollow" label="Robots Follow" />
              </div>
            </div>
          </Card>
          <Card title="Social Metadata">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="ogTitle" label="OG Title" />
              <TextArea field="ogDescription" label="OG Description" />
              <MediaField field="ogImage" label="OG Image" folder="seo" />
              <Field field="twitterTitle" label="Twitter Title" />
              <TextArea field="twitterDescription" label="Twitter Description" />
              <MediaField field="twitterImage" label="Twitter Image" folder="seo" />
            </div>
          </Card>
          {seoWarnings.length > 0 && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-200">SEO helper warnings</p>
              <ul className="space-y-1 text-xs text-amber-100/80">
                {seoWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    if (tab === 'schema')
      return (
        <div className="space-y-5">
          <Card title="Schema Toggles">
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle field="enableMovieSchema" label="Movie Schema" />
              <Toggle field="enableArticleSchema" label="Article Schema" />
              <Toggle field="enableVideoObjectSchema" label="VideoObject Schema" />
            </div>
          </Card>
          <Card title="Movie & Article Schema">
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  'schemaMovieName',
                  'schemaMovieDescription',
                  'schemaMovieImage',
                  'schemaReleaseDate',
                  'schemaCountryOfOrigin',
                  'schemaDuration',
                  'schemaArticleHeadline',
                  'schemaArticleDescription',
                  'schemaArticleSection',
                  'publisherName',
                  'publisherLogo',
                  'mainEntityOfPage',
                ] as Array<keyof MovieForm>
              ).map((field) =>
                field.toLowerCase().includes('description') ? (
                  <TextArea key={field} field={field} label={labelize(field)} />
                ) : (
                  <Field
                    key={field}
                    field={field}
                    label={labelize(field)}
                    type={field.toLowerCase().includes('date') ? 'date' : 'text'}
                  />
                )
              )}
              <TagInput field="schemaDirector" label="Schema Director" />
              <TagInput field="schemaActor" label="Schema Actor" />
              <TagInput field="schemaGenre" label="Schema Genre" />
              <TagInput field="schemaKeywords" label="Schema Keywords" />
            </div>
          </Card>
          <Card title="Video Schema">
            <div className="grid gap-4 md:grid-cols-2">
              <Field field="schemaVideoName" label="Schema Video Name" />
              <TextArea field="schemaVideoDescription" label="Schema Video Description" />
              <Field field="schemaVideoThumbnail" label="Schema Video Thumbnail" />
              <Field field="schemaVideoUploadDate" label="Schema Video Upload Date" type="date" />
              <Field
                field="schemaVideoDuration"
                label="Schema Video Duration"
                placeholder="PT2M30S"
              />
            </div>
            {form.enableVideoObjectSchema &&
              (!form.schemaVideoName ||
                !form.schemaVideoThumbnail ||
                !form.schemaVideoUploadDate) && (
                <p className="mt-3 text-xs text-amber-300">
                  VideoObject schema is enabled. Add video name, thumbnail, and upload date for best
                  results.
                </p>
              )}
          </Card>
        </div>
      );

    return (
      <Card title="Publishing Controls">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-400">
              Publish Status
            </label>
            <select
              value={form.publishStatus}
              onChange={(event) => setField('publishStatus', event.target.value as any)}
              className={inputClass('publishStatus')}
            >
              {PUBLISH_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {labelize(item)}
                </option>
              ))}
            </select>
          </div>
          <Field field="publishedAt" label="Published At" type="date" />
          <Field field="scheduledAt" label="Scheduled At" type="date" />
          <Field field="authorName" label="Author Name" />
          <Field field="reviewerName" label="Reviewer Name" />
          <Field field="readingTime" label="Reading Time" type="number" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {form.slug && (
            <a
              href={`/${isMovieReleased(form) ? 'movie-details' : 'upcoming-movies'}/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10"
            >
              Preview
            </a>
          )}
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={saving}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10 disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => save('published')}
            disabled={saving}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
          >
            Publish
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => save('archived')}
              disabled={saving}
              className="rounded-xl border border-amber-500/30 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-60"
            >
              Archive
            </button>
          )}
        </div>
      </Card>
    );
  };

  const dashboardStats = [
    {
      label: 'Total',
      value: total.toLocaleString(),
      icon: 'FilmIcon',
      color: 'text-yellow-400',
    },
    {
      label: 'Featured',
      value: movies.filter((movie) => movie.isFeatured).length.toString(),
      icon: 'SparklesIcon',
      color: 'text-purple-400',
    },
    {
      label: 'This Page',
      value: movies.length.toString(),
      icon: 'RectangleGroupIcon',
      color: 'text-blue-400',
    },
    {
      label: 'Pages',
      value: pages.toString(),
      icon: 'BookOpenIcon',
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-2xl border px-5 py-4 text-sm shadow-xl backdrop-blur ${toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200' : 'border-red-500/30 bg-red-500/15 text-red-200'}`}
        >
          {toast.message}
        </div>
      )}

      {!panelOpen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboardStats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-5">
              <Icon name={stat.icon} size={20} className={stat.color} />
              <p className="font-playfair text-3xl font-bold text-white mt-3">
                {loading ? (
                  <span className="block h-8 w-10 rounded bg-white/10 animate-pulse" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-neutral-400 text-sm font-montserrat mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-montserrat">
                {panelOpen
                  ? editingId
                    ? 'Edit Upcoming Movie'
                    : 'Create Upcoming Movie'
                  : 'Upcoming Movies'}
              </h2>
              <p className="text-sm text-neutral-500 font-montserrat mt-0.5">
                {panelOpen
                  ? 'Fill in the movie database details across the tabs below.'
                  : releaseState === 'released'
                    ? 'Released movies are shown on the user-side Movie Details pages.'
                    : 'Upcoming movies are future or TBA releases shown on the user-side Upcoming Movies pages.'}
              </p>
            </div>
            {panelOpen && (
              <button
                type="button"
                onClick={closePanel}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 font-montserrat text-sm font-semibold text-neutral-300 transition-all hover:bg-white/20 hover:text-white"
              >
                <Icon name="ChevronLeftIcon" size={16} /> Back to List
              </button>
            )}
          </div>

          {!panelOpen && (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:flex-nowrap">
              <div className="flex shrink-0 rounded-xl border border-white/10 bg-white/5 p-1">
                {[
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'released', label: 'Released' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setReleaseState(item.key as 'upcoming' | 'released');
                      setPage(1);
                    }}
                    className={`rounded-lg px-3 py-1.5 font-montserrat text-sm transition-all ${
                      releaseState === item.key
                        ? 'bg-yellow-500 text-black'
                        : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="relative min-w-[260px] flex-1">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') fetchMovies(1);
                  }}
                  placeholder="Search title, cast, director..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 font-montserrat text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-yellow-500/60"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-montserrat text-sm text-white outline-none focus:border-yellow-500/60 xl:w-52"
              >
                <option value="">All movie statuses</option>
                {MOVIE_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {labelize(item)}
                  </option>
                ))}
              </select>
              <select
                value={limit}
                onChange={(event) => fetchMovies(1, Number(event.target.value))}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-montserrat text-sm text-white outline-none focus:border-yellow-500/60"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fetchMovies(page)}
                disabled={loading}
                title="Refresh"
                className="shrink-0 rounded-xl bg-white/5 px-3 py-2.5 text-neutral-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <Icon name="ArrowPathIcon" size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-yellow-500 px-4 py-2.5 font-montserrat text-sm font-semibold text-black transition-all hover:bg-yellow-400"
              >
                <Icon name="PlusIcon" size={16} /> Add Movie
              </button>
            </div>
          )}
        </div>
      </div>

      {!panelOpen && (
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-playfair text-xl font-bold text-white">
              {releaseState === 'released' ? 'Released Movies' : 'Upcoming Movies'}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {(['', 'draft', 'published'] as const).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => {
                    setPublishFilter(state);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 font-montserrat text-xs font-medium transition-all ${
                    publishFilter === state
                      ? state === 'published'
                        ? 'border-emerald-500/30 bg-emerald-500/25 text-emerald-300'
                        : state === 'draft'
                          ? 'border-yellow-500/30 bg-yellow-500/25 text-yellow-300'
                          : 'border-white/20 bg-white/15 text-white'
                      : 'border-white/5 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {state === '' ? 'All' : labelize(state)}
                </button>
              ))}
            </div>
            {!loading && (
              <span className="font-montserrat text-sm text-neutral-400">
                {total > 0
                  ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}`
                  : '0 results'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 border-b border-white/10 px-3 py-3 font-montserrat text-xs uppercase tracking-wider text-neutral-500">
            <span className="col-span-5">Movie</span>
            <span className="col-span-2 hidden md:block">Release</span>
            <span className="col-span-3 md:col-span-2">Status</span>
            <span className="col-span-2 hidden lg:block">Featured</span>
            <span className="col-span-4 md:col-span-3 lg:col-span-1 text-right">Actions</span>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="p-10 text-center">
              <Icon name="FilmIcon" size={36} className="mx-auto mb-3 text-neutral-600" />
              <p className="font-montserrat text-neutral-400">No movies found.</p>
              <button
                type="button"
                onClick={openAdd}
                className="mt-3 font-montserrat text-sm text-yellow-400 hover:underline"
              >
                + Add the first movie
              </button>
            </div>
          ) : (
            movies.map((movie) => (
              <div
                key={movie.id}
                className={`grid grid-cols-12 items-center gap-3 border-b border-white/5 px-3 py-4 font-montserrat text-sm transition-all last:border-0 hover:bg-white/[0.03] ${busyMap[movie.id] ? 'pointer-events-none opacity-50' : ''}`}
              >
                <div className="col-span-5 min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative hidden h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-white/5 sm:block">
                      {movie.posterImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={movie.posterImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon
                          name="FilmIcon"
                          size={16}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-600"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{movie.title}</p>
                      <p className="truncate text-xs text-neutral-500">/{movie.slug}</p>
                      <p className="mt-1 hidden truncate text-xs text-neutral-500 sm:block">
                        {(movie.genres || []).slice(0, 3).join(', ') || 'No genres'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 hidden text-neutral-300 md:block">
                  {movie.releaseDateText ||
                    toDateInput(movie.releaseDate) ||
                    movie.releaseYear ||
                    'TBA'}
                </div>
                <div className="col-span-3 md:col-span-2">
                  <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
                    {(['draft', 'published'] as const).map((state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => updateMovieQuick(movie, { publishStatus: state })}
                        disabled={!!busyMap[movie.id] || movie.publishStatus === state}
                        title={`Set to ${labelize(state)}`}
                        className={`px-2.5 py-1 font-montserrat text-xs font-medium transition-all disabled:opacity-80 ${
                          (movie.publishStatus || 'draft') === state
                            ? state === 'published'
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-yellow-500/25 text-yellow-300'
                            : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                        }`}
                      >
                        {labelize(state)}
                      </button>
                    ))}
                  </div>
                  <span
                    className={`ml-2 hidden rounded-full px-2 py-1 text-xs 2xl:inline ${STATUS_COLORS[movie.status || 'announced'] || 'bg-blue-500/15 text-blue-200'}`}
                  >
                    {labelize(movie.status || 'announced')}
                  </span>
                </div>
                <div className="col-span-2 hidden items-center gap-3 lg:flex">
                  <button
                    type="button"
                    onClick={() => updateMovieQuick(movie, { isFeatured: !movie.isFeatured })}
                    title={movie.isFeatured ? 'Unfeature' : 'Feature'}
                    className={`relative h-5 w-10 rounded-full transition-all ${movie.isFeatured ? 'bg-yellow-500' : 'bg-white/10'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${movie.isFeatured ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                  {movie.isTrending && (
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs text-red-200">
                      Trending
                    </span>
                  )}
                </div>
                <div className="col-span-4 md:col-span-3 lg:col-span-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(movie)}
                    title="Edit"
                    className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400 transition-all hover:bg-yellow-500/20"
                  >
                    <Icon name="PencilSquareIcon" size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmArchive(movie)}
                    title="Archive"
                    className="rounded-lg bg-amber-500/10 p-2 text-amber-300 transition-all hover:bg-amber-500/20"
                  >
                    <Icon name="ArchiveBoxIcon" size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(movie)}
                    title="Delete"
                    className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20"
                  >
                    <Icon name="TrashIcon" size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!panelOpen && pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => fetchMovies(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-2 text-sm text-neutral-400">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            onClick={() => fetchMovies(page + 1)}
            disabled={page >= pages}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {panelOpen && (
        <div
          ref={panelRef}
          className="glass-card rounded-2xl border border-yellow-500/20 overflow-hidden"
        >
          <div className="flex flex-col gap-4 border-b border-white/10 bg-yellow-500/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-montserrat text-[10px] uppercase tracking-[0.3em] text-yellow-300/80">
                Upcoming Movies
              </p>
              <h3 className="mt-1 font-montserrat text-lg font-bold text-white">
                {editingId ? 'Edit Upcoming Movie' : 'Create Upcoming Movie'}
              </h3>
              <p className="font-montserrat text-sm text-neutral-500">
                Every field here feeds public pages, filters, SEO, schema, or internal workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save('draft')}
                disabled={saving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-montserrat text-sm text-neutral-200 transition-all hover:bg-white/10 disabled:opacity-60"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => save('published')}
                disabled={saving}
                className="rounded-xl bg-yellow-500 px-4 py-2 font-montserrat text-sm font-semibold text-black transition-all hover:bg-yellow-400 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-xl bg-white/5 p-2 text-neutral-400 transition-all hover:bg-white/10 hover:text-white"
                title="Close"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>
          </div>

          {apiError && (
            <div className="mx-5 mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-montserrat text-sm text-red-200">
              {apiError}
            </div>
          )}

          <div className="border-b border-white/8 px-5 pt-5">
            <div className="flex gap-2 overflow-x-auto pb-4">
              {TABS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 font-montserrat text-sm transition-all ${
                    tab === item.key
                      ? 'border-yellow-500/50 bg-yellow-500/15 text-yellow-200'
                      : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon name={item.icon} size={15} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">{renderTab()}</div>
        </div>
      )}

      {(confirmArchive || confirmDelete) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card w-full max-w-md rounded-3xl border border-red-500/20 p-8 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-500/15 p-3 text-red-300">
                <Icon name={confirmDelete ? 'TrashIcon' : 'ArchiveBoxIcon'} size={24} />
              </div>
              <div>
                <h3 className="font-montserrat text-lg font-bold text-white">
                  {confirmDelete ? 'Delete movie?' : 'Archive movie?'}
                </h3>
                <p className="mt-2 font-montserrat text-sm leading-6 text-neutral-400">
                  {confirmDelete
                    ? 'Hard delete is permanent. Use only if this record should be removed completely.'
                    : 'Archived movies are hidden publicly and remain editable in the dashboard.'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmArchive(null);
                  setConfirmDelete(null);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-montserrat text-sm text-neutral-300 transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              {confirmArchive && (
                <button
                  type="button"
                  onClick={() => archiveMovie(confirmArchive)}
                  className="rounded-xl bg-amber-500 px-4 py-2 font-montserrat text-sm font-semibold text-black transition-all hover:bg-amber-400"
                >
                  Archive
                </button>
              )}
              {confirmDelete && (
                <button
                  type="button"
                  onClick={() => archiveMovie(confirmDelete, true)}
                  className="rounded-xl bg-red-500 px-4 py-2 font-montserrat text-sm font-semibold text-white transition-all hover:bg-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
