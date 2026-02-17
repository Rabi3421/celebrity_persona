"use client";

import { useState } from 'react';
import DashboardHeader from '@/components/common/DashboardHeader';
import SystemControlsSection from './SystemControlsSection';
import RoleManagementSection from './RoleManagementSection';
import PlatformAnalyticsSection from './PlatformAnalyticsSection';
import SuperAdminSettingsSection from './SuperAdminSettingsSection';
import AllDataAccessSection from './AllDataAccessSection';
import Icon from '@/components/ui/AppIcon';

type SectionType = 'system' | 'roles' | 'analytics' | 'settings' | 'data';

interface MenuItem {
  id: SectionType;
  label: string;
  icon: string;
}

export default function SuperAdminDashboardInteractive() {
  const [activeSection, setActiveSection] = useState<SectionType>('system');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'system', label: 'System Controls', icon: 'CommandLineIcon' },
    { id: 'roles', label: 'Role Management', icon: 'ShieldCheckIcon' },
    { id: 'analytics', label: 'Platform Analytics', icon: 'ChartBarIcon' },
    { id: 'settings', label: 'SuperAdmin Settings', icon: 'Cog6ToothIcon' },
    { id: 'data', label: 'All Data Access', icon: 'CircleStackIcon' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'system':
        return <SystemControlsSection />;
      case 'roles':
        return <RoleManagementSection />;
      case 'analytics':
        return <PlatformAnalyticsSection />;
      case 'settings':
        return <SuperAdminSettingsSection />;
      case 'data':
        return <AllDataAccessSection />;
      default:
        return <SystemControlsSection />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard Header */}
      <DashboardHeader title="SuperAdmin Dashboard" userRole="superadmin" />

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
                  SuperAdmin
                </h2>
                <p className="text-neutral-400 text-xs">System Management</p>
              </>
            ) : (
              <div className="flex justify-center">
                <Icon name="ShieldExclamationIcon" size={24} className="text-primary" />
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
                {activeSection === 'system' && 'Manage system-wide settings, maintenance, and platform controls'}
                {activeSection === 'roles'&& 'Assign and manage user roles, permissions, and access levels'}
                {activeSection === 'analytics'&& 'Monitor platform-wide metrics, performance, and user behavior'}
                {activeSection === 'settings'&& 'Configure superadmin-only settings and security options'}
                {activeSection === 'data'&& 'Access and manage all user, admin, and system data'}
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