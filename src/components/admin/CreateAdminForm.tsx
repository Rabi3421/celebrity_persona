'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface CreateAdminFormProps {
  onAdminCreated?: () => void;
}

export default function CreateAdminForm({ onAdminCreated }: CreateAdminFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { user, authHeaders } = useAuth();

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
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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

    // If no errors, attempt to create admin
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/superadmin/admins/create', {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage(`Admin account created successfully for ${data.admin.name}`);
          setName('');
          setEmail('');
          setPassword('');
          onAdminCreated?.();
        } else {
          setErrorMessage(data.message || 'Failed to create admin account');
        }
      } catch (error) {
        setErrorMessage('Network error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (user?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="glass-card rounded-3xl p-8">
      <h2 className="font-playfair text-2xl font-bold text-white mb-6">Create Admin Account</h2>
      
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
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter admin's full name"
            className={`w-full glass-card px-4 py-3 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
              errors.name ? 'focus:ring-error/50 border-error/50' : 'focus:ring-primary/50'
            }`}
          />
          {errors.name && (
            <p className="text-error text-xs mt-2">{errors.name}</p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin's email"
            className={`w-full glass-card px-4 py-3 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
              errors.email ? 'focus:ring-error/50 border-error/50' : 'focus:ring-primary/50'
            }`}
          />
          {errors.email && (
            <p className="text-error text-xs mt-2">{errors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin's password"
            className={`w-full glass-card px-4 py-3 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
              errors.password ? 'focus:ring-error/50 border-error/50' : 'focus:ring-primary/50'
            }`}
          />
          {errors.password && (
            <p className="text-error text-xs mt-2">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-black py-3 rounded-2xl font-semibold hover:glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
        </button>
      </form>
    </div>
  );
}