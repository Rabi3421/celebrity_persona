"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

export default function AccountSettingsSection() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const { logout } = useAuth();
  const router = useRouter();

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Static UI - no backend
    alert('Password change functionality (Static UI)');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/homepage');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-playfair text-3xl font-bold text-white mb-2">
          Account Settings
        </h2>
        <p className="text-neutral-400">Manage your preferences and security</p>
      </div>

      {/* Notifications Settings */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="font-playfair text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="BellIcon" size={24} className="text-primary" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-medium mb-1">Email Notifications</h4>
              <p className="text-sm text-neutral-400">
                Receive updates about new outfits and celebrities
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                emailNotifications ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-medium mb-1">Push Notifications</h4>
              <p className="text-sm text-neutral-400">
                Get instant alerts for trending content
              </p>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                pushNotifications ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  pushNotifications ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="font-playfair text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="LockClosedIcon" size={24} className="text-secondary" />
          Privacy
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-medium mb-1">Private Profile</h4>
              <p className="text-sm text-neutral-400">
                Only you can see your uploads and activity
              </p>
            </div>
            <button
              onClick={() => setPrivateProfile(!privateProfile)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                privateProfile ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  privateProfile ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-medium mb-1">Show Activity</h4>
              <p className="text-sm text-neutral-400">
                Let others see your likes and saves
              </p>
            </div>
            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                showActivity ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  showActivity ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="font-playfair text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="KeyIcon" size={24} className="text-accent" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-black px-6 py-3 rounded-full font-medium hover:glow-gold transition-all"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-3xl p-8 border border-error/30">
        <h3 className="font-playfair text-xl font-bold text-error mb-6 flex items-center gap-2">
          <Icon name="ExclamationTriangleIcon" size={24} />
          Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-medium mb-1">Sign Out</h4>
              <p className="text-sm text-neutral-400">
                Sign out of your account on this device
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="glass-card px-4 py-2 rounded-full text-sm text-orange-400 hover:bg-orange-500/10 transition-colors border border-orange-400/30"
            >
              Sign Out
            </button>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="text-white font-medium mb-1">Delete Account</h4>
              <p className="text-sm text-neutral-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="glass-card px-4 py-2 rounded-full text-sm text-error hover:bg-error/10 transition-colors border border-error/30">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}