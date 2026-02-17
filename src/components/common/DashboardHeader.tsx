"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface DashboardHeaderProps {
  title: string;
  userRole?: 'user' | 'admin' | 'superadmin';
}

export default function DashboardHeader({ title, userRole }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use real user data from context, fall back to mock if needed
  const currentUser = user || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: userRole || 'user',
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New comment on your outfit', time: '5 min ago', unread: true },
    { id: 2, message: 'Your submission was approved', time: '1 hour ago', unread: true },
    { id: 3, message: 'New follower: Jane Smith', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/homepage');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="glass-card border-b border-white/10 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Dashboard Title */}
        <div>
          <h1 className="text-2xl font-playfair font-bold text-white">{title}</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Welcome back, {currentUser.name}
          </p>
        </div>

        {/* Right: Notifications, Profile, Logout */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="glass-card p-2.5 rounded-lg hover:glow-gold transition-all relative"
            >
              <Icon name="BellIcon" size={20} className="text-neutral-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <button className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg transition-colors ${
                        notif.unread ? 'bg-white/5' : 'bg-transparent'
                      }`}
                    >
                      <p className="text-sm text-white">{notif.message}</p>
                      <p className="text-xs text-neutral-400 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 glass-card px-3 py-2 rounded-lg hover:glow-gold transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-black font-semibold text-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-white">{currentUser.name}</p>
                <p className="text-xs text-neutral-400 capitalize">{currentUser.role}</p>
              </div>
              <Icon name="ChevronDownIcon" size={16} className="text-neutral-400" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl p-2 shadow-xl">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{currentUser.name}</p>
                  <p className="text-xs text-neutral-400">{currentUser.email}</p>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                    <Icon name="UserIcon" size={16} />
                    View Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                    <Icon name="Cog6ToothIcon" size={16} />
                    Settings
                  </button>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon name="ArrowRightOnRectangleIcon" size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}