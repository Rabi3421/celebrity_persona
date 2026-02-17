"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function SystemControlsSection() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [apiAccessEnabled, setApiAccessEnabled] = useState(true);

  const systemStats = [
    { label: 'System Uptime', value: '99.98%', icon: 'ServerIcon', color: 'text-accent' },
    { label: 'Active Sessions', value: '1,234', icon: 'UsersIcon', color: 'text-primary' },
    { label: 'API Requests/min', value: '8,456', icon: 'BoltIcon', color: 'text-secondary' },
    { label: 'Database Size', value: '45.2 GB', icon: 'CircleStackIcon', color: 'text-accent' },
  ];

  const systemActions = [
    { label: 'Clear Cache', icon: 'TrashIcon', color: 'bg-primary/20 text-primary' },
    { label: 'Backup Database', icon: 'CloudArrowDownIcon', color: 'bg-accent/20 text-accent' },
    { label: 'Run Diagnostics', icon: 'WrenchScrewdriverIcon', color: 'bg-secondary/20 text-secondary' },
    { label: 'View System Logs', icon: 'DocumentTextIcon', color: 'bg-primary/20 text-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats?.map((stat, index) => (
          <div key={index} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-white/5`}>
                <Icon name={stat?.icon} size={24} className={stat?.color} />
              </div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">{stat?.label}</p>
            <p className="font-playfair text-3xl font-bold text-white">{stat?.value}</p>
          </div>
        ))}
      </div>
      {/* System Controls */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          Platform Controls
        </h3>
        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="WrenchIcon" size={20} className="text-primary" />
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-neutral-400 text-sm">Disable platform access for maintenance</p>
              </div>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                maintenanceMode ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* User Registration */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="UserPlusIcon" size={20} className="text-accent" />
              <div>
                <p className="text-white font-medium">User Registration</p>
                <p className="text-neutral-400 text-sm">Allow new users to sign up</p>
              </div>
            </div>
            <button
              onClick={() => setRegistrationEnabled(!registrationEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                registrationEnabled ? 'bg-accent' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  registrationEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* API Access */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="KeyIcon" size={20} className="text-secondary" />
              <div>
                <p className="text-white font-medium">API Access</p>
                <p className="text-neutral-400 text-sm">Enable developer API endpoints</p>
              </div>
            </div>
            <button
              onClick={() => setApiAccessEnabled(!apiAccessEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                apiAccessEnabled ? 'bg-secondary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  apiAccessEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      {/* System Actions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          System Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemActions?.map((action, index) => (
            <button
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className={`p-3 rounded-xl ${action?.color}`}>
                <Icon name={action?.icon} size={20} />
              </div>
              <span className="text-white font-medium">{action?.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}