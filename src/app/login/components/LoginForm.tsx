"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);

    // If no errors, attempt login
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const result = await login(email, password);
        
        if (result.success) {
          setSuccessMessage('Login successful! Redirecting...');
          setEmail('');
          setPassword('');
          
          // Redirect based on user role
          setTimeout(() => {
            if (result.user?.role === 'superadmin') {
              router.push('/superadmin');
            } else if (result.user?.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          }, 1500);
        } else {
          setErrorMessage(result.message);
        }
      } catch (error) {
        setErrorMessage('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-5rem)]">

      {/* ── LEFT: Graphic Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#0d0d0d] via-[#1a0a2e] to-[#0d0d0d]">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name="SparklesIcon" size={20} className="text-black" />
          </div>
          <span className="font-playfair text-2xl font-bold text-white">CelebrityPersona</span>
        </div>

        {/* Centre graphic content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <span className="font-montserrat text-xs uppercase tracking-widest text-secondary mb-4 block">
            Your Style Universe
          </span>
          <h2 className="font-playfair text-5xl font-bold text-white leading-tight mb-6">
            Discover the World of
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Celebrity Fashion
            </span>
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed mb-10 max-w-sm">
            Access exclusive outfits, red-carpet looks, and behind-the-scenes celebrity style — all in one place.
          </p>

          {/* Feature pills */}
          <ul className="space-y-4">
            {[
              { icon: 'SparklesIcon', label: 'Exclusive celebrity outfit collections' },
              { icon: 'HeartIcon',    label: 'Save looks to your personal wishlist' },
              { icon: 'StarIcon',     label: 'Rate & review the latest styles' },
              { icon: 'BellIcon',     label: 'Get notified on new drops & releases' },
            ].map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full glass-card flex items-center justify-center shrink-0">
                  <Icon name={icon as any} size={16} className="text-primary" />
                </div>
                <span className="text-neutral-300 text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-neutral-500 text-xs italic">
            &ldquo;Fashion is the armor to survive the reality of everyday life.&rdquo;
          </p>
          <p className="text-neutral-600 text-xs mt-1">&mdash; Bill Cunningham</p>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon name="SparklesIcon" size={18} className="text-black" />
            </div>
            <span className="font-playfair text-xl font-bold text-white">CelebrityPersona</span>
          </div>

          <div className="mb-8">
            <h1 className="font-playfair text-4xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-neutral-400 text-sm">Sign in to access your celebrity content</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20">
              <p className="text-success text-sm text-center">{successMessage}</p>
            </div>
          )}
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20">
              <p className="text-error text-sm text-center">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Email Address</label>
              <div className="relative">
                <Icon name="EnvelopeIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full glass-card pl-12 pr-4 py-4 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.email ? 'focus:ring-error/50 border-error/50' : 'focus:ring-primary/50'
                  }`}
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-2 ml-4">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Password</label>
              <div className="relative">
                <Icon name="LockClosedIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full glass-card pl-12 pr-12 py-4 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.password ? 'focus:ring-error/50 border-error/50' : 'focus:ring-primary/50'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                  <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-2 ml-4">{errors.password}</p>}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link href="/reset-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-primary text-black py-4 rounded-full font-semibold hover:glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-neutral-500">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}