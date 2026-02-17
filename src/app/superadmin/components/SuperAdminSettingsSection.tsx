"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function SuperAdminSettingsSection() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          Security Settings
        </h3>
        <div className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="ShieldCheckIcon" size={20} className="text-primary" />
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-neutral-400 text-sm">Require 2FA for superadmin accounts</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Security Alerts */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="BellAlertIcon" size={20} className="text-accent" />
              <div>
                <p className="text-white font-medium">Security Alerts</p>
                <p className="text-neutral-400 text-sm">Get notified of suspicious activities</p>
              </div>
            </div>
            <button
              onClick={() => setSecurityAlerts(!securityAlerts)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                securityAlerts ? 'bg-accent' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  securityAlerts ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Audit Logging */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="DocumentTextIcon" size={20} className="text-secondary" />
              <div>
                <p className="text-white font-medium">Audit Logging</p>
                <p className="text-neutral-400 text-sm">Log all superadmin actions</p>
              </div>
            </div>
            <button
              onClick={() => setAuditLogging(!auditLogging)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                auditLogging ? 'bg-secondary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  auditLogging ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          Notification Settings
        </h3>
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Icon name="EnvelopeIcon" size={20} className="text-primary" />
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-neutral-400 text-sm">Receive system updates via email</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                emailNotifications ? 'bg-primary' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          System Configuration
        </h3>
        <div className="space-y-4">
          {/* Session Timeout */}
          <div className="p-4 rounded-xl bg-white/5">
            <label className="block text-white font-medium mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Max Login Attempts */}
          <div className="p-4 rounded-xl bg-white/5">
            <label className="block text-white font-medium mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              defaultValue={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Password Expiry */}
          <div className="p-4 rounded-xl bg-white/5">
            <label className="block text-white font-medium mb-2">
              Password Expiry (days)
            </label>
            <input
              type="number"
              defaultValue={90}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button className="w-full glass-card px-6 py-4 rounded-2xl text-white font-medium hover:bg-primary hover:text-black transition-all">
        <div className="flex items-center justify-center gap-2">
          <Icon name="CheckCircleIcon" size={20} />
          <span>Save Settings</span>
        </div>
      </button>
    </div>
  );
}