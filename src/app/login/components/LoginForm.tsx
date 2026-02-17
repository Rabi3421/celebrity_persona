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
    <div className="max-w-md mx-auto px-6">
      <div className="glass-card rounded-3xl p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <Icon name="SparklesIcon" size={28} className="text-black" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-neutral-400 text-sm">
            Sign in to access your celebrity content
          </p>
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

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Icon
                name="LockClosedIcon"
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full glass-card pl-12 pr-12 py-4 rounded-full text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.password ? 'focus:ring-error/50 border-error/50' : 'focus:ring-primary/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                <Icon
                  name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'}
                  size={20}
                />
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-2 ml-4">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/reset-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black py-4 rounded-full font-semibold hover:glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
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

        {/* Sign Up Link */}
        <p className="text-center text-sm text-neutral-400">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}