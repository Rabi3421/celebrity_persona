"use client";

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  avatar: string;
  role: string;
  joinDate: string;
  lastLogin?: string;
}

export default function ProfileSection() {
  const { authHeaders, user: authUser } = useAuth();

  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Stats
  interface Stats { savedOutfits: number; uploads: number; following: number; likedCelebrities: number }
  const [stats, setStats] = useState<Stats | null>(null);

  // Edit form state
  const [editName,     setEditName]     = useState('');
  const [editBio,      setEditBio]      = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Avatar upload
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // ── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const headers = authHeaders();
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/user/profile', { headers }),
          fetch('/api/user/stats',   { headers }),
        ]);
        const [profileData, statsData] = await Promise.all([
          profileRes.json(),
          statsRes.json(),
        ]);
        if (profileRes.ok && profileData.success) setProfile(profileData.profile);
        if (statsRes.ok   && statsData.success)   setStats(statsData.stats);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open edit mode ──────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditBio(profile.bio);
    setEditLocation(profile.location);
    setSaveError('');
    setSaveSuccess('');
    setIsEditing(true);
  };

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: editName, bio: editBio, location: editLocation }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.profile);
        setSaveSuccess('Profile saved!');
        setIsEditing(false);
      } else {
        setSaveError(data.message || 'Failed to save profile.');
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar upload ───────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('/api/user/profile/avatar', {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) => prev ? { ...prev, avatar: data.avatarUrl } : prev);
      } else {
        setAvatarError(data.message || 'Upload failed.');
      }
    } catch {
      setAvatarError('Network error. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const joinLabel = profile?.joinDate
    ? new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card rounded-3xl p-8 flex gap-8">
          <div className="w-32 h-32 rounded-full bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-4 pt-2">
            <div className="h-7 w-48 bg-white/10 rounded-xl" />
            <div className="h-4 w-64 bg-white/5 rounded-xl" />
            <div className="h-4 w-32 bg-white/5 rounded-xl" />
            <div className="h-16 w-full bg-white/5 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-28 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Profile Card ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20">
              {profile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-black font-bold text-4xl">
                    {(profile?.name || authUser?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Icon name="ArrowPathIcon" size={24} className="text-white animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="glass-card px-4 py-2 rounded-full text-sm text-white hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Icon name="CameraIcon" size={14} />
              {avatarUploading ? 'Uploading…' : 'Change Photo'}
            </button>
            {avatarError && (
              <p className="text-xs text-red-400 text-center max-w-[9rem]">{avatarError}</p>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h2 className="font-playfair text-3xl font-bold text-white mb-1 break-words">
                  {profile?.name || authUser?.name}
                </h2>
                <p className="text-neutral-400 text-sm mb-1">{profile?.email || authUser?.email}</p>
                {joinLabel && (
                  <p className="text-neutral-500 text-xs">Member since {joinLabel}</p>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={openEdit}
                  className="glass-card px-4 py-2 rounded-full text-sm text-white hover:text-primary transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  <Icon name="PencilIcon" size={16} />
                  Edit
                </button>
              )}
            </div>

            {/* ── Edit form ── */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={50}
                    className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    maxLength={300}
                    className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Tell us about yourself…"
                  />
                  <p className="text-xs text-neutral-500 mt-1 text-right">{editBio.length}/300</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    maxLength={100}
                    className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="City, Country"
                  />
                </div>

                {saveError && (
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <Icon name="ExclamationCircleIcon" size={16} /> {saveError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-black px-6 py-3 rounded-full font-semibold hover:glow-gold transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving && <Icon name="ArrowPathIcon" size={16} className="animate-spin" />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setSaveError(''); }}
                    disabled={saving}
                    className="glass-card px-6 py-3 rounded-full text-sm text-neutral-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="space-y-4">
                {saveSuccess && (
                  <p className="text-sm text-emerald-400 flex items-center gap-2 mb-2">
                    <Icon name="CheckCircleIcon" size={16} /> {saveSuccess}
                  </p>
                )}
                {profile?.bio ? (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-400 mb-1">Bio</h3>
                    <p className="text-white leading-relaxed">{profile.bio}</p>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm italic">No bio yet — click Edit to add one.</p>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Icon name="MapPinIcon" size={16} />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Saved Outfits',      value: stats ? stats.savedOutfits      : null, icon: 'HeartIcon',    color: 'text-secondary' },
          { label: 'Uploads',            value: stats ? stats.uploads            : null, icon: 'PhotoIcon',    color: 'text-primary'   },
          { label: 'Following',          value: stats ? stats.following          : null, icon: 'UserGroupIcon',color: 'text-accent'    },
          { label: 'Liked Celebrities',  value: stats ? stats.likedCelebrities   : null, icon: 'StarIcon',     color: 'text-warning'   },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-6 text-center">
            <Icon name={stat.icon as never} size={24} className={`${stat.color} mx-auto mb-3`} />
            {stat.value === null ? (
              <div className="h-9 w-12 mx-auto mb-1 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              <p className="font-playfair text-3xl font-bold text-white mb-1">{stat.value}</p>
            )}
            <p className="text-sm text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
