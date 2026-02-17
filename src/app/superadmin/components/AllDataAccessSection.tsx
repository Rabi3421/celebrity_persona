"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'banned';
  joinDate: string;
  lastActive: string;
  uploads: number;
  reviews: number;
  avatar: string;
  avatarAlt: string;
}

export default function AllDataAccessSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dataType, setDataType] = useState<'users' | 'content' | 'analytics'>('users');

  const allUsers: User[] = [
    {
      id: 'user_1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      uploads: 43,
      reviews: 56,
      avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_16ffe2d9e-1763296688681.png',
      avatarAlt: 'Profile photo of Sarah Johnson',
    },
    {
      id: 'user_2',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-02-20',
      lastActive: '1 day ago',
      uploads: 28,
      reviews: 34,
      avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1119be902-1763301466467.png',
      avatarAlt: 'Profile photo of Michael Chen',
    },
    {
      id: 'user_3',
      name: 'Emma Rodriguez',
      email: 'emma.rodriguez@example.com',
      role: 'admin',
      status: 'active',
      joinDate: '2023-11-10',
      lastActive: '30 minutes ago',
      uploads: 67,
      reviews: 89,
      avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png',
      avatarAlt: 'Profile photo of Emma Rodriguez',
    },
    {
      id: 'user_4',
      name: 'James Wilson',
      email: 'james.wilson@example.com',
      role: 'user',
      status: 'banned',
      joinDate: '2024-03-05',
      lastActive: '1 week ago',
      uploads: 12,
      reviews: 8,
      avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_14889e74f-1763294788752.png',
      avatarAlt: 'Profile photo of James Wilson',
    },
    {
      id: 'user_5',
      name: 'Olivia Martinez',
      email: 'olivia.martinez@example.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-28',
      lastActive: '5 hours ago',
      uploads: 51,
      reviews: 72,
      avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png',
      avatarAlt: 'Profile photo of Olivia Martinez',
    },
  ];

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dataStats = [
    { label: 'Total Records', value: '12,450', icon: 'CircleStackIcon' },
    { label: 'Active Users', value: '9,234', icon: 'UsersIcon' },
    { label: 'Total Content', value: '45,678', icon: 'PhotoIcon' },
    { label: 'API Requests', value: '2.4M', icon: 'BoltIcon' },
  ];

  return (
    <div className="space-y-6">
      {/* Data Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dataStats.map((stat, index) => (
          <div key={index} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/5">
                <Icon name={stat.icon} size={24} className="text-primary" />
              </div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">{stat.label}</p>
            <p className="font-playfair text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Data Type Selector */}
      <div className="glass-card rounded-2xl p-2 inline-flex">
        <div className="flex gap-2">
          {[
            { value: 'users', label: 'User Data', icon: 'UsersIcon' },
            { value: 'content', label: 'Content Data', icon: 'PhotoIcon' },
            { value: 'analytics', label: 'Analytics Data', icon: 'ChartBarIcon' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setDataType(type.value as typeof dataType)}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                dataType === type.value
                  ? 'bg-primary text-black' :'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name={type.icon} size={16} />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-6">
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search all data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-400 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Data Table */}
      {dataType === 'users' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-playfair text-2xl font-bold text-white">
              All User Data
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black font-medium hover:scale-105 transition-transform">
              <Icon name="ArrowDownTrayIcon" size={16} />
              <span className="text-sm">Export Data</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    User
                  </th>
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    Role
                  </th>
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    Join Date
                  </th>
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    Last Active
                  </th>
                  <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                    Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <AppImage
                          src={user.avatar}
                          alt={user.avatarAlt}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-neutral-400">{user.email}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'superadmin' ?'bg-secondary/20 text-secondary'
                            : user.role === 'admin' ?'bg-accent/20 text-accent' :'bg-primary/20 text-primary'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ?'bg-accent/20 text-accent' :'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-neutral-400">{user.joinDate}</td>
                    <td className="py-4 px-4 text-neutral-400">{user.lastActive}</td>
                    <td className="py-4 px-4 text-neutral-400">
                      {user.uploads} uploads, {user.reviews} reviews
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dataType === 'content' && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-playfair text-2xl font-bold text-white mb-4">
            Content Data
          </h3>
          <p className="text-neutral-400">Content data management interface coming soon...</p>
        </div>
      )}

      {dataType === 'analytics' && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-playfair text-2xl font-bold text-white mb-4">
            Analytics Data
          </h3>
          <p className="text-neutral-400">Analytics data export interface coming soon...</p>
        </div>
      )}
    </div>
  );
}