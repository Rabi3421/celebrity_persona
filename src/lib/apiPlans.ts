/**
 * Shared API pricing plans — used by frontend (pricing page) and backend (order validation).
 * Prices are in INR. Quotas are monthly request limits.
 *
 * Indian Market Rationale:
 *  - Free: 100 req/mo  — onboarding hook, no charge
 *  - Starter ₹199/mo   — solo devs, hobbyists (~$2.40 USD, impulse buy)
 *  - Pro ₹499/mo       — small startups, freelancers (~$6 USD, sweet spot)
 *  - Ultra ₹999/mo     — agencies, production apps (~$12 USD, still cheap)
 */

export interface ApiPlan {
  id: string;
  label: string;
  priceINR: number;        // ₹ per month displayed
  amountPaise: number;     // priceINR × 100 for Razorpay
  quota: number;           // monthly request limit
  quotaLabel: string;      // human-readable (e.g. "1,000 / month")
  description: string;
  features: string[];
  badge?: string;          // e.g. 'Most Popular'
  badgeColor?: string;
  highlighted: boolean;
}

export const API_PLANS: ApiPlan[] = [
  {
    id: 'free',
    label: 'Free',
    priceINR: 0,
    amountPaise: 0,
    quota: 100,
    quotaLabel: '100 / month',
    description: 'Perfect for exploring the API and personal projects.',
    features: [
      '100 requests / month',
      'All 5 endpoints',
      'Pagination & filters',
      'JSON responses',
      'Email support',
    ],
    highlighted: false,
  },
  {
    id: 'starter',
    label: 'Starter',
    priceINR: 199,
    amountPaise: 19900,
    quota: 1000,
    quotaLabel: '1,000 / month',
    description: 'For indie developers and side projects.',
    features: [
      '1,000 requests / month',
      'All 5 endpoints',
      'Pagination & filters',
      'JSON responses',
      'Priority email support',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    label: 'Pro',
    priceINR: 499,
    amountPaise: 49900,
    quota: 10000,
    quotaLabel: '10,000 / month',
    description: 'Best for startups and growing applications.',
    features: [
      '10,000 requests / month',
      'All 5 endpoints',
      'Pagination & filters',
      'JSON responses',
      'Priority email support',
      'Usage analytics',
    ],
    badge: 'Most Popular',
    badgeColor: 'bg-primary text-black',
    highlighted: true,
  },
  {
    id: 'ultra',
    label: 'Ultra',
    priceINR: 999,
    amountPaise: 99900,
    quota: 50000,
    quotaLabel: '50,000 / month',
    description: 'For agencies and production-grade applications.',
    features: [
      '50,000 requests / month',
      'All 5 endpoints',
      'Pagination & filters',
      'JSON responses',
      'Priority support + SLA',
      'Usage analytics',
      'Dedicated support channel',
    ],
    badge: 'Best Value',
    badgeColor: 'bg-secondary text-black',
    highlighted: false,
  },
];

export function getPlanById(id: string): ApiPlan | undefined {
  return API_PLANS.find((p) => p.id === id);
}
