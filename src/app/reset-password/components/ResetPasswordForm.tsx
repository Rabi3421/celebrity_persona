"use client";

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface FormErrors {
  email?: string;
}

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    // Validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);

    // If no errors, simulate password reset
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage('Password reset link sent! Check your email. (Static UI - No backend)');
        setEmail('');
      }, 1500);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6">
      <div className="glass-card rounded-3xl p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <Icon name="KeyIcon" size={28} className="text-black" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">
            Reset Password
          </h1>
          <p className="text-neutral-400 text-sm">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20">
            <div className="flex items-start gap-3">
              <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
              <p className="text-success text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Icon
                name="EnvelopeIcon"
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />
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
            {errors.email && (
              <p className="text-error text-xs mt-2 ml-4">{errors.email}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black py-4 rounded-full font-semibold hover:glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-neutral-500">or</span>
          </div>
        </div>

        {/* Back to Login Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}