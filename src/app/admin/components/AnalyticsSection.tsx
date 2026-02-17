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

export default function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // User Activity Data
  const userActivityData = [
    { date: 'Jan 15', users: 1200, newUsers: 150, activeUsers: 980 },
    { date: 'Jan 22', users: 1350, newUsers: 180, activeUsers: 1100 },
    { date: 'Jan 29', users: 1500, newUsers: 200, activeUsers: 1250 },
    { date: 'Feb 5', users: 1680, newUsers: 220, activeUsers: 1400 },
    { date: 'Feb 12', users: 1850, newUsers: 250, activeUsers: 1550 },
    { date: 'Feb 19', users: 2100, newUsers: 280, activeUsers: 1750 },
    { date: 'Feb 26', users: 2350, newUsers: 300, activeUsers: 1950 },
  ];

  // Engagement Metrics Data
  const engagementData = [
    { category: 'Uploads', count: 1250 },
    { category: 'Reviews', count: 3400 },
    { category: 'Likes', count: 8900 },
    { category: 'Shares', count: 2100 },
    { category: 'Comments', count: 4500 },
  ];

  // Traffic Sources Data
  const trafficData = [
    { source: 'Direct', value: 35, color: '#F59E0B' },
    { source: 'Social Media', value: 28, color: '#E8B4A4' },
    { source: 'Search', value: 22, color: '#10B981' },
    { source: 'Referral', value: 15, color: '#3B82F6' },
  ];

  // Content Performance Data
  const contentPerformanceData = [
    { type: 'Celebrity Profiles', views: 45000, engagement: 12000 },
    { type: 'Fashion Gallery', views: 38000, engagement: 15000 },
    { type: 'Movie Details', views: 32000, engagement: 9500 },
    { type: 'Celebrity News', views: 28000, engagement: 8200 },
    { type: 'Reviews', views: 22000, engagement: 11000 },
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Icon name="UsersIcon" size={24} className="text-primary" />
            </div>
            <div className="flex items-center gap-1 text-accent text-sm">
              <Icon name="ArrowTrendingUpIcon" size={16} />
              <span>+12%</span>
            </div>
          </div>
          <p className="text-neutral-400 text-sm mb-1">Total Users</p>
          <p className="font-playfair text-3xl font-bold text-white">2,350</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-accent/20">
              <Icon name="EyeIcon" size={24} className="text-accent" />
            </div>
            <div className="flex items-center gap-1 text-accent text-sm">
              <Icon name="ArrowTrendingUpIcon" size={16} />
              <span>+18%</span>
            </div>
          </div>
          <p className="text-neutral-400 text-sm mb-1">Page Views</p>
          <p className="font-playfair text-3xl font-bold text-white">165K</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-secondary/20">
              <Icon name="HeartIcon" size={24} className="text-secondary" />
            </div>
            <div className="flex items-center gap-1 text-accent text-sm">
              <Icon name="ArrowTrendingUpIcon" size={16} />
              <span>+25%</span>
            </div>
          </div>
          <p className="text-neutral-400 text-sm mb-1">Engagement Rate</p>
          <p className="font-playfair text-3xl font-bold text-white">68%</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-warning/20">
              <Icon name="PhotoIcon" size={24} className="text-warning" />
            </div>
            <div className="flex items-center gap-1 text-accent text-sm">
              <Icon name="ArrowTrendingUpIcon" size={16} />
              <span>+15%</span>
            </div>
          </div>
          <p className="text-neutral-400 text-sm mb-1">Total Uploads</p>
          <p className="font-playfair text-3xl font-bold text-white">1,250</p>
        </div>
      </div>

      {/* User Activity Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">User Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userActivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#A3A3A3" />
            <YAxis stroke="#A3A3A3" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 10, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#F59E0B"
              strokeWidth={2}
              name="Total Users"
            />
            <Line
              type="monotone"
              dataKey="newUsers"
              stroke="#10B981"
              strokeWidth={2}
              name="New Users"
            />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="#E8B4A4"
              strokeWidth={2}
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement Metrics & Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-playfair text-2xl font-bold text-white mb-6">
            Engagement Metrics
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="category" stroke="#A3A3A3" />
              <YAxis stroke="#A3A3A3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-playfair text-2xl font-bold text-white mb-6">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, value }) => `${source}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {trafficData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Performance */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          Content Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contentPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="type" stroke="#A3A3A3" />
            <YAxis stroke="#A3A3A3" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 10, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="views" fill="#10B981" radius={[8, 8, 0, 0]} name="Views" />
            <Bar dataKey="engagement" fill="#E8B4A4" radius={[8, 8, 0, 0]} name="Engagement" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Content Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="font-playfair text-2xl font-bold text-white">Top Performing Content</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Content Type
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Views
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Engagement
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Engagement Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {contentPerformanceData.map((item, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{item.type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-neutral-300">{item.views.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-neutral-300">{item.engagement.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(item.engagement / item.views) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-neutral-300 text-sm">
                        {Math.round((item.engagement / item.views) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}