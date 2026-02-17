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
  avatar: string;
  avatarAlt: string;
  uploads: number;
  reviews: number;
}

export default function UserManagementSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([
  {
    id: 'user_1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-01-15',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_16ffe2d9e-1763296688681.png",
    avatarAlt: 'Profile photo of Sarah Johnson',
    uploads: 43,
    reviews: 56
  },
  {
    id: 'user_2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-02-20',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1119be902-1763301466467.png",
    avatarAlt: 'Profile photo of Michael Chen',
    uploads: 28,
    reviews: 34
  },
  {
    id: 'user_3',
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@example.com',
    role: 'admin',
    status: 'active',
    joinDate: '2023-11-10',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png",
    avatarAlt: 'Profile photo of Emma Rodriguez',
    uploads: 67,
    reviews: 89
  },
  {
    id: 'user_4',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    role: 'user',
    status: 'banned',
    joinDate: '2024-03-05',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_14889e74f-1763294788752.png",
    avatarAlt: 'Profile photo of James Wilson',
    uploads: 12,
    reviews: 8
  },
  {
    id: 'user_5',
    name: 'Olivia Martinez',
    email: 'olivia.martinez@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-01-28',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png",
    avatarAlt: 'Profile photo of Olivia Martinez',
    uploads: 51,
    reviews: 72
  }]
  );

  const filteredUsers = users.filter(
    (user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleBanToggle = (userId: string) => {
    setUsers((prevUsers) =>
    prevUsers.map((user) =>
    user.id === userId ?
    { ...user, status: user.status === 'active' ? 'banned' : 'active' } :
    user
    )
    );
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      setUsers((prevUsers) =>
      prevUsers.map((user) => user.id === selectedUser.id ? selectedUser : user)
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-accent/20 text-accent';
      case 'admin':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-neutral-700 text-neutral-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-4">
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-neutral-500 focus:outline-none" />
          
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="UsersIcon" size={24} className="text-primary" />
            <span className="text-neutral-400 text-sm">Total Users</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">{users.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="CheckCircleIcon" size={24} className="text-accent" />
            <span className="text-neutral-400 text-sm">Active Users</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">
            {users.filter((u) => u.status === 'active').length}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="ShieldCheckIcon" size={24} className="text-primary" />
            <span className="text-neutral-400 text-sm">Admins</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">
            {users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="NoSymbolIcon" size={24} className="text-destructive" />
            <span className="text-neutral-400 text-sm">Banned Users</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">
            {users.filter((u) => u.status === 'banned').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  User
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Activity
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Join Date
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) =>
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AppImage
                      src={user.avatar}
                      alt={user.avatarAlt}
                      width={40}
                      height={40}
                      className="rounded-full w-10 h-10 object-cover" />
                    
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-neutral-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      user.role
                    )}`}>
                    
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      user.status
                    )}`}>
                    
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-300">
                      <p>{user.uploads} uploads</p>
                      <p className="text-neutral-500">{user.reviews} reviews</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-neutral-300 text-sm">
                      {new Date(user.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Edit user">
                      
                        <Icon name="PencilIcon" size={18} className="text-primary" />
                      </button>
                      <button
                      onClick={() => handleBanToggle(user.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title={user.status === 'active' ? 'Ban user' : 'Unban user'}>
                      
                        <Icon
                        name={user.status === 'active' ? 'NoSymbolIcon' : 'CheckCircleIcon'}
                        size={18}
                        className={user.status === 'active' ? 'text-destructive' : 'text-accent'} />
                      
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-2xl font-bold text-white">Edit User</h2>
              <button
              onClick={() => setIsEditModalOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              
                <Icon name="XMarkIcon" size={24} className="text-neutral-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <AppImage
                src={selectedUser.avatar}
                alt={selectedUser.avatarAlt}
                width={80}
                height={80}
                className="rounded-full w-20 h-20 object-cover" />
              
                <div>
                  <p className="text-white font-medium mb-1">{selectedUser.name}</p>
                  <p className="text-neutral-400 text-sm">{selectedUser.email}</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Full Name
                </label>
                <input
                type="text"
                value={selectedUser.name}
                onChange={(e) =>
                setSelectedUser({ ...selectedUser, name: e.target.value })
                }
                className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address
                </label>
                <input
                type="email"
                value={selectedUser.email}
                onChange={(e) =>
                setSelectedUser({ ...selectedUser, email: e.target.value })
                }
                className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  User Role
                </label>
                <select
                value={selectedUser.role}
                onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  role: e.target.value as 'user' | 'admin' | 'superadmin'
                })
                }
                className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Account Status
                </label>
                <select
                value={selectedUser.status}
                onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  status: e.target.value as 'active' | 'banned'
                })
                }
                className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                onClick={handleSaveUser}
                className="flex-1 bg-primary text-black font-medium px-6 py-3 rounded-xl hover:glow-gold transition-all">
                
                  Save Changes
                </button>
                <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 glass-card text-white font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
                
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}