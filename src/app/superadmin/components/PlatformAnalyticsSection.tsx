"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function PlatformAnalyticsSection() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const platformMetrics = [
    { label: 'Total Users', value: '12,450', change: '+18%', icon: 'UsersIcon', color: 'text-primary' },
    { label: 'Total Revenue', value: '$45,230', change: '+24%', icon: 'CurrencyDollarIcon', color: 'text-accent' },
    { label: 'API Calls', value: '2.4M', change: '+32%', icon: 'BoltIcon', color: 'text-secondary' },
    { label: 'Storage Used', value: '145 GB', change: '+12%', icon: 'CircleStackIcon', color: 'text-primary' },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 8500, admins: 45, revenue: 28000 },
    { month: 'Feb', users: 9200, admins: 52, revenue: 32000 },
    { month: 'Mar', users: 9800, admins: 58, revenue: 35000 },
    { month: 'Apr', users: 10500, admins: 63, revenue: 38000 },
    { month: 'May', users: 11200, admins: 68, revenue: 41000 },
    { month: 'Jun', users: 12450, admins: 75, revenue: 45230 },
  ];

  const featureUsageData = [
    { feature: 'Celebrity Profiles', usage: 45000 },
    { feature: 'Fashion Gallery', usage: 38000 },
    { feature: 'Movie Details', usage: 32000 },
    { feature: 'News', usage: 28000 },
    { feature: 'Reviews', usage: 22000 },
  ];

  const userDistributionData = [
    { name: 'Free Users', value: 8500, color: '#F59E0B' },
    { name: 'Premium Users', value: 3200, color: '#10B981' },
    { name: 'Admins', value: 75, color: '#E8B4A4' },
    { name: 'SuperAdmins', value: 5, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="glass-card rounded-2xl p-2 inline-flex">
        <div className="flex gap-2">
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as typeof timeRange)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-primary text-black' :'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformMetrics.map((metric, index) => (
          <div key={index} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/5">
                <Icon name={metric.icon} size={24} className={metric.color} />
              </div>
              <div className="flex items-center gap-1 text-accent text-sm">
                <Icon name="ArrowTrendingUpIcon" size={16} />
                <span>{metric.change}</span>
              </div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">{metric.label}</p>
            <p className="font-playfair text-3xl font-bold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          Platform Growth Trends
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="#A3A3A3" />
            <YAxis stroke="#A3A3A3" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 10, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#F59E0B" strokeWidth={2} name="Total Users" />
            <Line type="monotone" dataKey="admins" stroke="#10B981" strokeWidth={2} name="Admins" />
            <Line type="monotone" dataKey="revenue" stroke="#E8B4A4" strokeWidth={2} name="Revenue ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-playfair text-2xl font-bold text-white mb-6">
            Feature Usage
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="feature" stroke="#A3A3A3" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#A3A3A3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="usage" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-playfair text-2xl font-bold text-white mb-6">
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}