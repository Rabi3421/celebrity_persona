"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import UserManagementSection from './UserManagementSection';
import ContentModerationSection from './ContentModerationSection';
import AnalyticsSection from './AnalyticsSection';

type SectionType = 'overview' | 'users' | 'moderation' | 'analytics';

const menuItems: { id: SectionType; label: string; icon: string; desc: string }[] = [
  { id: 'overview',    label: 'Overview',            icon: 'Squares2X2Icon',   desc: 'Platform at a glance' },
  { id: 'users',       label: 'User Management',     icon: 'UsersIcon',        desc: 'Manage user accounts & roles' },
  { id: 'moderation',  label: 'Content Moderation',  icon: 'ShieldCheckIcon',  desc: 'Review & moderate content' },
  { id: 'analytics',   label: 'Analytics',           icon: 'ChartBarIcon',     desc: 'Platform performance metrics' },
];

const stats = [
  { label: 'Total Users',    value: '12,842', change: '+8.2%',  icon: 'UsersIcon',       color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30'  },
  { label: 'Active Today',   value: '1,293',  change: '+3.1%',  icon: 'UserCircleIcon',  color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30' },
  { label: 'Pending Review', value: '48',     change: '-12%',   icon: 'ClockIcon',       color: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30' },
  { label: 'Content Pieces', value: '8,471',  change: '+21.4%', icon: 'PhotoIcon',       color: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30' },
];

export default function AdminDashboardInteractive() {
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    router.push('/login');
  };

  const active = menuItems.find((m) => m.id === activeSection)!;

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':   return <OverviewSection />;
      case 'users':      return <UserManagementSection />;
      case 'moderation': return <ContentModerationSection />;
      case 'analytics':  return <AnalyticsSection />;
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

        {/* Admin badge + user card */}
        {!collapsed && (
          <div className="mx-4 mt-5 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <Icon name="ShieldCheckIcon" size={18} className="text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-neutral-400 text-xs truncate">{user?.email}</p>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full capitalize">Admin</span>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mt-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Icon name="ShieldCheckIcon" size={16} className="text-white" />
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

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-64'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 glass-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Admin Panel</span>
            </div>
            <h1 className="font-playfair text-2xl font-bold text-white">{active.label}</h1>
            <p className="text-neutral-400 text-sm">{active.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Icon name="ShieldCheckIcon" size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <div className="animate-fade-in-up">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}

// ── Overview section (inline) ─────────────────────────────────────────────────
function OverviewSection() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20">
        <h2 className="font-playfair text-3xl font-bold text-white mb-1">
          Welcome back, {user?.name?.split(' ')[0]}! 🛡️
        </h2>
        <p className="text-neutral-400">Here&apos;s an overview of your platform&apos;s activity today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`glass-card rounded-2xl p-5 border ${s.border} bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <Icon name={s.icon as any} size={22} className="text-white/70" />
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {s.change}
              </span>
            </div>
            <p className="font-playfair text-3xl font-bold text-white">{s.value}</p>
            <p className="text-neutral-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <h3 className="font-playfair text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Review Pending Content', icon: 'DocumentCheckIcon', color: 'text-yellow-400' },
            { label: 'Export User Report',     icon: 'ArrowDownTrayIcon', color: 'text-blue-400' },
            { label: 'Send Announcement',      icon: 'MegaphoneIcon',     color: 'text-green-400' },
          ].map((a) => (
            <button key={a.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left">
              <Icon name={a.icon as any} size={20} className={a.color} />
              <span className="text-neutral-300 text-sm">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
