'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import { API_PLANS, type ApiPlan } from '@/lib/apiPlans';

// ─── Razorpay global type ──────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ─── Load Razorpay script ──────────────────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'What counts as a request?',
    a: 'Every successful API call to any v1 endpoint counts as one request. Failed requests (invalid key, 404s) are not counted.',
  },
  {
    q: 'When does my monthly quota reset?',
    a: 'Your quota resets on the 1st of every calendar month at 00:00 UTC, regardless of when you subscribed.',
  },
  {
    q: 'Can I upgrade mid-month?',
    a: 'Yes! Upgrading takes effect immediately. Your new quota applies for the rest of the current month.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'We offer a 7-day refund if you are unsatisfied. Contact us at info@celebritypersona.com with your payment ID.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All Indian payment methods via Razorpay: UPI (GPay, PhonePe, Paytm), credit/debit cards, net banking, and wallets.',
  },
  {
    q: 'Do I need to add a credit card to start?',
    a: 'No. The Free plan requires no payment details at all. You only pay when you choose to upgrade.',
  },
];

// ─── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  currentPlanId,
  onUpgrade,
  loading,
}: {
  plan: ApiPlan;
  currentPlanId: string | null;
  onUpgrade: (plan: ApiPlan) => void;
  loading: string | null; // planId being processed
}) {
  const isCurrent = currentPlanId === plan.id;
  const isLoading = loading === plan.id;
  const isFree = plan.id === 'free';

  // Determine if user can upgrade to this plan
  const planOrder = ['free', 'starter', 'pro', 'ultra'];
  const currentIndex = planOrder.indexOf(currentPlanId || 'free');
  const thisIndex = planOrder.indexOf(plan.id);
  const isDowngrade = currentPlanId !== null && thisIndex < currentIndex;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
        plan.highlighted
          ? 'border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_40px_rgba(251,191,36,0.12)]'
          : 'border-border glass-card hover:border-white/20'
      }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap ${plan.badgeColor}`}>
          {plan.badge}
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-1">{plan.label}</p>
          <div className="flex items-end gap-1.5 mb-2">
            {isFree ? (
              <span className="text-4xl font-bold text-white font-playfair">Free</span>
            ) : (
              <>
                <span className="text-3xl font-bold text-white font-playfair">₹{plan.priceINR}</span>
                <span className="text-neutral-500 text-sm mb-1">/month</span>
              </>
            )}
          </div>
          <p className="text-xs text-neutral-500">{plan.description}</p>
        </div>

        {/* Quota highlight */}
        <div className={`mb-5 px-4 py-3 rounded-xl border ${plan.highlighted ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center gap-2">
            <Icon name="BoltIcon" size={15} className={plan.highlighted ? 'text-primary' : 'text-neutral-400'} />
            <span className={`text-sm font-bold ${plan.highlighted ? 'text-primary' : 'text-white'}`}>
              {plan.quotaLabel}
            </span>
            <span className="text-neutral-500 text-xs">requests</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-neutral-400">
              <Icon name="CheckCircleIcon" size={16} className="text-accent flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {isFree ? (
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-neutral-300 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
          >
            <Icon name="KeyIcon" size={15} />
            Get Started Free
          </Link>
        ) : isCurrent ? (
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold">
            <Icon name="CheckBadgeIcon" size={16} />
            Current Plan
          </div>
        ) : isDowngrade ? (
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-neutral-600 text-sm font-medium cursor-not-allowed">
            <Icon name="ArrowDownIcon" size={15} />
            Downgrade not available
          </div>
        ) : (
          <button
            onClick={() => onUpgrade(plan)}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              plan.highlighted
                ? 'bg-primary text-black hover:glow-gold'
                : 'bg-white/10 text-white hover:bg-white/20'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon name="CreditCardIcon" size={15} />
                Upgrade to {plan.label}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-white text-sm font-medium pr-4">{q}</span>
        <Icon
          name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={16}
          className="text-neutral-500 flex-shrink-0"
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-neutral-400 text-sm leading-relaxed border-t border-white/5">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ApiPricingContent() {
  const { user, isAuthenticated, authHeaders } = useAuth();
  const router = useRouter();

  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch current plan if logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/user/apikey/stats', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.hasKey) {
          setCurrentPlanId(d.stats?.planId || 'free');
        } else if (d.success && !d.hasKey) {
          setCurrentPlanId(null); // no key yet
        }
      })
      .catch(() => {});
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleUpgrade(plan: ApiPlan) {
    if (!isAuthenticated) {
      router.push('/login?redirect=/api-pricing');
      return;
    }

    setLoadingPlan(plan.id);
    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast('error', 'Failed to load payment gateway. Check your internet connection.');
        setLoadingPlan(null);
        return;
      }

      // 2. Create order on backend
      const orderRes = await fetch('/api/user/apikey/payment/create-order', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        showToast('error', orderData.message || 'Failed to create payment order.');
        setLoadingPlan(null);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'CelebrityPersona',
        description: `${plan.label} API Plan — ${plan.quotaLabel}`,
        image: '/assets/images/logo.png',
        order_id: orderData.order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#fbbf24' },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
            showToast('error', 'Payment cancelled.');
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await fetch('/api/user/apikey/payment/verify', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setCurrentPlanId(plan.id);
              showToast('success', `🎉 ${verifyData.message}`);
            } else {
              showToast('error', verifyData.message || 'Payment verification failed.');
            }
          } catch {
            showToast('error', 'Payment verification failed. Contact support.');
          } finally {
            setLoadingPlan(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        showToast('error', `Payment failed: ${response.error.description}`);
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (err) {
      showToast('error', 'Something went wrong. Please try again.');
      setLoadingPlan(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24">

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm text-sm transition-all ${
            toast.type === 'success'
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <Icon name={toast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={18} className="flex-shrink-0 mt-0.5" />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100">
            <Icon name="XMarkIcon" size={16} />
          </button>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="text-center py-14">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-5">
          <Icon name="CreditCardIcon" size={13} />
          API Pricing
        </span>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-neutral-400 max-w-2xl mx-auto text-base leading-relaxed">
          Start free. Upgrade as you grow. All plans include access to every endpoint — celebrities, outfits, news, movies, and reviews. Pay securely with UPI, cards, or net banking via Razorpay.
        </p>
      </div>

      {/* ── Plan cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
        {API_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanId={isAuthenticated ? currentPlanId : null}
            onUpgrade={handleUpgrade}
            loading={loadingPlan}
          />
        ))}
      </div>

      {/* ── Not logged in notice ───────────────────────────────────────────── */}
      {!isAuthenticated && (
        <div className="mb-16 flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
          <Icon name="InformationCircleIcon" size={20} className="text-primary flex-shrink-0" />
          <p className="text-neutral-300 text-sm">
            <Link href="/login?redirect=/api-pricing" className="text-primary font-semibold hover:underline">Log in</Link> or{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">create an account</Link> to upgrade your plan. Payments are instant and secure via Razorpay.
          </p>
        </div>
      )}

      {/* ── Comparison table ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="font-playfair text-2xl font-bold text-white text-center mb-8">Compare plans</h2>
        <div className="glass-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 border-b border-white/10">
            <div className="px-5 py-4 text-xs uppercase tracking-widest text-neutral-500 font-semibold col-span-1">Feature</div>
            {API_PLANS.map((p) => (
              <div key={p.id} className={`px-4 py-4 text-center text-sm font-semibold ${p.highlighted ? 'text-primary bg-primary/5' : 'text-white'}`}>
                {p.label}
                {p.badge && <span className={`block text-[10px] font-bold mt-0.5 ${p.highlighted ? 'text-primary' : 'text-secondary'}`}>{p.badge}</span>}
              </div>
            ))}
          </div>

          {/* Rows */}
          {[
            { label: 'Monthly requests', values: ['100', '1,000', '10,000', '50,000'] },
            { label: 'All 5 endpoints', values: ['✓', '✓', '✓', '✓'] },
            { label: 'Pagination & filters', values: ['✓', '✓', '✓', '✓'] },
            { label: 'Priority support', values: ['—', '✓', '✓', '✓'] },
            { label: 'Usage analytics', values: ['—', '—', '✓', '✓'] },
            { label: 'SLA guarantee', values: ['—', '—', '—', '✓'] },
            { label: 'Dedicated support', values: ['—', '—', '—', '✓'] },
            { label: 'Price / month', values: ['Free', '₹199', '₹499', '₹999'] },
          ].map((row, ri) => (
            <div key={row.label} className={`grid grid-cols-5 ${ri < 7 ? 'border-b border-white/5' : ''} hover:bg-white/[0.015] transition-colors`}>
              <div className="px-5 py-3.5 text-sm text-neutral-400 col-span-1">{row.label}</div>
              {row.values.map((v, i) => (
                <div
                  key={i}
                  className={`px-4 py-3.5 text-center text-sm ${
                    v === '✓' ? 'text-accent' : v === '—' ? 'text-neutral-700' : API_PLANS[i].highlighted ? 'text-primary font-semibold' : 'text-white'
                  } ${API_PLANS[i].highlighted ? 'bg-primary/[0.03]' : ''}`}
                >
                  {v}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment methods ────────────────────────────────────────────────── */}
      <div className="mb-16 glass-card border border-border rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-playfair text-xl font-bold text-white mb-2">Secure payments powered by Razorpay</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              We accept all major Indian payment methods. Your card details are never stored on our servers — all transactions are handled by Razorpay's PCI-DSS compliant infrastructure.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {['UPI', 'GPay', 'PhonePe', 'Cards', 'Net Banking', 'Wallets'].map((m) => (
              <span key={m} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300 font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="font-playfair text-2xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden glass-card border border-primary/20 p-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="relative">
          <h2 className="font-playfair text-3xl font-bold text-white mb-3">Ready to start building?</h2>
          <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
            Get your free API key in seconds. No credit card required for the Free plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-semibold text-sm hover:glow-gold transition-all"
            >
              <Icon name="KeyIcon" size={16} />
              Get Free API Key
            </Link>
            <Link
              href="/api-docs"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-neutral-300 hover:text-white hover:border-white/30 font-medium text-sm transition-all"
            >
              <Icon name="BookOpenIcon" size={16} />
              Read the Docs
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
