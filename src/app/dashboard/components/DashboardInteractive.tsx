"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import ProfileSection from './ProfileSection';
import WishlistSection from './WishlistSection';
import MyUploadsSection from './MyUploadsSection';
import ActivityHistorySection from './ActivityHistorySection';
import AccountSettingsSection from './AccountSettingsSection';
import FavouritesSection from './FavouritesSection';
import ApiSection from './ApiSection';

type SectionType = 'profile' | 'wishlist' | 'uploads' | 'favourites' | 'activity' | 'settings' | 'api';

const menuItems: { id: SectionType; label: string; icon: string; desc: string }[] = [
  { id: 'profile',   label: 'Profile',     icon: 'UserIcon',        desc: 'Manage your personal information' },
  { id: 'wishlist',  label: 'Wishlist',    icon: 'HeartIcon',       desc: 'Saved celebrities & outfits' },
  { id: 'uploads',    label: 'My Uploads',  icon: 'PhotoIcon',       desc: 'Your submitted fashion items' },
  { id: 'favourites', label: 'Saved Outfits', icon: 'BookmarkIcon',  desc: 'Outfits you have saved' },
  { id: 'activity',   label: 'Activity',    icon: 'ClockIcon',       desc: 'Recent actions & history' },
  { id: 'settings',  label: 'Settings',    icon: 'Cog6ToothIcon',   desc: 'Account preferences' },
  { id: 'api',        label: 'API Access',   icon: 'KeyIcon',         desc: 'Manage your API key & endpoints' },
];

export default function DashboardInteractive() {
  const [activeSection, setActiveSection] = useState<SectionType>('profile');
  const [collapsed, setCollapsed] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle ?section=uploads from navbar redirect
  useEffect(() => {
    const section = searchParams.get('section') as SectionType | null;
    if (section && menuItems.find((m) => m.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    router.push('/login');
  };

  const active = menuItems.find((m) => m.id === activeSection)!;

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':   return <ProfileSection />;
      case 'wishlist':  return <WishlistSection />;
      case 'uploads':    return <MyUploadsSection />;
      case 'favourites':  return <FavouritesSection />;
      case 'activity':    return <ActivityHistorySection />;
      case 'settings':  return <AccountSettingsSection />;
      case 'api':        return <ApiSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col glass-card border-r border-white/10 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>

        {/* Brand */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b border-white/10 ${collapsed ? 'justify-center px-0' : ''}`}>
          <Link href="/homepage" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Icon name="SparklesIcon" size={18} className="text-black" />
            </div>
            {!collapsed && <span className="font-playfair text-lg font-bold text-white">CelebrityPersona</span>}
          </Link>
        </div>

        {/* User card */}
        {!collapsed && (
          <div className="mx-4 mt-5 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-neutral-400 text-xs truncate">{user?.email}</p>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mt-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-black font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                activeSection === item.id
                  ? 'bg-primary text-black font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon name={item.icon as any} size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link href="/homepage"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Home' : undefined}
          >
            <Icon name="HomeIcon" size={20} className="shrink-0" />
            {!collapsed && <span>Home</span>}
          </Link>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon name="ArrowRightOnRectangleIcon" size={20} className="shrink-0" />
            {!collapsed && <span>{logoutLoading ? 'Signing out...' : 'Sign Out'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <Icon name={collapsed ? 'ChevronRightIcon' : 'ChevronLeftIcon'} size={14} className="text-black" />
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-64'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 glass-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white">{active.label}</h1>
            <p className="text-neutral-400 text-sm">{active.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-black font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {/* Welcome banner */}
          {activeSection === 'profile' && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <h2 className="font-playfair text-3xl font-bold text-white mb-1">
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-neutral-400">Manage your celebrity fashion profile and explore exclusive content.</p>
            </div>
          )}
          <div className="animate-fade-in-up">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}
