"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

// ── Password strength helper ──────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)            score++;
  if (pw.length >= 12)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-500'    };
  if (score <= 3) return { score, label: 'Fair',   color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Good',  color: 'bg-blue-500'   };
  return               { score, label: 'Strong', color: 'bg-emerald-500' };
}

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-50 ${
        value ? 'bg-primary' : 'bg-neutral-700'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Password field with show/hide ─────────────────────────────────────────────
function PasswordInput({
  label, value, onChange, placeholder, disabled,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full glass-card px-4 py-3 pr-12 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
          tabIndex={-1}
        >
          <Icon name={show ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AccountSettingsSection() {
  const { authHeaders, logout } = useAuth();
  const router = useRouter();

  // ── Preferences state ───────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications:  false,
    privateProfile:     false,
    showActivity:       true,
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving,  setPrefsSaving]  = useState(false);
  const [prefsSaved,   setPrefsSaved]   = useState(false);
  const [prefsError,   setPrefsError]   = useState('');

  // ── Password state ──────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError,   setPwError]   = useState('');

  // ── Delete modal state ──────────────────────────────────────────────────
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [deletePassword,    setDeletePassword]    = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount,   setDeletingAccount]   = useState(false);
  const [deleteError,       setDeleteError]       = useState('');

  const strength = getStrength(newPw);

  // ── Fetch preferences on mount ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/preferences', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPrefs(d.preferences); })
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle a preference and auto-save ────────────────────────────────────
  const togglePref = async (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setPrefsSaved(false);
    setPrefsError('');
    setPrefsSaving(true);
    try {
      const res  = await fetch('/api/user/preferences', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ [key]: updated[key] }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2500);
      } else {
        setPrefsError(data.message || 'Failed to save');
        setPrefs(prefs); // revert optimistic update
      }
    } catch {
      setPrefsError('Network error');
      setPrefs(prefs);
    } finally {
      setPrefsSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!currentPw || !newPw || !confirmPw) { setPwError('All three fields are required.'); return; }
    if (newPw.length < 6)                   { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw)                { setPwError('New passwords do not match.'); return; }
    if (currentPw === newPw)                { setPwError('New password must differ from the current one.'); return; }

    setPwSaving(true);
    try {
      const res  = await fetch('/api/auth/user/update-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess('Password updated successfully! 🎉');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        setPwError(data.message || 'Failed to update password.');
      }
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await logout(); } catch {}
    router.push('/homepage');
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE') { setDeleteError('Please type DELETE to confirm.'); return; }
    if (!deletePassword)                { setDeleteError('Please enter your password to confirm.'); return; }
    setDeletingAccount(true);
    try {
      const res  = await fetch('/api/user/account', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) { await logout(); router.push('/homepage'); }
      else setDeleteError(data.message || 'Failed to delete account.');
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-playfair text-3xl font-bold text-white mb-2">Account Settings</h2>
        <p className="text-neutral-400">Manage your preferences and security</p>
      </div>

      {/* ── Notifications ───────────────────────────────────────────────── */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Icon name="BellIcon" size={22} className="text-primary" />
            Notifications
          </h3>
          <span className="text-xs">
            {prefsSaving && <span className="text-neutral-400 flex items-center gap-1"><Icon name="ArrowPathIcon" size={13} className="animate-spin inline" /> Saving…</span>}
            {prefsSaved  && <span className="text-emerald-400 flex items-center gap-1"><Icon name="CheckCircleIcon" size={13} className="inline" /> Saved</span>}
            {prefsError  && <span className="text-red-400">{prefsError}</span>}
          </span>
        </div>

        {prefsLoading ? (
          <div className="space-y-1 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-white/10">
                <div className="space-y-2"><div className="h-4 w-44 bg-white/10 rounded" /><div className="h-3 w-64 bg-white/5 rounded" /></div>
                <div className="w-14 h-7 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {([
              { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive updates about new outfits and celebrities' },
              { key: 'pushNotifications'  as const, label: 'Push Notifications',  desc: 'Get instant alerts for trending content' },
            ]).map((item, idx, arr) => (
              <div key={item.key} className={`flex items-center justify-between py-4 ${idx < arr.length - 1 ? 'border-b border-white/10' : ''}`}>
                <div>
                  <h4 className="text-white font-medium mb-0.5">{item.label}</h4>
                  <p className="text-sm text-neutral-400">{item.desc}</p>
                </div>
                <Toggle value={prefs[item.key]} onChange={() => togglePref(item.key)} disabled={prefsSaving} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Privacy ─────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="font-playfair text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="LockClosedIcon" size={22} className="text-secondary" />
          Privacy
        </h3>
        {prefsLoading ? (
          <div className="space-y-1 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-white/10">
                <div className="space-y-2"><div className="h-4 w-36 bg-white/10 rounded" /><div className="h-3 w-56 bg-white/5 rounded" /></div>
                <div className="w-14 h-7 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {([
              { key: 'privateProfile' as const, label: 'Private Profile', desc: 'Only you can see your uploads and activity' },
              { key: 'showActivity'   as const, label: 'Show Activity',   desc: 'Let others see your likes and saves' },
            ]).map((item, idx, arr) => (
              <div key={item.key} className={`flex items-center justify-between py-4 ${idx < arr.length - 1 ? 'border-b border-white/10' : ''}`}>
                <div>
                  <h4 className="text-white font-medium mb-0.5">{item.label}</h4>
                  <p className="text-sm text-neutral-400">{item.desc}</p>
                </div>
                <Toggle value={prefs[item.key]} onChange={() => togglePref(item.key)} disabled={prefsSaving} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Change Password ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="font-playfair text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="KeyIcon" size={22} className="text-accent" />
          Change Password
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
          <PasswordInput label="Current Password" value={currentPw} onChange={setCurrentPw}
            placeholder="Enter your current password" disabled={pwSaving} />

          <div className="space-y-2">
            <PasswordInput label="New Password" value={newPw} onChange={setNewPw}
              placeholder="At least 6 characters" disabled={pwSaving} />
            {newPw && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-400' : strength.score <= 3 ? 'text-yellow-400' : strength.score === 4 ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {strength.label}
                  {strength.score <= 2 && <span className="text-neutral-500 font-normal ml-1">— try adding numbers, uppercase or symbols</span>}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <PasswordInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw}
              placeholder="Re-enter your new password" disabled={pwSaving} />
            {confirmPw && newPw && (
              <p className={`text-xs flex items-center gap-1 ${confirmPw === newPw ? 'text-emerald-400' : 'text-red-400'}`}>
                <Icon name={confirmPw === newPw ? 'CheckCircleIcon' : 'XCircleIcon'} size={13} />
                {confirmPw === newPw ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {pwError   && <p className="text-sm text-red-400 flex items-center gap-2"><Icon name="ExclamationCircleIcon" size={16} />{pwError}</p>}
          {pwSuccess && <p className="text-sm text-emerald-400 flex items-center gap-2"><Icon name="CheckCircleIcon" size={16} />{pwSuccess}</p>}

          <button type="submit" disabled={pwSaving}
            className="bg-primary text-black px-7 py-3 rounded-full font-semibold hover:glow-gold transition-all disabled:opacity-60 flex items-center gap-2">
            {pwSaving && <Icon name="ArrowPathIcon" size={16} className="animate-spin" />}
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <div className="glass-card rounded-3xl p-8 border border-red-500/30">
        <h3 className="font-playfair text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
          <Icon name="ExclamationTriangleIcon" size={22} />
          Danger Zone
        </h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-medium mb-0.5">Sign Out</h4>
              <p className="text-sm text-neutral-400">Sign out of your account on this device</p>
            </div>
            <button onClick={handleLogout}
              className="glass-card px-4 py-2 rounded-full text-sm text-orange-400 hover:bg-orange-500/10 border border-orange-400/30 transition-colors">
              Sign Out
            </button>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="text-white font-medium mb-0.5">Delete Account</h4>
              <p className="text-sm text-neutral-400">Permanently delete your account and all associated data</p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteError(''); setDeletePassword(''); setDeleteConfirmText(''); }}
              className="glass-card px-4 py-2 rounded-full text-sm text-red-400 hover:bg-red-500/10 border border-red-400/30 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 w-full max-w-md shadow-2xl border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="ExclamationTriangleIcon" size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold text-white">Delete Account</h3>
                <p className="text-sm text-neutral-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
              All your uploads, saved outfits, followed celebrities and profile data will be{' '}
              <span className="text-red-400 font-semibold">permanently deleted</span>.
              Enter your password and type{' '}
              <span className="font-mono font-bold text-white">DELETE</span> to confirm.
            </p>

            <div className="space-y-4">
              <PasswordInput label="Your Password" value={deletePassword} onChange={setDeletePassword}
                placeholder="Enter your current password" disabled={deletingAccount} />

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Type <span className="font-mono text-red-400">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  disabled={deletingAccount}
                  className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
                  placeholder="DELETE"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <Icon name="ExclamationCircleIcon" size={16} /> {deleteError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText !== 'DELETE' || !deletePassword}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-full font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {deletingAccount && <Icon name="ArrowPathIcon" size={16} className="animate-spin" />}
                  {deletingAccount ? 'Deleting…' : 'Permanently Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="flex-1 glass-card py-3 rounded-full text-neutral-300 hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}