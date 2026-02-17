'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function InitSuperAdmin() {
  const [status, setStatus] = useState<'loading' | 'exists' | 'not-exists' | 'creating' | 'created' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [superAdminInfo, setSuperAdminInfo] = useState<any>(null);

  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = async () => {
    try {
      const response = await fetch('/api/init-superadmin', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (data.exists) {
        setStatus('exists');
        setSuperAdminInfo(data.superAdmin);
        setMessage('SuperAdmin account already exists');
      } else {
        setStatus('not-exists');
        setMessage('No SuperAdmin account found');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to check SuperAdmin status');
    }
  };

  const createSuperAdmin = async () => {
    setStatus('creating');
    setMessage('Creating SuperAdmin account...');
    
    try {
      const response = await fetch('/api/init-superadmin', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('created');
        setMessage(`SuperAdmin account created successfully! Email: ${data.email}`);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to create SuperAdmin account');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred while creating SuperAdmin');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Icon name="UserGroupIcon" size={28} className="text-black" />
        </div>
        
        <h1 className="font-playfair text-2xl font-bold text-white mb-4">
          SuperAdmin Initialization
        </h1>
        
        {status === 'loading' && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-neutral-400">Checking SuperAdmin status...</p>
          </div>
        )}
        
        {status === 'exists' && superAdminInfo && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-success/10 border border-success/20">
              <p className="text-success text-sm">{message}</p>
            </div>
            <div className="text-left space-y-2">
              <p className="text-white"><strong>Name:</strong> {superAdminInfo.name}</p>
              <p className="text-white"><strong>Email:</strong> {superAdminInfo.email}</p>
              <p className="text-neutral-400 text-sm">
                Created: {new Date(superAdminInfo.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
        
        {status === 'not-exists' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20">
              <p className="text-warning text-sm">{message}</p>
            </div>
            <button
              onClick={createSuperAdmin}
              className="w-full bg-primary text-black py-3 rounded-2xl font-semibold hover:glow-gold transition-all"
            >
              Create SuperAdmin Account
            </button>
          </div>
        )}
        
        {status === 'creating' && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-neutral-400">{message}</p>
          </div>
        )}
        
        {status === 'created' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-success/10 border border-success/20">
              <p className="text-success text-sm">{message}</p>
            </div>
            <p className="text-neutral-400 text-sm">
              You can now log in with the SuperAdmin credentials to access the system.
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-error/10 border border-error/20">
              <p className="text-error text-sm">{message}</p>
            </div>
            <button
              onClick={checkSuperAdminStatus}
              className="w-full glass-card px-5 py-3 rounded-2xl text-sm font-medium text-white hover:text-primary transition-all"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}