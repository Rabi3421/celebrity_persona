"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import CreateAdminForm from '@/components/admin/CreateAdminForm';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'banned';
  avatar: string;
  avatarAlt: string;
}

export default function RoleManagementSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin' | 'superadmin'>('all');
  const [users, setUsers] = useState<User[]>([
  {
    id: 'user_1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'user',
    status: 'active',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_16ffe2d9e-1763296688681.png',
    avatarAlt: 'Profile photo of Sarah Johnson'
  },
  {
    id: 'user_2',
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@example.com',
    role: 'admin',
    status: 'active',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png',
    avatarAlt: 'Profile photo of Emma Rodriguez'
  },
  {
    id: 'user_3',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'user',
    status: 'active',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1119be902-1763301466467.png',
    avatarAlt: 'Profile photo of Michael Chen'
  },
  {
    id: 'user_4',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'superadmin',
    status: 'active',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1f8b9116a-1763294681191.png",
    avatarAlt: 'Profile photo of Admin User'
  }]
  );

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    setUsers((prevUsers) =>
    prevUsers.map((user) =>
    user.id === userId ? { ...user, role: newRole } : user
    )
    );
  };

  const roleStats = [
  { role: 'Users', count: users.filter((u) => u.role === 'user').length, icon: 'UsersIcon', color: 'text-primary' },
  { role: 'Admins', count: users.filter((u) => u.role === 'admin').length, icon: 'ShieldCheckIcon', color: 'text-accent' },
  { role: 'SuperAdmins', count: users.filter((u) => u.role === 'superadmin').length, icon: 'ShieldExclamationIcon', color: 'text-secondary' }];


  return (
    <div className="space-y-6">
      {/* Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roleStats.map((stat, index) =>
        <div key={index} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/5">
                <Icon name={stat.icon} size={24} className={stat.color} />
              </div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">{stat.role}</p>
            <p className="font-playfair text-3xl font-bold text-white">{stat.count}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Icon
              name="MagnifyingGlassIcon"
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-400 focus:outline-none focus:border-primary" />
            
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {(['all', 'user', 'admin', 'superadmin'] as const).map((role) =>
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              selectedRole === role ?
              'bg-primary text-black' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'}`
              }>
              
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-playfair text-2xl font-bold text-white mb-6">
          User Role Management
        </h3>
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
                  Current Role
                </th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                  Change Role
                </th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) =>
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <AppImage
                      src={user.avatar}
                      alt={user.avatarAlt}
                      width={40}
                      height={40}
                      className="rounded-full" />
                    
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-neutral-400">{user.email}</td>
                  <td className="py-4 px-4">
                    <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'superadmin' ? 'bg-secondary/20 text-secondary' :
                    user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`
                    }>
                    
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <select
                    value={user.role}
                    onChange={(e) =>
                    handleRoleChange(user.id, e.target.value as 'user' | 'admin' | 'superadmin')
                    }
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary">
                    
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">SuperAdmin</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`
                    }>
                    
                      {user.status}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Form */}
      <CreateAdminForm />
    </div>);

}