"use client";

import { useState } from 'react';
import DashboardHeader from '@/components/common/DashboardHeader';
import UserManagementSection from './UserManagementSection';
import ContentModerationSection from './ContentModerationSection';
import AnalyticsSection from './AnalyticsSection';
import Icon from '@/components/ui/AppIcon';

type SectionType = 'users' | 'moderation' | 'analytics';

interface MenuItem {
  id: SectionType;
  label: string;
  icon: string;
}

export default function AdminDashboardInteractive() {
  const [activeSection, setActiveSection] = useState<SectionType>('users');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'users', label: 'User Management', icon: 'UsersIcon' },
    { id: 'moderation', label: 'Content Moderation', icon: 'ShieldCheckIcon' },
    { id: 'analytics', label: 'Analytics', icon: 'ChartBarIcon' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagementSection />;
      case 'moderation':
        return <ContentModerationSection />;
      case 'analytics':
        return <AnalyticsSection />;
      default:
        return <UserManagementSection />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard Header */}
      <DashboardHeader title="Admin Dashboard" userRole="admin" />

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
                  Admin Dashboard
                </h2>
                <p className="text-neutral-400 text-xs">Platform Management</p>
              </>
            ) : (
              <div className="flex justify-center">
                <Icon name="ShieldCheckIcon" size={24} className="text-primary" />
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
                {activeSection === 'users' && 'Manage user accounts, roles, and permissions'}
                {activeSection === 'moderation'&& 'Review and moderate user-submitted content'}
                {activeSection === 'analytics'&& 'Monitor platform performance and user engagement'}
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