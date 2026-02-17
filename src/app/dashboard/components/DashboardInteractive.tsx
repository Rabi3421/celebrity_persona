"use client";

import { useState } from 'react';
import DashboardHeader from '@/components/common/DashboardHeader';
import ProfileSection from './ProfileSection';
import WishlistSection from './WishlistSection';
import UploadedItemsSection from './UploadedItemsSection';
import ActivityHistorySection from './ActivityHistorySection';
import AccountSettingsSection from './AccountSettingsSection';
import Icon from '@/components/ui/AppIcon';

type SectionType = 'profile' | 'wishlist' | 'uploads' | 'activity' | 'settings';

interface MenuItem {
  id: SectionType;
  label: string;
  icon: string;
}

export default function DashboardInteractive() {
  const [activeSection, setActiveSection] = useState<SectionType>('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'profile', label: 'Profile', icon: 'UserIcon' },
    { id: 'wishlist', label: 'Wishlist', icon: 'HeartIcon' },
    { id: 'uploads', label: 'My Uploads', icon: 'PhotoIcon' },
    { id: 'activity', label: 'Activity', icon: 'ClockIcon' },
    { id: 'settings', label: 'Settings', icon: 'Cog6ToothIcon' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'wishlist':
        return <WishlistSection />;
      case 'uploads':
        return <UploadedItemsSection />;
      case 'activity':
        return <ActivityHistorySection />;
      case 'settings':
        return <AccountSettingsSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard Header */}
      <DashboardHeader title="User Dashboard" userRole="user" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 bottom-0 glass-card transition-all duration-300 z-30 pt-[73px] ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Icon
              name={isSidebarCollapsed ? 'ChevronRightIcon' : 'ChevronLeftIcon'}
              size={16}
              className="text-black"
            />
          </button>

          {/* Dashboard Title */}
          <div className="p-6 border-b border-white/10">
            {!isSidebarCollapsed ? (
              <>
                <h2 className="font-playfair text-xl font-bold text-white mb-1">
                  My Dashboard
                </h2>
                <p className="text-neutral-400 text-xs">Personal Space</p>
              </>
            ) : (
              <div className="flex justify-center">
                <Icon name="UserCircleIcon" size={24} className="text-primary" />
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? 'bg-primary text-black font-medium' :'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={20} />
                {!isSidebarCollapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="mb-12">
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
                {menuItems.find((item) => item.id === activeSection)?.label}
              </h1>
              <p className="text-neutral-400 text-lg">
                {activeSection === 'profile' && 'Manage your personal information and preferences'}
                {activeSection === 'wishlist'&& 'View your saved celebrities and favorite outfits'}
                {activeSection === 'uploads'&& 'Manage your uploaded fashion items and submissions'}
                {activeSection === 'activity'&& 'Track your recent actions and engagement history'}
                {activeSection === 'settings'&& 'Configure your account settings and preferences'}
              </p>
            </div>

            {/* Content */}
            <div className="animate-fade-in-up">{renderContent()}</div>
          </div>
        </main>
      </div>
    </div>
  );
}