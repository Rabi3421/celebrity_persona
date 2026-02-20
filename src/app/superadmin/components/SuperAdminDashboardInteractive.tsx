"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import AllDataAccessSection from './AllDataAccessSection';
import CelebrityManagementSection from './CelebrityManagementSection';
import PlatformAnalyticsSection from './PlatformAnalyticsSection';
import RoleManagementSection from './RoleManagementSection';
import SuperAdminSettingsSection from './SuperAdminSettingsSection';
import SystemControlsSection from './SystemControlsSection';

type SectionType = 'overview' | 'roles' | 'celebrities' | 'data' | 'platform' | 'system' | 'settings';

const menuItems: { id: SectionType; label: string; icon: string; desc: string }[] = [
  { id: 'overview',  label: 'Overview',           icon: 'Squares2X2Icon',  desc: 'System at a glance'             },
  { id: 'roles',       label: 'Role Management',    icon: 'KeyIcon',         desc: 'Manage roles & permissions'     },
  { id: 'celebrities', label: 'Celebrity Profiles', icon: 'StarIcon',        desc: 'Manage celebrity profiles'       },
  { id: 'data',        label: 'All Data Access',    icon: 'CircleStackIcon', desc: 'Full database access'           },
  { id: 'platform',  label: 'Platform Analytics', icon: 'PresentationChartLineIcon', desc: 'Deep platform metrics' },
  { id: 'system',    label: 'System Controls',    icon: 'CpuChipIcon',     desc: 'Server & system management'     },
  { id: 'settings',  label: 'SA Settings',        icon: 'AdjustmentsHorizontalIcon', desc: 'Super admin configuration' },
];

const stats = [
  { label: 'Total Users',    value: '12,842', change: '+8.2%',  icon: 'UsersIcon',             color: 'from-blue-500/20 to-blue-600/20',   border: 'border-blue-500/30'   },
  { label: 'Admins',         value: '14',     change: '+2',     icon: 'ShieldCheckIcon',        color: 'from-indigo-500/20 to-indigo-600/20', border: 'border-indigo-500/30' },
  { label: 'DB Collections', value: '28',     change: 'stable', icon: 'CircleStackIcon',        color: 'from-teal-500/20 to-teal-600/20',   border: 'border-teal-500/30'   },
  { label: 'Server Uptime',  value: '99.97%', change: '↑',      icon: 'SignalIcon',             color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30'  },
  { label: 'API Calls/day',  value: '284K',   change: '+14%',   icon: 'BoltIcon',               color: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30' },
  { label: 'Error Rate',     value: '0.03%',  change: '-0.01%', icon: 'ExclamationTriangleIcon', color: 'from-red-500/20 to-red-600/20',    border: 'border-red-500/30'    },
  { label: 'Storage Used',   value: '48.2 GB', change: '+1.1 GB', icon: 'ServerIcon',           color: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30' },
  { label: 'Revenue (MTD)',  value: '$9,214', change: '+18.3%', icon: 'CurrencyDollarIcon',     color: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30' },
];

export default function SuperAdminDashboardInteractive() {
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
      case 'overview':  return <OverviewSection />;
      case 'roles':       return <RoleManagementSection />;
      case 'celebrities': return <CelebrityManagementSection />;
      case 'data':        return <AllDataAccessSection />;
      case 'platform':  return <PlatformAnalyticsSection />;
      case 'system':    return <SystemControlsSection />;
      case 'settings':  return <SuperAdminSettingsSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col glass-card border-r border-white/10 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>

        {/* Brand */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b border-white/10 ${collapsed ? 'justify-center px-0' : ''}`}>
          <Link href="/homepage" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shrink-0">
              <Icon name="StarIcon" size={18} className="text-black" />
            </div>
            {!collapsed && <span className="font-playfair text-lg font-bold text-white">CelebrityPersona</span>}
          </Link>
        </div>

        {/* Super Admin user card */}
        {!collapsed && (
          <div className="mx-4 mt-5 p-4 rounded-2xl bg-white/5 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shrink-0">
                <Icon name="StarIcon" size={18} className="text-black" />
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-neutral-400 text-xs truncate">{user?.email}</p>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Super Admin</span>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mt-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center">
              <Icon name="StarIcon" size={16} className="text-black" />
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
                  ? 'bg-yellow-500 text-black font-semibold'
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
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center hover:scale-110 transition-transform z-50"
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
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Super Admin Panel</span>
            </div>
            <h1 className="font-playfair text-2xl font-bold text-white">{active.label}</h1>
            <p className="text-neutral-400 text-sm">{active.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center">
              <Icon name="StarIcon" size={16} className="text-black" />
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

// ── Overview section ──────────────────────────────────────────────────────────
function OverviewSection() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-600/10 border border-yellow-500/20">
        <h2 className="font-playfair text-3xl font-bold text-white mb-1">
          Welcome, {user?.name?.split(' ')[0]}! ⭐
        </h2>
        <p className="text-neutral-400">You have full platform access. Use these powers responsibly.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`glass-card rounded-2xl p-5 border ${s.border} bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <Icon name={s.icon as any} size={22} className="text-white/70" />
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/10 text-neutral-300">
                {s.change}
              </span>
            </div>
            <p className="font-playfair text-2xl font-bold text-white">{s.value}</p>
            <p className="text-neutral-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <h3 className="font-playfair text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Create Admin Account', icon: 'UserPlusIcon',      color: 'text-blue-400'   },
            { label: 'Database Backup',       icon: 'CircleStackIcon',  color: 'text-teal-400'   },
            { label: 'View Audit Logs',        icon: 'ClipboardDocumentListIcon', color: 'text-yellow-400' },
            { label: 'Platform Settings',     icon: 'CogIcon',           color: 'text-purple-400' },
          ].map((a) => (
            <button key={a.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left">
              <Icon name={a.icon as any} size={20} className={a.color} />
              <span className="text-neutral-300 text-sm">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <h3 className="font-playfair text-xl font-bold text-white mb-4">Recent System Activity</h3>
        <div className="space-y-3">
          {[
            { msg: 'New admin account created by system',      time: '2 min ago',   color: 'bg-blue-500'   },
            { msg: 'Scheduled DB backup completed successfully', time: '1 hr ago',  color: 'bg-green-500'  },
            { msg: 'Rate limit triggered on /api/auth/login',  time: '3 hrs ago',   color: 'bg-yellow-500' },
            { msg: 'User account #8821 suspended by admin',    time: '5 hrs ago',   color: 'bg-red-500'    },
            { msg: 'Content batch upload completed (142 items)', time: 'Yesterday', color: 'bg-purple-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
              <span className="text-neutral-300 text-sm flex-1">{item.msg}</span>
              <span className="text-neutral-500 text-xs">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
