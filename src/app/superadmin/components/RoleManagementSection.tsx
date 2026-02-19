"use client";

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
}

type Toast = { type: 'success' | 'error'; message: string } | null;

export default function RoleManagementSection() {
  const { authHeaders } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin' | 'superadmin'>('all');

  // Per-row busy map: userId → true while a request is in-flight
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  const [toast, setToast] = useState<Toast>(null);

  // Confirmation modal for delete
  const [confirmDelete, setConfirmDelete] = useState<UserRecord | null>(null);

  // Create user/admin modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState<'user' | 'admin'>('user');
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [createErrors, setCreateErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createApiError, setCreateApiError] = useState('');

  // Edit user modal
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [editTab, setEditTab] = useState<'profile' | 'password'>('profile');
  const [editProfile, setEditProfile] = useState({ name: '', email: '' });
  const [editProfileErrors, setEditProfileErrors] = useState<{ name?: string; email?: string }>({});
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileApiError, setEditProfileApiError] = useState('');
  const [editPassword, setEditPassword] = useState({ newPassword: '', confirmPassword: '' });
  const [editPasswordErrors, setEditPasswordErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [editPasswordLoading, setEditPasswordLoading] = useState(false);
  const [editPasswordApiError, setEditPasswordApiError] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const setBusy = (id: string, busy: boolean) =>
    setBusyMap((prev) => ({ ...prev, [id]: busy }));

  // ── Load all users ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/superadmin/all-users', {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load users');
      setUsers(data.data as UserRecord[]);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Role Change ───────────────────────────────────────────────────────────
  const handleRoleChange = async (user: UserRecord, newRole: 'user' | 'admin' | 'superadmin') => {
    if (user.role === newRole) return;
    setBusy(user.id, true);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Role update failed');
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      showToast('success', `${user.name}'s role updated to ${newRole}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update role');
    } finally {
      setBusy(user.id, false);
    }
  };

  // ── Status Toggle ─────────────────────────────────────────────────────────
  const handleStatusToggle = async (user: UserRecord) => {
    setBusy(user.id, true);
    const newActive = !user.isActive;
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Status update failed');
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newActive } : u))
      );
      showToast('success', `${user.name} is now ${newActive ? 'active' : 'banned'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    } finally {
      setBusy(user.id, false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (user: UserRecord) => {
    setConfirmDelete(null);
    setBusy(user.id, true);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast('success', `${user.name} has been deleted`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete user');
    } finally {
      setBusy(user.id, false);
    }
  };

  // ── Create User / Admin ───────────────────────────────────────────────────
  const openCreateModal = (role: 'user' | 'admin') => {
    setCreateRole(role);
    setCreateForm({ name: '', email: '', password: '' });
    setCreateErrors({});
    setCreateApiError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof createErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createForm.name || createForm.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!createForm.email || !emailRegex.test(createForm.email)) errs.email = 'Please enter a valid email address';
    if (!createForm.password || createForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreateLoading(true);
    setCreateApiError('');
    try {
      const endpoint = createRole === 'admin' ? '/api/superadmin/admins/create' : '/api/auth/user/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createForm.name.trim(), email: createForm.email.trim(), password: createForm.password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `Failed to create ${createRole}`);
      setShowCreateModal(false);
      showToast('success', `${createRole === 'admin' ? 'Admin' : 'User'} "${createForm.name.trim()}" created successfully`);
      fetchUsers();
    } catch (err: any) {
      setCreateApiError(err.message || `Failed to create ${createRole}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit User ─────────────────────────────────────────────────────────────
  const openEditModal = (user: UserRecord, tab: 'profile' | 'password' = 'profile') => {
    setEditTarget(user);
    setEditTab(tab);
    setEditProfile({ name: user.name, email: user.email });
    setEditProfileErrors({});
    setEditProfileApiError('');
    setEditPassword({ newPassword: '', confirmPassword: '' });
    setEditPasswordErrors({});
    setEditPasswordApiError('');
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const errs: typeof editProfileErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editProfile.name || editProfile.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!editProfile.email || !emailRegex.test(editProfile.email)) errs.email = 'Please enter a valid email address';
    setEditProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setEditProfileLoading(true);
    setEditProfileApiError('');
    try {
      const res = await fetch(`/api/superadmin/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editProfile.name.trim(), email: editProfile.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Profile update failed');
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id ? { ...u, name: editProfile.name.trim(), email: editProfile.email.trim() } : u
        )
      );
      setEditTarget(null);
      showToast('success', `${editProfile.name.trim()}'s profile updated`);
    } catch (err: any) {
      setEditProfileApiError(err.message || 'Failed to update profile');
    } finally {
      setEditProfileLoading(false);
    }
  };

  const handleEditPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const errs: typeof editPasswordErrors = {};
    if (!editPassword.newPassword || editPassword.newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters';
    if (!editPassword.confirmPassword) errs.confirmPassword = 'Please confirm the new password';
    else if (editPassword.newPassword !== editPassword.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setEditPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setEditPasswordLoading(true);
    setEditPasswordApiError('');
    try {
      const res = await fetch(`/api/superadmin/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: editPassword.newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Password update failed');
      setEditTarget(null);
      showToast('success', `Password updated for ${editTarget.name}`);
    } catch (err: any) {
      setEditPasswordApiError(err.message || 'Failed to update password');
    } finally {
      setEditPasswordLoading(false);
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // ── Stats (derived from live state) ───────────────────────────────────────
  const roleStats = [
    { role: 'Users', count: users.filter((u) => u.role === 'user').length, icon: 'UsersIcon', color: 'text-primary' },
    { role: 'Admins', count: users.filter((u) => u.role === 'admin').length, icon: 'ShieldCheckIcon', color: 'text-accent' },
    { role: 'SuperAdmins', count: users.filter((u) => u.role === 'superadmin').length, icon: 'ShieldExclamationIcon', color: 'text-secondary' },
  ];

  // ── Role badge styling ────────────────────────────────────────────────────
  const roleBadgeClass = (role: string) =>
    role === 'superadmin'
      ? 'bg-secondary/20 text-secondary'
      : role === 'admin'
      ? 'bg-accent/20 text-accent'
      : 'bg-primary/20 text-primary';

  // ── Skeleton rows ─────────────────────────────────────────────────────────
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-success/15 border-success/30 text-success'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          <Icon
            name={toast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'}
            size={20}
          />
          <span className="text-sm font-medium font-montserrat">{toast.message}</span>
        </div>
      )}

      {/* ── Role Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roleStats.map((stat, index) => (
          <div key={index} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/5">
                <Icon name={stat.icon} size={24} className={stat.color} />
              </div>
            </div>
            <p className="text-neutral-400 text-sm mb-1 font-montserrat">{stat.role}</p>
            {loading ? (
              <div className="h-9 w-12 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              <p className="font-playfair text-3xl font-bold text-white">{stat.count}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Icon
              name="MagnifyingGlassIcon"
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-400 focus:outline-none focus:border-primary font-montserrat"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'user', 'admin', 'superadmin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-3 rounded-xl text-sm font-medium font-montserrat transition-all ${
                  selectedRole === role
                    ? 'bg-primary text-black'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Icon name="ArrowPathIcon" size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Fetch Error ── */}
      {fetchError && (
        <div className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-500/10">
          <div className="flex items-center gap-3">
            <Icon name="ExclamationCircleIcon" size={20} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-montserrat">{fetchError}</p>
            <button
              onClick={fetchUsers}
              className="ml-auto text-xs text-primary hover:underline font-montserrat"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-playfair text-2xl font-bold text-white">User Role Management</h3>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="text-neutral-400 text-sm font-montserrat">
                {filteredUsers.length} of {users.length} users
              </span>
            )}
            {/* Add button — shown only for user or admin filter tabs */}
            {(selectedRole === 'user' || selectedRole === 'admin') && (
              <button
                onClick={() => openCreateModal(selectedRole)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-sm font-semibold font-montserrat hover:glow-gold transition-all"
              >
                <Icon name="PlusIcon" size={16} />
                Add {selectedRole === 'admin' ? 'Admin' : 'User'}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium font-montserrat">User</th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium font-montserrat">Email</th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium font-montserrat">Current Role</th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium font-montserrat">Change Role</th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium font-montserrat">Status</th>
                <th className="text-left py-4 px-4 text-neutral-400 text-sm font-medium font-montserrat">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? skeletonRows.map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="py-4 px-4">
                          <div className="h-6 rounded-lg bg-white/10 animate-pulse" style={{ width: j === 0 ? '160px' : j === 1 ? '200px' : '100px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        busyMap[user.id] ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {/* User */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-playfair text-sm shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium font-montserrat">{user.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-neutral-400 font-montserrat text-sm">{user.email}</td>

                      {/* Current Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium font-montserrat ${roleBadgeClass(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Role Select — hidden for superadmin */}
                      <td className="py-4 px-4">
                        {user.role === 'superadmin' ? (
                          <span className="text-neutral-600 text-xs font-montserrat italic">—</span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user, e.target.value as 'user' | 'admin' | 'superadmin')
                            }
                            disabled={busyMap[user.id]}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-montserrat focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">SuperAdmin</option>
                          </select>
                        )}
                      </td>

                      {/* Status Toggle — hidden for superadmin */}
                      <td className="py-4 px-4">
                        {user.role === 'superadmin' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-montserrat bg-accent/20 text-accent">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={busyMap[user.id]}
                            title={user.isActive ? 'Click to ban' : 'Click to activate'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-montserrat transition-all hover:scale-105 disabled:opacity-50 cursor-pointer ${
                              user.isActive
                                ? 'bg-accent/20 text-accent hover:bg-accent/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-accent' : 'bg-red-400'}`}
                            />
                            {user.isActive ? 'Active' : 'Banned'}
                          </button>
                        )}
                      </td>

                      {/* Actions — superadmin: password only; others: full CRUD */}
                      <td className="py-4 px-4">
                        {user.role === 'superadmin' ? (
                          <button
                            onClick={() => openEditModal(user, 'password')}
                            disabled={busyMap[user.id]}
                            title="Change password"
                            className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all disabled:opacity-50"
                          >
                            <Icon name="KeyIcon" size={15} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* Edit Profile */}
                            <button
                              onClick={() => openEditModal(user, 'profile')}
                              disabled={busyMap[user.id]}
                              title="Edit profile"
                              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                            >
                              <Icon name="PencilSquareIcon" size={15} />
                            </button>
                            {/* Change Password */}
                            <button
                              onClick={() => openEditModal(user, 'password')}
                              disabled={busyMap[user.id]}
                              title="Change password"
                              className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all disabled:opacity-50"
                            >
                              <Icon name="KeyIcon" size={15} />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete(user)}
                              disabled={busyMap[user.id]}
                              title="Delete user"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              <Icon name="TrashIcon" size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

              {/* Empty state */}
              {!loading && !fetchError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Icon name="UsersIcon" size={40} className="mx-auto mb-3 text-neutral-600" />
                    <p className="text-neutral-400 font-montserrat">
                      {searchQuery || selectedRole !== 'all' ? 'No users match your filter' : 'No users found'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit User Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-playfair shrink-0">
                  {editTarget.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-white">{editTarget.name}</h3>
                  <p className="text-neutral-400 text-xs font-montserrat mt-0.5">{editTarget.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>

            {/* Tabs — superadmin: password-only, no profile tab */}
            {editTarget.role === 'superadmin' ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/10 border border-secondary/20">
                <Icon name="ShieldExclamationIcon" size={16} className="text-secondary shrink-0" />
                <p className="text-secondary text-xs font-montserrat">
                  Super Admin — only password change is permitted
                </p>
              </div>
            ) : (
              <div className="flex rounded-xl bg-white/5 p-1 gap-1">
                <button
                  onClick={() => setEditTab('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all ${
                    editTab === 'profile' ? 'bg-primary text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon name="UserIcon" size={15} />
                  Edit Profile
                </button>
                <button
                  onClick={() => setEditTab('password')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all ${
                    editTab === 'password' ? 'bg-primary text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon name="KeyIcon" size={15} />
                  Change Password
                </button>
              </div>
            )}

            {/* ── Profile Tab — non-superadmin only ── */}
            {editTab === 'profile' && editTarget.role !== 'superadmin' && (
              <form onSubmit={handleEditProfile} className="space-y-5">
                {editProfileApiError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-montserrat text-center">{editProfileApiError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">Full Name</label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={(e) => setEditProfile((p) => ({ ...p, name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                      editProfileErrors.name ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {editProfileErrors.name && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{editProfileErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">Email Address</label>
                  <input
                    type="email"
                    value={editProfile.email}
                    onChange={(e) => setEditProfile((p) => ({ ...p, email: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                      editProfileErrors.email ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {editProfileErrors.email && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{editProfileErrors.email}</p>}
                </div>
                {/* Info: last login / joined */}
                <div className="grid grid-cols-2 gap-3">
                  {editTarget.createdAt && (
                    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-neutral-500 text-xs font-montserrat mb-1">Joined</p>
                      <p className="text-neutral-300 text-sm font-montserrat">{new Date(editTarget.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  {editTarget.lastLogin && (
                    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-neutral-500 text-xs font-montserrat mb-1">Last Login</p>
                      <p className="text-neutral-300 text-sm font-montserrat">{new Date(editTarget.lastLogin).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={editProfileLoading} className="flex-1 py-3 rounded-xl bg-primary text-black font-semibold font-montserrat text-sm hover:glow-gold transition-all disabled:opacity-50">
                    {editProfileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Password Tab ── */}
            {editTab === 'password' && (
              <form onSubmit={handleEditPassword} className="space-y-5">
                {editPasswordApiError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-montserrat text-center">{editPasswordApiError}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-amber-300 text-xs font-montserrat leading-relaxed">
                      You are setting a new password for <span className="font-semibold">{editTarget.name}</span>. They will need to use this new password on their next login.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">New Password</label>
                  <input
                    type="password"
                    value={editPassword.newPassword}
                    onChange={(e) => setEditPassword((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                      editPasswordErrors.newPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {editPasswordErrors.newPassword && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{editPasswordErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">Confirm New Password</label>
                  <input
                    type="password"
                    value={editPassword.confirmPassword}
                    onChange={(e) => setEditPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                      editPasswordErrors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {editPasswordErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{editPasswordErrors.confirmPassword}</p>}
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={editPasswordLoading} className="flex-1 py-3 rounded-xl bg-primary text-black font-semibold font-montserrat text-sm hover:glow-gold transition-all disabled:opacity-50">
                    {editPasswordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Create User / Admin Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${createRole === 'admin' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                  <Icon
                    name={createRole === 'admin' ? 'ShieldCheckIcon' : 'UserPlusIcon'}
                    size={24}
                    className={createRole === 'admin' ? 'text-accent' : 'text-primary'}
                  />
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-white">
                    Create {createRole === 'admin' ? 'Admin' : 'User'} Account
                  </h3>
                  <p className="text-neutral-400 text-xs font-montserrat mt-0.5">
                    New {createRole} will be active immediately
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>

            {/* API Error */}
            {createApiError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm font-montserrat text-center">{createApiError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">Full Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={`Enter ${createRole}'s full name`}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                    createErrors.name ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {createErrors.name && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{createErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">Email Address</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={`Enter ${createRole}'s email`}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                    createErrors.email ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {createErrors.email && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{createErrors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 font-montserrat">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-neutral-500 focus:outline-none focus:border-primary font-montserrat transition-all ${
                    createErrors.password ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {createErrors.password && <p className="text-red-400 text-xs mt-1.5 font-montserrat">{createErrors.password}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-black font-semibold font-montserrat text-sm hover:glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading
                    ? `Creating ${createRole === 'admin' ? 'Admin' : 'User'}...`
                    : `Create ${createRole === 'admin' ? 'Admin' : 'User'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-5 border border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Icon name="ExclamationTriangleIcon" size={28} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-white">Delete User</h3>
                <p className="text-neutral-400 text-sm font-montserrat mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-neutral-300 font-montserrat text-sm">
              Are you sure you want to permanently delete{' '}
              <span className="text-white font-semibold">{confirmDelete.name}</span> (
              {confirmDelete.email})?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-montserrat text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-montserrat text-sm font-medium transition-all border border-red-500/20"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
