type BrandTone = 'dark' | 'light' | 'mono';
type BrandVariant = 'full' | 'compact' | 'icon';

type BrandLogoProps = {
  variant?: BrandVariant;
  tone?: BrandTone;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  taglineClassName?: string;
};

const tones = {
  dark: {
    bg: '#120B18',
    border: '#D8B36A',
    c: '#D8B36A',
    p: '#F8F1E7',
    text: 'text-white',
    tagline: 'text-primary',
  },
  light: {
    bg: '#F8F1E7',
    border: '#151018',
    c: '#151018',
    p: '#D8B36A',
    text: 'text-[#151018]',
    tagline: 'text-[#7A6335]',
  },
  mono: {
    bg: 'transparent',
    border: 'currentColor',
    c: 'currentColor',
    p: 'currentColor',
    text: 'text-current',
    tagline: 'text-current opacity-70',
  },
};

export function BrandMark({
  tone = 'dark',
  className = 'h-10 w-10',
}: {
  tone?: BrandTone;
  className?: string;
}) {
  const palette = tones[tone];

  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="7"
        y="7"
        width="82"
        height="82"
        rx="22"
        fill={palette.bg}
        stroke={palette.border}
        strokeWidth="3"
      />
      <path
        d="M24 74h48"
        stroke={palette.border}
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".75"
      />
      <path d="M72 20l4 4-4 4-4-4 4-4Z" fill={palette.border} />
      <text
        x="40"
        y="60"
        textAnchor="middle"
        fontFamily="Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
        fontSize="43"
        fontWeight="700"
        fill={palette.c}
      >
        C
      </text>
      <text
        x="58"
        y="60"
        textAnchor="middle"
        fontFamily="Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
        fontSize="43"
        fontWeight="700"
        fill={palette.p}
      >
        P
      </text>
    </svg>
  );
}

export default function BrandLogo({
  variant = 'compact',
  tone = 'dark',
  className = '',
  markClassName = 'h-10 w-10',
  textClassName = '',
  taglineClassName = '',
}: BrandLogoProps) {
  const palette = tones[tone];

  if (variant === 'icon') {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`} aria-label="CelebrityPersona">
        <BrandMark tone={tone} className={markClassName} />
      </span>
    );
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`} aria-label="CelebrityPersona">
      <BrandMark tone={tone} className={`shrink-0 ${markClassName}`} />
      <span className="min-w-0 leading-none">
        <span
          className={`block truncate font-playfair font-bold tracking-[0.01em] ${palette.text} ${
            variant === 'full' ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-2xl'
          } ${textClassName}`}
        >
          CelebrityPersona
        </span>
        {variant === 'full' && (
          <span
            className={`mt-2 block truncate font-montserrat text-[10px] font-semibold uppercase tracking-[0.28em] ${palette.tagline} ${taglineClassName}`}
          >
            Celebrity / Fashion / Film
          </span>
        )}
      </span>
    </span>
  );
}
