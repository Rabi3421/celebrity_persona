'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import { API_PLANS, type ApiPlan } from '@/lib/apiPlans';

// Razorpay global
declare global { interface Window { Razorpay: any; } }
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(false); return; }
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── types ────────────────────────────────────────────────────────────────────

interface ApiStats {
  isActive: boolean;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  totalHits: number;
  monthUsed: number;
  freeQuota: number;
  purchasedQuota: number;
  totalQuota: number;
  remaining: number;
  percentUsed: number;
  planId: string;
  last7Days: { date: string; count: number }[];
  last3Months: { month: string; count: number }[];
}

type ModalType = 'generate' | 'reveal' | 'revoke' | null;

// ── endpoint cards ────────────────────────────────────────────────────────────

const endpoints = [
  {
    resource: 'Celebrities',
    icon: 'StarIcon',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    list: 'GET /api/v1/celebrities',
    single: 'GET /api/v1/celebrities/{slug}',
    params: [
      { name: 'page', desc: 'Page number (default: 1)' },
      { name: 'limit', desc: 'Items per page, max 50 (default: 20)' },
      { name: 'search', desc: 'Name search string' },
      { name: 'occupation', desc: 'Filter by occupation' },
      { name: 'nationality', desc: 'Filter by nationality' },
      { name: 'sort', desc: 'name_asc | name_desc | latest | oldest' },
    ],
  },
  {
    resource: 'Outfits',
    icon: 'SparklesIcon',
    color: 'text-secondary',
    bg: 'bg-secondary/10 border-secondary/20',
    list: 'GET /api/v1/outfits',
    single: 'GET /api/v1/outfits/{slug}',
    params: [
      { name: 'page', desc: 'Page number' },
      { name: 'limit', desc: 'Items per page, max 50' },
      { name: 'search', desc: 'Title search' },
      { name: 'celebrity', desc: 'Celebrity slug' },
      { name: 'category', desc: 'Outfit category' },
      { name: 'brand', desc: 'Brand name' },
      { name: 'sort', desc: 'latest | oldest | popular | title_asc' },
    ],
  },
  {
    resource: 'News',
    icon: 'NewspaperIcon',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    list: 'GET /api/v1/news',
    single: 'GET /api/v1/news/{slug}',
    params: [
      { name: 'page', desc: 'Page number' },
      { name: 'limit', desc: 'Items per page, max 50' },
      { name: 'search', desc: 'Title search' },
      { name: 'category', desc: 'News category' },
      { name: 'celebrity', desc: 'Celebrity slug' },
      { name: 'featured', desc: 'true | false' },
      { name: 'sort', desc: 'latest | oldest | popular' },
    ],
  },
  {
    resource: 'Movies',
    icon: 'FilmIcon',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    list: 'GET /api/v1/movies',
    single: 'GET /api/v1/movies/{slug}',
    params: [
      { name: 'page', desc: 'Page number' },
      { name: 'limit', desc: 'Items per page, max 50' },
      { name: 'search', desc: 'Title search' },
      { name: 'genre', desc: 'Movie genre' },
      { name: 'status', desc: 'Movie status' },
      { name: 'featured', desc: 'true | false' },
      { name: 'sort', desc: 'release_asc | release_desc | latest | title_asc' },
    ],
  },
  {
    resource: 'Reviews',
    icon: 'ChatBubbleLeftRightIcon',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    list: 'GET /api/v1/reviews',
    single: 'GET /api/v1/reviews/{slug}',
    params: [
      { name: 'page', desc: 'Page number' },
      { name: 'limit', desc: 'Items per page, max 50' },
      { name: 'search', desc: 'Movie title search' },
      { name: 'minRating', desc: 'Minimum rating (0–10)' },
      { name: 'maxRating', desc: 'Maximum rating (0–10)' },
      { name: 'featured', desc: 'true | false' },
      { name: 'sort', desc: 'latest | oldest | rating_high | rating_low' },
    ],
  },
];

// ── mini bar chart ────────────────────────────────────────────────────────────

function MiniBar({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full rounded-sm bg-primary/40 group-hover:bg-primary transition-all"
            style={{ height: `${Math.max(4, (d.count / max) * 40)}px` }}
          />
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-card border border-border px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
            {d.date.slice(5)}: {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── password modal ────────────────────────────────────────────────────────────

function PasswordModal({
  type,
  onConfirm,
  onClose,
  loading,
  error,
}: {
  type: ModalType;
  onConfirm: (password: string) => void;
  onClose: () => void;
  loading: boolean;
  error: string;
}) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);

  const titles: Record<string, string> = {
    reveal: 'Verify Identity to Reveal Key',
    revoke: 'Verify Identity to Revoke Key',
  };
  const descriptions: Record<string, string> = {
    reveal: 'Enter your account password to view your full API key.',
    revoke: 'Enter your password to permanently delete your API key.',
  };
  const btnColors: Record<string, string> = {
    reveal: 'bg-primary text-black hover:glow-gold',
    revoke: 'bg-red-500 text-white hover:bg-red-400',
  };

  if (!type || type === 'generate') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="LockClosedIcon" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{titles[type]}</h3>
            <p className="text-xs text-neutral-400">{descriptions[type]}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pw && onConfirm(pw)}
            placeholder="Enter your password"
            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50 pr-10"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            <Icon name={show ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3 flex items-center gap-1.5">
            <Icon name="ExclamationCircleIcon" size={13} />
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-neutral-400 hover:text-white text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => pw && onConfirm(pw)}
            disabled={loading || !pw}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${btnColors[type]}`}
          >
            {loading ? 'Verifying...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ApiSection() {
  const { user, authHeaders } = useAuth();

  const [stats, setStats] = useState<ApiStats | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [modal, setModal] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const [openEndpoint, setOpenEndpoint] = useState<number | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [upgradeToast, setUpgradeToast] = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  function showUpgradeToast(type: 'success'|'error', msg: string) {
    setUpgradeToast({ type, msg });
    setTimeout(() => setUpgradeToast(null), 5000);
  }

  async function handleUpgrade(plan: ApiPlan) {
    setUpgradeLoading(plan.id);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        showUpgradeToast('error', 'Failed to load payment gateway.');
        setUpgradeLoading(null);
        return;
      }
      const orderRes = await fetch('/api/user/apikey/payment/create-order', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        showUpgradeToast('error', orderData.message || 'Failed to create order.');
        setUpgradeLoading(null);
        return;
      }
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'CelebrityPersona',
        description: `${plan.label} API Plan — ${plan.quotaLabel}`,
        order_id: orderData.order.id,
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#fbbf24' },
        modal: { ondismiss: () => { setUpgradeLoading(null); } },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const vRes = await fetch('/api/user/apikey/payment/verify', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const vData = await vRes.json();
            if (vData.success) {
              showUpgradeToast('success', `🎉 Upgraded to ${plan.label}!`);
              fetchStats();
            } else {
              showUpgradeToast('error', vData.message || 'Verification failed.');
            }
          } catch { showUpgradeToast('error', 'Verification error. Contact support.'); }
          finally { setUpgradeLoading(null); }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r: any) => {
        showUpgradeToast('error', `Payment failed: ${r.error.description}`);
        setUpgradeLoading(null);
      });
      rzp.open();
    } catch { showUpgradeToast('error', 'Something went wrong.'); setUpgradeLoading(null); }
  }

  // ── fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/user/apikey/stats', {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setHasKey(data.hasKey);
        setStats(data.stats);
      }
    } catch {
      /* ignore */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── generate key ───────────────────────────────────────────────────────────
  async function handleGenerate() {
    setGenerateLoading(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/user/apikey/generate', {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setRevealedKey(data.apiKey.key);
        setHasKey(true);
        fetchStats();
      } else {
        setGenerateError(data.message || 'Failed to generate key.');
      }
    } catch {
      setGenerateError('Network error. Please try again.');
    } finally {
      setGenerateLoading(false);
    }
  }

  // ── reveal / revoke via password modal ────────────────────────────────────
  async function handleModalConfirm(password: string) {
    setModalLoading(true);
    setModalError('');
    try {
      const endpoint = modal === 'reveal' ? '/api/user/apikey/reveal' : '/api/user/apikey/revoke';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        if (modal === 'reveal') {
          setRevealedKey(data.apiKey.key);
        } else {
          setRevealedKey(null);
          setHasKey(false);
          setStats(null);
          fetchStats();
        }
        setModal(null);
      } else {
        setModalError(data.message || 'Operation failed.');
      }
    } catch {
      setModalError('Network error. Please try again.');
    } finally {
      setModalLoading(false);
    }
  }

  function handleCloseModal() {
    setModal(null);
    setModalError('');
  }

  function copyKey() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2500);
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PasswordModal
        type={modal}
        onConfirm={handleModalConfirm}
        onClose={handleCloseModal}
        loading={modalLoading}
        error={modalError}
      />

      <div className="space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Icon name="KeyIcon" size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-playfair text-2xl font-bold text-white mb-1">API Access</h2>
              <p className="text-neutral-400 text-sm max-w-2xl">
                Use your personal API key to query CelebrityPersona data programmatically.
                Each key is unique to your account. Free tier: <span className="text-primary font-semibold">100 requests / month</span>.
              </p>
            </div>
            <a
              href="/api-docs"
              className="flex-shrink-0 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all text-sm font-medium"
            >
              <Icon name="BookOpenIcon" size={15} />
              View Full Docs
            </a>
          </div>
        </div>

        {/* ── Key panel ──────────────────────────────────────────────────── */}
        {statsLoading ? (
          <div className="glass-card border border-border rounded-2xl p-8 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-neutral-400 text-sm">Loading API info...</span>
          </div>
        ) : !hasKey ? (
          /* No key yet */
          <div className="glass-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="KeyIcon" size={30} className="text-primary" />
            </div>
            <h3 className="font-playfair text-xl font-semibold text-white mb-2">No API Key Yet</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">
              Generate your free API key to start accessing CelebrityPersona data.
              You get <span className="text-primary font-semibold">100 free requests per month</span>.
            </p>
            {generateError && (
              <p className="text-red-400 text-xs mb-4 flex items-center justify-center gap-1.5">
                <Icon name="ExclamationCircleIcon" size={13} />
                {generateError}
              </p>
            )}
            <button
              onClick={handleGenerate}
              disabled={generateLoading}
              className="px-6 py-3 rounded-xl bg-primary text-black font-semibold hover:glow-gold transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {generateLoading ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Icon name="PlusCircleIcon" size={18} /> Generate API Key</>
              )}
            </button>
          </div>
        ) : (
          /* Has key */
          <div className="glass-card border border-border rounded-2xl p-6 space-y-6">
            {/* Key display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Your API Key</span>
                <div className="flex items-center gap-2">
                  {stats && (
                    <>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        stats.isActive
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {stats.isActive ? '● Active' : '● Inactive'}
                      </span>
                      {stats.planId && stats.planId !== 'free' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/20 text-primary border border-primary/30">
                          {API_PLANS.find(p => p.id === stats.planId)?.label || stats.planId} Plan
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Revealed key */}
              {revealedKey ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-input border border-primary/30 rounded-xl px-4 py-3 font-mono text-sm text-primary break-all">
                    {revealedKey}
                  </div>
                  <button
                    onClick={copyKey}
                    className="flex-shrink-0 p-3 rounded-xl border border-border hover:border-primary/50 text-neutral-400 hover:text-primary transition-all"
                    title="Copy key"
                  >
                    <Icon name={keyCopied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={18} className={keyCopied ? 'text-accent' : ''} />
                  </button>
                  <button
                    onClick={() => setRevealedKey(null)}
                    className="flex-shrink-0 p-3 rounded-xl border border-border hover:border-border/60 text-neutral-400 hover:text-white transition-all"
                    title="Hide key"
                  >
                    <Icon name="EyeSlashIcon" size={18} />
                  </button>
                </div>
              ) : (
                /* Masked key */
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-input border border-border rounded-xl px-4 py-3 font-mono text-sm text-neutral-500">
                    {stats?.keyPrefix || 'cp_live_••••••••••••••••••••••••••••••••••••••••'}
                  </div>
                  <button
                    onClick={() => { setModal('reveal'); setModalError(''); }}
                    className="flex-shrink-0 px-4 py-3 rounded-xl border border-border hover:border-primary/50 text-neutral-400 hover:text-primary transition-all text-sm flex items-center gap-1.5"
                    title="Reveal key (requires password)"
                  >
                    <Icon name="EyeIcon" size={16} />
                    <span className="hidden sm:inline">Reveal</span>
                  </button>
                </div>
              )}

              {revealedKey && (
                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
                  <Icon name="ExclamationTriangleIcon" size={12} />
                  Keep this key secret. Never expose it in client-side code or public repositories.
                </p>
              )}
            </div>

            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Used this month', value: stats.monthUsed, icon: 'ArrowTrendingUpIcon', color: 'text-primary' },
                  { label: 'Remaining', value: stats.remaining, icon: 'ShieldCheckIcon', color: 'text-accent' },
                  { label: 'Total quota', value: stats.totalQuota, icon: 'CircleStackIcon', color: 'text-secondary' },
                  { label: 'All-time hits', value: stats.totalHits, icon: 'BoltIcon', color: 'text-purple-400' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={stat.icon as any} size={14} className={stat.color} />
                      <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quota bar */}
            {stats && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-neutral-400">Monthly usage</span>
                  <span className="text-xs font-semibold text-white">{stats.monthUsed} / {stats.totalQuota}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stats.percentUsed >= 90 ? 'bg-red-500' :
                      stats.percentUsed >= 70 ? 'bg-amber-400' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-neutral-500">
                    {stats.purchasedQuota > 0 && `+${stats.purchasedQuota} purchased`}
                  </span>
                  <span className={`text-[11px] font-medium ${
                    stats.percentUsed >= 90 ? 'text-red-400' :
                    stats.percentUsed >= 70 ? 'text-amber-400' : 'text-neutral-500'
                  }`}>
                    {stats.percentUsed}% used
                  </span>
                </div>
              </div>
            )}

            {/* 7-day chart */}
            {stats && stats.last7Days.some((d) => d.count > 0) && (
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Last 7 days</p>
                <MiniBar data={stats.last7Days} />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-neutral-600">{stats.last7Days[0]?.date.slice(5)}</span>
                  <span className="text-[10px] text-neutral-600">{stats.last7Days[6]?.date.slice(5)}</span>
                </div>
              </div>
            )}

            {/* Key info row */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <Icon name="CalendarIcon" size={13} />
                  <span>Created: {new Date(stats.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="ClockIcon" size={13} />
                  <span>Last used: {stats.lastUsedAt ? new Date(stats.lastUsedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</span>
                </div>
              </div>
            )}

            {/* Upgrade toast */}
            {upgradeToast && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border ${
                upgradeToast.type === 'success'
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <Icon name={upgradeToast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
                {upgradeToast.msg}
              </div>
            )}

            {/* Upgrade plans */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Icon name="BoltIcon" size={15} className="text-primary" />
                  Upgrade Plan
                </p>
                <Link href="/api-pricing" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all plans <Icon name="ArrowRightIcon" size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {API_PLANS.filter(p => p.id !== 'free').map((plan) => {
                  const planOrder = ['free','starter','pro','ultra'];
                  const currentIdx = planOrder.indexOf(stats?.planId || 'free');
                  const thisIdx = planOrder.indexOf(plan.id);
                  const isCurrent = stats?.planId === plan.id;
                  const isBelow = thisIdx <= currentIdx;
                  const isLoading = upgradeLoading === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => !isBelow && !isCurrent && handleUpgrade(plan)}
                      disabled={isBelow || isCurrent || !!upgradeLoading}
                      className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'border-accent/30 bg-accent/5 cursor-default'
                          : isBelow
                          ? 'border-white/5 bg-white/[0.02] cursor-not-allowed opacity-40'
                          : plan.highlighted
                          ? 'border-primary/40 bg-primary/10 hover:bg-primary/15'
                          : 'border-border hover:border-white/20 hover:bg-white/5'
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-xs font-bold ${
                          isCurrent ? 'text-accent' : plan.highlighted ? 'text-primary' : 'text-white'
                        }`}>{plan.label}</span>
                        {isCurrent && <Icon name="CheckBadgeIcon" size={13} className="text-accent" />}
                        {plan.highlighted && !isCurrent && <span className="text-[9px] bg-primary text-black px-1.5 py-0.5 rounded-full font-bold">Popular</span>}
                      </div>
                      <span className="text-[11px] text-neutral-500">{plan.quotaLabel}</span>
                      <span className={`text-xs font-semibold mt-1.5 ${
                        isCurrent ? 'text-accent' : plan.highlighted ? 'text-primary' : 'text-white'
                      }`}>
                        {isCurrent ? '✓ Active' : isLoading ? 'Processing…' : `₹${plan.priceINR}/mo`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Revoke key */}
            <div className="flex justify-end pt-1 border-t border-white/10">
              <button
                onClick={() => { setModal('revoke'); setModalError(''); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
              >
                <Icon name="TrashIcon" size={15} />
                Revoke key
              </button>
            </div>
          </div>
        )}

        {/* ── Quick-start code snippet ────────────────────────────────────── */}
        <div className="glass-card border border-border rounded-2xl p-6">
          <h3 className="font-playfair text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="CodeBracketIcon" size={20} className="text-primary" />
            Quick Start
          </h3>
          <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-accent/70" />
              <span className="text-xs text-neutral-500 ml-2">example.js</span>
            </div>
            <pre className="p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">
{`// Fetch celebrity profiles
const response = await fetch(
  'https://yoursite.com/api/v1/celebrities?page=1&limit=10',
  {
    headers: {
      'x-api-key': 'YOUR_API_KEY_HERE'
    }
  }
);

const { data, pagination } = await response.json();
console.log(data); // Array of celebrity objects

// Fetch single celebrity by slug
const celeb = await fetch(
  'https://yoursite.com/api/v1/celebrities/ryan-gosling',
  { headers: { 'x-api-key': 'YOUR_API_KEY_HERE' } }
);`}
            </pre>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <Icon name="InformationCircleIcon" size={14} className="text-primary" />
              Response format
            </p>
            <pre className="text-xs text-neutral-400 font-mono leading-relaxed overflow-x-auto">
{`{
  "success": true,
  "version": "v1",
  "resource": "celebrities",
  "pagination": { "page": 1, "limit": 10, "total": 248, "pages": 25 },
  "data": [ { ...celebrity object } ]
}`}
            </pre>
          </div>
        </div>

        {/* ── Endpoint reference ──────────────────────────────────────────── */}
        <div className="glass-card border border-border rounded-2xl p-6">
          <h3 className="font-playfair text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Icon name="ListBulletIcon" size={20} className="text-primary" />
            Available Endpoints
          </h3>
          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <div key={ep.resource} className={`rounded-xl border ${ep.bg} overflow-hidden`}>
                <button
                  onClick={() => setOpenEndpoint(openEndpoint === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={ep.icon as any} size={18} className={ep.color} />
                    <span className="font-semibold text-white text-sm">{ep.resource}</span>
                    <span className="text-xs bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full">{ep.params.length} params</span>
                  </div>
                  <Icon name={openEndpoint === i ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-neutral-400 flex-shrink-0" />
                </button>

                {openEndpoint === i && (
                  <div className="px-5 pb-5 space-y-3">
                    {/* Routes */}
                    <div className="space-y-1.5">
                      {[ep.list, ep.single].map((route) => (
                        <div key={route} className="flex items-center gap-2 font-mono text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold">GET</span>
                          <span className="text-neutral-300">{route}</span>
                        </div>
                      ))}
                    </div>
                    {/* Params */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Query Parameters</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {ep.params.map((p) => (
                          <div key={p.name} className="flex items-start gap-2 text-xs">
                            <span className={`font-mono font-semibold flex-shrink-0 ${ep.color}`}>{p.name}</span>
                            <span className="text-neutral-500">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Required header reminder */}
                    <div className="flex items-center gap-2 text-xs bg-black/20 rounded-lg px-3 py-2">
                      <Icon name="ShieldCheckIcon" size={13} className="text-primary flex-shrink-0" />
                      <span className="text-neutral-400">Required header: <code className="text-primary font-mono">x-api-key: YOUR_KEY</code></span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Rate limit info ─────────────────────────────────────────────── */}
        <div className="glass-card border border-border rounded-2xl p-6">
          <h3 className="font-playfair text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="ChartBarIcon" size={20} className="text-primary" />
            Rate Limits & Errors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">HTTP Status Codes</p>
              {[
                { code: '200', label: 'OK — Success', color: 'text-accent' },
                { code: '401', label: 'Unauthorized — Missing or invalid key', color: 'text-amber-400' },
                { code: '404', label: 'Not Found — Resource not found', color: 'text-red-400' },
                { code: '429', label: 'Too Many Requests — Monthly quota exceeded', color: 'text-red-400' },
                { code: '500', label: 'Server Error — Contact support', color: 'text-red-400' },
              ].map((s) => (
                <div key={s.code} className="flex items-center gap-3 text-xs">
                  <span className={`font-mono font-bold w-8 ${s.color}`}>{s.code}</span>
                  <span className="text-neutral-400">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Quota tiers</p>
              {[
                { tier: 'Free', requests: '100 / month', price: 'Free', highlight: false },
                { tier: 'Starter', requests: '1,000 / month', price: 'Contact us', highlight: false },
                { tier: 'Pro', requests: '10,000 / month', price: 'Contact us', highlight: true },
                { tier: 'Enterprise', requests: 'Unlimited', price: 'Contact us', highlight: false },
              ].map((t) => (
                <div key={t.tier} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${t.highlight ? 'bg-primary/10 border border-primary/20' : 'bg-white/5'}`}>
                  <span className={`font-semibold ${t.highlight ? 'text-primary' : 'text-white'}`}>{t.tier}</span>
                  <span className="text-neutral-400">{t.requests}</span>
                  <span className={`${t.highlight ? 'text-primary font-semibold' : 'text-neutral-500'}`}>{t.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
