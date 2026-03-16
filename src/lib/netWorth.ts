const CRORE = 10000000;
const LAKH = 100000;

function trimTrailingZeros(value: string) {
  if (!value.includes('.')) return value;
  return value.replace(/0+$/, '').replace(/\.$/, '');
}

function toCleanNumberString(value: number) {
  return trimTrailingZeros(value.toFixed(2));
}

function formatIndianNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

function extractNumericValue(raw: string) {
  const cleaned = raw.replace(/,/g, '').trim();
  const match = cleaned.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function hasInrMarker(raw: string) {
  return /₹|\binr\b|\brs\.?\b/i.test(raw);
}

function formatInrAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '';

  if (value >= CRORE) {
    return `₹${toCleanNumberString(value / CRORE)} crore`;
  }

  if (value >= LAKH) {
    return `₹${toCleanNumberString(value / LAKH)} lakh`;
  }

  return `₹${formatIndianNumber(value)}`;
}

export function buildNetWorthString(amount?: string, unit?: string) {
  if (!amount) return '';

  const cleanedAmount = String(amount).replace(/,/g, '').trim();
  if (!cleanedAmount) return '';

  const numericAmount = Number(cleanedAmount);
  const finalUnit = unit || 'USD';

  if (!Number.isFinite(numericAmount)) return '';

  if (finalUnit === 'INR') {
    return formatInrAmount(numericAmount);
  }

  if (finalUnit === 'M') return `$${trimTrailingZeros(cleanedAmount)}M`;
  if (finalUnit === 'B') return `$${trimTrailingZeros(cleanedAmount)}B`;
  if (finalUnit === 'USD') return `$${trimTrailingZeros(cleanedAmount)}`;
  return `${trimTrailingZeros(cleanedAmount)} ${finalUnit}`;
}

export function parseNetWorthString(raw?: string) {
  const value = String(raw || '').trim();
  if (!value) return { amount: '', unit: 'USD' };

  const numericValue = extractNumericValue(value);
  if (hasInrMarker(value) || /\bcrore?s?\b|\bcr\b|\blakh?s?\b|\blac?s?\b/i.test(value)) {
    if (!Number.isFinite(numericValue)) return { amount: '', unit: 'INR' };

    if (/\bcrore?s?\b|\bcr\b/i.test(value)) {
      return { amount: String(numericValue * CRORE), unit: 'INR' };
    }

    if (/\blakh?s?\b|\blac?s?\b/i.test(value)) {
      return { amount: String(numericValue * LAKH), unit: 'INR' };
    }

    return { amount: String(numericValue), unit: 'INR' };
  }

  if (/[mM]\b/.test(value)) return { amount: Number.isFinite(numericValue) ? String(numericValue) : '', unit: 'M' };
  if (/[bB]\b/.test(value)) return { amount: Number.isFinite(numericValue) ? String(numericValue) : '', unit: 'B' };
  if (value.includes('$') || /\busd\b/i.test(value)) return { amount: Number.isFinite(numericValue) ? String(numericValue) : '', unit: 'USD' };

  return { amount: value.replace(/,/g, ''), unit: 'USD' };
}

export function normalizeStoredNetWorth(raw?: string) {
  const value = String(raw || '').trim();
  if (!value) return '';

  if (hasInrMarker(value) || /\bcrore?s?\b|\bcr\b|\blakh?s?\b|\blac?s?\b/i.test(value)) {
    const parsed = parseNetWorthString(value);
    return buildNetWorthString(parsed.amount, parsed.unit);
  }

  return value;
}
