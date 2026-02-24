'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import { API_PLANS } from '@/lib/apiPlans';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyRecord {
  keyId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string;
  userActive: boolean;
  isOrphaned: boolean;
  keyPrefix: string;
  isActive: boolean;
  planId: string;
  freeQuota: number;
  purchasedQuota: number;
  totalQuota: number;
  totalHits: number;
  monthUsed: number;
  remaining: number;
  percentUsed: number;
  last7Days: { date: string; count: number }[];
  monthlyHits: { month: string; count: number }[];
  endpointHits: { endpoint: string; count: number; lastHitAt: string }[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface PaymentRecord {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planLabel: string;
  quotaGranted: number;
  amountINR: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

interface ApiKeySummary {
  totalKeys: number;
  activeKeys: number;
  totalHitsAllTime: number;
  totalHitsThisMonth: number;
  byPlan: { free: number; starter: number; pro: number; ultra: number };
}

interface PaymentSummary {
  totalOrders: number;
  paid: number;
  failed: number;
  abandoned: number;
  totalRevenueINR: string;
  byPlan: { starter: number; pro: number; ultra: number };
}

type Tab = 'keys' | 'payments';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free:    'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  starter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pro:     'bg-primary/20 text-primary border-primary/30',
  ultra:   'bg-secondary/20 text-secondary border-secondary/30',
};

const STATUS_COLORS: Record<string, string> = {
  paid:     'bg-accent/20 text-accent border-accent/30',
  failed:   'bg-red-500/20 text-red-400 border-red-500/30',
  created:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Micro bar chart (7-day)
function MiniBar({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} hits`}
          className="flex-1 rounded-sm bg-primary/60 hover:bg-primary transition-colors"
          style={{ height: `${Math.max(2, (d.count / max) * 24)}px` }}
        />
      ))}
    </div>
  );
}

// Quota progress bar
function QuotaBar({ percent }: { percent: number }) {
  const color = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-accent';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className={`text-xs font-mono ${percent >= 90 ? 'text-red-400' : 'text-neutral-400'}`}>{percent}%</span>
    </div>
  );
}

// ─── Expanded Row — API Key detail ────────────────────────────────────────────
function ApiKeyExpandedRow({ record }: { record: ApiKeyRecord }) {
  return (
    <tr>
      <td colSpan={10} className="px-6 pb-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          {/* Monthly breakdown */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">Last 6 Months</p>
            <div className="space-y-1.5">
              {record.monthlyHits.length === 0 && <p className="text-neutral-600 text-xs">No data yet</p>}
              {record.monthlyHits.map((m) => (
                <div key={m.month} className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500 w-16">{m.month}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/50"
                      style={{ width: `${Math.min(100, (m.count / record.totalQuota) * 100)}%` }}
                    />
                  </div>
                  <span className="text-neutral-400 w-8 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day chart */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">Last 7 Days</p>
            <div className="flex items-end gap-1 h-16">
              {record.last7Days.map((d) => {
                const max = Math.max(...record.last7Days.map((x) => x.count), 1);
                const h = Math.max(4, (d.count / max) * 56);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                    <span className="text-[9px] text-neutral-600">{d.count > 0 ? d.count : ''}</span>
                    <div className="w-full rounded-t bg-primary/60" style={{ height: `${h}px` }} />
                    <span className="text-[9px] text-neutral-600">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Endpoint breakdown */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">Endpoints Hit</p>
            {record.endpointHits.length === 0 ? (
              <p className="text-neutral-600 text-xs">No endpoint data yet</p>
            ) : (
              <div className="space-y-1.5">
                {record.endpointHits.slice(0, 8).map((ep) => (
                  <div key={ep.endpoint} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="text-accent font-mono truncate block" title={ep.endpoint}>
                        {ep.endpoint}
                      </span>
                    </div>
                    <span className="text-primary font-semibold flex-shrink-0 font-mono">{ep.count}×</span>
                  </div>
                ))}
                {record.endpointHits.length > 8 && (
                  <p className="text-neutral-600 text-[11px]">+{record.endpointHits.length - 8} more endpoints</p>
                )}
              </div>
            )}
          </div>

          {/* Key details */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">Key Details</p>
            {[
              { label: 'Key prefix',  value: record.keyPrefix },
              { label: 'User ID',     value: record.userId },
              { label: 'Free quota',  value: `${record.freeQuota}/mo` },
              { label: 'Paid quota',  value: record.purchasedQuota > 0 ? `+${record.purchasedQuota}/mo` : '—' },
              { label: 'Total quota', value: `${record.totalQuota}/mo` },
              { label: 'All-time hits', value: record.totalHits.toLocaleString() },
              { label: 'Last used',   value: fmtDateTime(record.lastUsedAt) },
              { label: 'Created',     value: fmtDate(record.createdAt) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">{row.label}</span>
                <span className="text-neutral-300 font-mono truncate max-w-[140px]" title={row.value}>{row.value}</span>
              </div>
            ))}
            {record.isOrphaned && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                ⚠️ User account deleted. This key is still active but has no owner.
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Manual Credit Modal ──────────────────────────────────────────────────────
function ManualCreditModal({
  order,
  onClose,
  onSuccess,
  authHeaders,
}: {
  order: PaymentRecord;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  authHeaders: () => Record<string, string>;
}) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCredit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/superadmin/payments/manual-credit', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, note }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.message);
        onClose();
      } else {
        setError(data.message || 'Failed to credit quota.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-playfair text-lg font-bold text-white">Manual Quota Credit</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-neutral-500">User</span><span className="text-white">{order.userEmail}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Plan</span><span className="text-primary font-semibold">{order.planLabel}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Quota to grant</span><span className="text-accent">{order.quotaGranted.toLocaleString()} req/mo</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Amount paid</span><span className="text-white">₹{order.amountINR}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Razorpay Payment ID</span><span className="font-mono text-neutral-300">{order.razorpayPaymentId || '—'}</span></div>
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Internal note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Manual credit — webhook failed on 25 Feb 2026"
            rows={2}
            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 resize-none focus:border-primary/50 focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <Icon name="ExclamationCircleIcon" size={13} />
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-neutral-400 hover:text-white text-sm transition-all">
            Cancel
          </button>
          <button
            onClick={handleCredit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-black font-semibold text-sm hover:glow-gold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Icon name="BoltIcon" size={15} />}
            {loading ? 'Crediting...' : 'Credit Quota'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApiKeyManagementSection() {
  const { authHeaders } = useAuth();
  const [tab, setTab] = useState<Tab>('keys');

  // ── API Keys tab state ────────────────────────────────────────────────────
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [keySummary, setKeySummary] = useState<ApiKeySummary | null>(null);
  const [keyPagination, setKeyPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [keyLoading, setKeyLoading] = useState(false);
  const [keySearch, setKeySearch] = useState('');
  const [keyPlanFilter, setKeyPlanFilter] = useState('');
  const [showOrphaned, setShowOrphaned] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [keyActionLoading, setKeyActionLoading] = useState<string | null>(null);

  // ── Payments tab state ────────────────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [paymentPagination, setPaymentPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [creditModal, setCreditModal] = useState<PaymentRecord | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Fetch API keys ────────────────────────────────────────────────────────
  async function revokeKey(keyId: string, currentActive: boolean) {
    setKeyActionLoading(keyId);
    try {
      const res = await fetch(`/api/superadmin/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        fetchKeys(keyPagination.page);
      } else showToast('error', data.message);
    } catch { showToast('error', 'Network error'); }
    finally { setKeyActionLoading(null); }
  }

  async function deleteKey(keyId: string) {
    if (!confirm('Permanently delete this API key? This cannot be undone.')) return;
    setKeyActionLoading(keyId);
    try {
      const res = await fetch(`/api/superadmin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        fetchKeys(keyPagination.page);
      } else showToast('error', data.message);
    } catch { showToast('error', 'Network error'); }
    finally { setKeyActionLoading(null); }
  }

  const fetchKeys = useCallback(async (page = 1) => {
    setKeyLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (keySearch) params.set('search', keySearch);
      if (keyPlanFilter) params.set('plan', keyPlanFilter);
      const res = await fetch(`/api/superadmin/api-keys?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
        setKeySummary(data.summary);
        setKeyPagination(data.pagination);
      }
    } catch { /* ignore */ }
    finally { setKeyLoading(false); }
  }, [keySearch, keyPlanFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch payments ────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async (page = 1) => {
    setPaymentLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (paymentSearch) params.set('search', paymentSearch);
      if (paymentStatusFilter) params.set('status', paymentStatusFilter);
      const res = await fetch(`/api/superadmin/payments?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
        setPaymentSummary(data.summary);
        setPaymentPagination(data.pagination);
      }
    } catch { /* ignore */ }
    finally { setPaymentLoading(false); }
  }, [paymentSearch, paymentStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (tab === 'keys') fetchKeys(1); }, [tab, keySearch, keyPlanFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'payments') fetchPayments(1); }, [tab, paymentSearch, paymentStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl text-sm max-w-sm ${
          toast.type === 'success' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <Icon name={toast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><Icon name="XMarkIcon" size={14} /></button>
        </div>
      )}

      {/* Manual credit modal */}
      {creditModal && (
        <ManualCreditModal
          order={creditModal}
          onClose={() => setCreditModal(null)}
          onSuccess={(msg) => { showToast('success', msg); fetchPayments(1); fetchKeys(1); }}
          authHeaders={authHeaders}
        />
      )}

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon name="KeyIcon" size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="font-playfair text-2xl font-bold text-white mb-1">API Key & Payment Tracking</h2>
            <p className="text-neutral-400 text-sm">
              Monitor every user's API usage, quota consumption, and payment history. Manually credit quota for failed payments.
            </p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/10">
        {([['keys', 'KeyIcon', 'API Keys & Usage'], ['payments', 'CreditCardIcon', 'Payments & Orders']] as const).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-primary text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Icon name={icon} size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: API KEYS                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'keys' && (
        <div className="space-y-5">
          {/* Summary cards */}
          {keySummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {[
                { label: 'Total Keys',        value: keySummary.totalKeys,            icon: 'KeyIcon',        color: 'text-primary',   bg: 'bg-primary/10' },
                { label: 'Active',            value: keySummary.activeKeys,           icon: 'CheckCircleIcon',color: 'text-accent',    bg: 'bg-accent/10' },
                { label: 'Hits This Month',   value: keySummary.totalHitsThisMonth.toLocaleString(), icon: 'BoltIcon', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'All-time Hits',     value: keySummary.totalHitsAllTime.toLocaleString(),   icon: 'ChartBarIcon', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { label: 'Paid Plans',        value: keySummary.byPlan.starter + keySummary.byPlan.pro + keySummary.byPlan.ultra, icon: 'CreditCardIcon', color: 'text-secondary', bg: 'bg-secondary/10' },
                { label: 'Free Plan',         value: keySummary.byPlan.free,          icon: 'UserIcon',       color: 'text-neutral-400', bg: 'bg-white/5' },
              ].map((s) => (
                <div key={s.label} className={`glass-card border border-white/10 rounded-xl p-4 ${s.bg}`}>
                  <Icon name={s.icon as any} size={18} className={`${s.color} mb-2`} />
                  <p className={`text-xl font-bold font-playfair ${s.color}`}>{s.value}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Plan breakdown pills */}
          {keySummary && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(keySummary.byPlan).map(([plan, count]) => (
                <button
                  key={plan}
                  onClick={() => setKeyPlanFilter(keyPlanFilter === plan ? '' : plan)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    keyPlanFilter === plan ? PLAN_COLORS[plan] + ' ring-1 ring-offset-1 ring-offset-background' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}: {count}
                </button>
              ))}
              <button
                onClick={() => { setShowOrphaned(!showOrphaned); setKeyPlanFilter(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  showOrphaned ? 'bg-red-500/20 text-red-400 border-red-500/30 ring-1' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-red-400'
                }`}
              >
                <Icon name="ExclamationCircleIcon" size={11} />
                Orphaned: {keys.filter(k => k.isOrphaned).length}
              </button>
              {(keyPlanFilter || showOrphaned) && (
                <button onClick={() => { setKeyPlanFilter(''); setShowOrphaned(false); }} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-neutral-500 hover:text-white">
                  <Icon name="XMarkIcon" size={12} /> Clear filter
                </button>
              )}
            </div>
          )}

          {/* Search + refresh */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={keySearch}
                onChange={(e) => setKeySearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-primary/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => fetchKeys(1)}
              disabled={keyLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-neutral-300 hover:text-white hover:border-white/30 text-sm transition-all disabled:opacity-50"
            >
              <Icon name="ArrowPathIcon" size={15} className={keyLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="glass-card border border-border rounded-2xl overflow-hidden">
            {keyLoading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-neutral-400 text-sm">Loading API keys...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-sm">
                <Icon name="KeyIcon" size={32} className="mx-auto mb-3 opacity-30" />
                No API keys found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">User</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Plan</th>
                      <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Month Used</th>
                      <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Remaining</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold w-32">Usage %</th>
                      <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">All-time</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">7-day chart</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Last Used</th>
                      <th className="px-4 py-3" />
                      <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showOrphaned ? keys.filter(k => k.isOrphaned) : keys).map((k) => (
                      <>
                        <tr
                          key={k.keyId}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setExpandedKey(expandedKey === k.keyId ? null : k.keyId)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0 ${
                                k.isOrphaned ? 'bg-red-500/60' : k.isActive ? 'bg-primary' : 'bg-neutral-600'
                              }`}>
                                {k.isOrphaned ? '?' : (k.userName || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-white text-xs font-medium">
                                    {k.isOrphaned ? 'Deleted User' : k.userName}
                                  </p>
                                  {k.isOrphaned && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">ORPHANED</span>
                                  )}
                                </div>
                                <p className="text-neutral-500 text-[11px] font-mono">
                                  {k.isOrphaned ? k.userId : k.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold capitalize ${PLAN_COLORS[k.planId]}`}>
                              {k.planId}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-white text-xs font-mono">{k.monthUsed}</span>
                            <span className="text-neutral-600 text-[11px]">/{k.totalQuota}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs font-mono font-semibold ${k.remaining === 0 ? 'text-red-400' : k.remaining < k.totalQuota * 0.1 ? 'text-amber-400' : 'text-accent'}`}>
                              {k.remaining}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <QuotaBar percent={k.percentUsed} />
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-neutral-400 font-mono">{k.totalHits.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <MiniBar data={k.last7Days} />
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(k.lastUsedAt)}</td>
                          <td className="px-4 py-3">
                            <Icon
                              name={expandedKey === k.keyId ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                              size={14}
                              className="text-neutral-500"
                            />
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button
                                disabled={keyActionLoading === k.keyId}
                                onClick={() => revokeKey(k.keyId, k.isActive)}
                                title={k.isActive ? 'Revoke key' : 'Restore key'}
                                className={`p-1.5 rounded-lg border text-[11px] transition-all ${
                                  k.isActive
                                    ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    : 'border-accent/30 text-accent hover:bg-accent/10'
                                } disabled:opacity-40`}
                              >
                                {keyActionLoading === k.keyId
                                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  : <Icon name={k.isActive ? 'NoSymbolIcon' : 'CheckCircleIcon'} size={13} />}
                              </button>
                              {k.isOrphaned && (
                                <button
                                  disabled={keyActionLoading === k.keyId}
                                  onClick={() => deleteKey(k.keyId)}
                                  title="Delete orphaned key permanently"
                                  className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                                >
                                  <Icon name="TrashIcon" size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedKey === k.keyId && <ApiKeyExpandedRow record={k} />}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {keyPagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>{keyPagination.total} total keys</span>
              <div className="flex gap-2">
                <button disabled={keyPagination.page === 1} onClick={() => fetchKeys(keyPagination.page - 1)} className="px-3 py-1.5 rounded-lg border border-border hover:border-white/30 disabled:opacity-40">← Prev</button>
                <span className="px-3 py-1.5">{keyPagination.page} / {keyPagination.pages}</span>
                <button disabled={keyPagination.page === keyPagination.pages} onClick={() => fetchKeys(keyPagination.page + 1)} className="px-3 py-1.5 rounded-lg border border-border hover:border-white/30 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: PAYMENTS                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="space-y-5">
          {/* Summary cards */}
          {paymentSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {[
                { label: 'Total Orders',  value: paymentSummary.totalOrders,  icon: 'DocumentTextIcon', color: 'text-white',       bg: 'bg-white/5' },
                { label: 'Paid',          value: paymentSummary.paid,          icon: 'CheckCircleIcon',  color: 'text-accent',     bg: 'bg-accent/10' },
                { label: 'Failed',        value: paymentSummary.failed,        icon: 'XCircleIcon',      color: 'text-red-400',    bg: 'bg-red-500/10' },
                { label: 'Abandoned',     value: paymentSummary.abandoned,     icon: 'ClockIcon',        color: 'text-amber-400',  bg: 'bg-amber-500/10' },
                { label: 'Revenue (INR)', value: `₹${paymentSummary.totalRevenueINR}`, icon: 'CurrencyRupeeIcon', color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Pro Sales',     value: paymentSummary.byPlan.pro,    icon: 'StarIcon',         color: 'text-primary',    bg: 'bg-primary/5' },
              ].map((s) => (
                <div key={s.label} className={`glass-card border border-white/10 rounded-xl p-4 ${s.bg}`}>
                  <Icon name={s.icon as any} size={18} className={`${s.color} mb-2`} />
                  <p className={`text-xl font-bold font-playfair ${s.color}`}>{s.value}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {(['', 'paid', 'failed', 'created', 'refunded'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPaymentStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all capitalize ${
                  paymentStatusFilter === s
                    ? s === '' ? 'bg-white/20 border-white/30 text-white' : STATUS_COLORS[s] + ' ring-1'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {s === '' ? 'All' : s === 'created' ? 'Abandoned' : s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search by email, order ID, payment ID..."
                className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-primary/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => fetchPayments(1)}
              disabled={paymentLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-neutral-300 hover:text-white hover:border-white/30 text-sm transition-all disabled:opacity-50"
            >
              <Icon name="ArrowPathIcon" size={15} className={paymentLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Help notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-200/70">
            <Icon name="InformationCircleIcon" size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              If a payment shows <strong className="text-accent">paid</strong> but the user's quota wasn't updated, click the row and use <strong className="text-primary">Manual Credit</strong> to instantly grant them the correct quota.
            </span>
          </div>

          {/* Table */}
          <div className="glass-card border border-border rounded-2xl overflow-hidden">
            {paymentLoading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-neutral-400 text-sm">Loading payments...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-sm">
                <Icon name="CreditCardIcon" size={32} className="mx-auto mb-3 opacity-30" />
                No payment records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">User</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Plan</th>
                      <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Amount</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Razorpay Order ID</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Payment ID</th>
                      <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Date</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <>
                        <tr
                          key={p.orderId}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setExpandedPayment(expandedPayment === p.orderId ? null : p.orderId)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-secondary/30 flex items-center justify-center text-xs font-bold text-secondary flex-shrink-0">
                                {p.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white text-xs font-medium">{p.userName}</p>
                                <p className="text-neutral-500 text-[11px]">{p.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold capitalize ${PLAN_COLORS[p.planId]}`}>
                              {p.planLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-mono text-xs font-semibold">₹{p.amountINR}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold capitalize ${STATUS_COLORS[p.status]}`}>
                              {p.status === 'created' ? 'abandoned' : p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[120px] block">{p.razorpayOrderId}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-mono ${p.razorpayPaymentId ? 'text-accent' : 'text-neutral-600'}`}>
                              {p.razorpayPaymentId || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-neutral-500">{fmtDateTime(p.createdAt)}</td>
                          <td className="px-4 py-3 text-center">
                            {p.status === 'paid' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setCreditModal(p); }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-all mx-auto"
                                title="Manually grant quota if auto-credit failed"
                              >
                                <Icon name="BoltIcon" size={12} />
                                Credit
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {expandedPayment === p.orderId && (
                          <tr key={`${p.orderId}-detail`}>
                            <td colSpan={8} className="px-6 pb-4 pt-0">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                                {[
                                  { label: 'Internal Order ID', value: p.orderId },
                                  { label: 'Quota Granted', value: `${p.quotaGranted.toLocaleString()} req/mo` },
                                  { label: 'Razorpay Order ID', value: p.razorpayOrderId },
                                  { label: 'Payment ID', value: p.razorpayPaymentId || '—' },
                                  { label: 'Signature', value: p.razorpaySignature || '—' },
                                  { label: 'Currency', value: p.planId === 'free' ? '—' : 'INR' },
                                  { label: 'Created', value: fmtDateTime(p.createdAt) },
                                  { label: 'Last Updated', value: fmtDateTime(p.updatedAt) },
                                ].map((row) => (
                                  <div key={row.label} className="bg-white/5 rounded-lg p-3">
                                    <p className="text-neutral-600 mb-1">{row.label}</p>
                                    <p className="text-neutral-200 font-mono break-all">{row.value}</p>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {paymentPagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>{paymentPagination.total} total orders</span>
              <div className="flex gap-2">
                <button disabled={paymentPagination.page === 1} onClick={() => fetchPayments(paymentPagination.page - 1)} className="px-3 py-1.5 rounded-lg border border-border hover:border-white/30 disabled:opacity-40">← Prev</button>
                <span className="px-3 py-1.5">{paymentPagination.page} / {paymentPagination.pages}</span>
                <button disabled={paymentPagination.page === paymentPagination.pages} onClick={() => fetchPayments(paymentPagination.page + 1)} className="px-3 py-1.5 rounded-lg border border-border hover:border-white/30 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
