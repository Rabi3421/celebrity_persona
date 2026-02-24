"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/context/AuthContext';
import { uploadImage, validateImageFile, deleteImage } from '@/lib/imageUpload';

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserOutfit {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  brand?: string;
  color?: string;
  size?: string;
  purchaseLink?: string;
  purchasePrice?: number;
  store?: string;
  tags: string[];
  views: number;
  likes: string[];
  clicks: any[];
  isPublished: boolean;
  isApproved: boolean;
  slug: string;
  createdAt: string;
}

interface Stats {
  totalUploads: number;
  totalViews: number;
  totalLikes: number;
  totalClicks: number;
}

interface UploadForm {
  title: string;
  description: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  purchaseLink: string;
  purchasePrice: string;
  store: string;
  tags: string;
}

const CATEGORIES = [
  'casual', 'formal', 'ethnic', 'sportswear', 'footwear',
  'accessories', 'western', 'party', 'workwear', 'other',
];

const EMPTY_FORM: UploadForm = {
  title: '', description: '', category: 'casual', brand: '',
  color: '', size: '', purchaseLink: '', purchasePrice: '', store: '', tags: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MyUploadsSection() {
  const { authHeaders } = useAuth();

  const [outfits, setOutfits]       = useState<UserOutfit[]>([]);
  const [stats, setStats]           = useState<Stats>({ totalUploads: 0, totalViews: 0, totalLikes: 0, totalClicks: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [form, setForm]                     = useState<UploadForm>(EMPTY_FORM);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess]   = useState(false);
  const imageInputRef                       = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<UploadForm>(EMPTY_FORM);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState<string | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch user's outfits ──────────────────────────────────────────────────
  const fetchMyOutfits = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch('/api/user-outfits/mine', { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load');
      setOutfits(json.outfits);
      setStats(json.stats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { fetchMyOutfits(); }, [fetchMyOutfits]);

  // ── Image upload helper ───────────────────────────────────────────────────
  const handleImagePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'upload' | 'edit'
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const err = validateImageFile(file);
        if (err) { alert(err); continue; }
        const url = await uploadImage(file, 'user-outfits');
        urls.push(url);
      }
      if (target === 'upload') {
        setUploadedImages((prev) => [...prev, ...urls]);
      } else {
        setEditImages((prev) => [...prev, ...urls]);
      }
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = async (url: string, target: 'upload' | 'edit') => {
    await deleteImage(url);
    if (target === 'upload') {
      setUploadedImages((prev) => prev.filter((u) => u !== url));
    } else {
      setEditImages((prev) => prev.filter((u) => u !== url));
    }
  };

  // ── Submit new outfit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null);
    if (!form.title.trim()) { setSubmitError('Title is required'); return; }
    if (uploadedImages.length === 0) { setSubmitError('Upload at least one image'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user-outfits', {
        method:  'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title.trim(),
          description:   form.description.trim() || undefined,
          images:        uploadedImages,
          purchaseLink:  form.purchaseLink.trim() || undefined,
          purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
          store:         form.store.trim() || undefined,
          tags:          form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          category:      form.category,
          brand:         form.brand.trim() || undefined,
          size:          form.size.trim() || undefined,
          color:         form.color.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Submit failed');
      setSubmitSuccess(true);
      setForm(EMPTY_FORM);
      setUploadedImages([]);
      await fetchMyOutfits();
      setTimeout(() => { setSubmitSuccess(false); setShowUploadForm(false); }, 2000);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (outfit: UserOutfit) => {
    setEditingId(outfit._id);
    setEditImages([...outfit.images]);
    setEditForm({
      title:         outfit.title,
      description:   outfit.description || '',
      category:      outfit.category,
      brand:         outfit.brand || '',
      color:         outfit.color || '',
      size:          outfit.size || '',
      purchaseLink:  outfit.purchaseLink || '',
      purchasePrice: outfit.purchasePrice ? String(outfit.purchasePrice) : '',
      store:         outfit.store || '',
      tags:          outfit.tags.join(', '),
    });
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditError(null);
    if (!editForm.title.trim()) { setEditError('Title is required'); return; }
    if (editImages.length === 0) { setEditError('At least one image required'); return; }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/user-outfits/${editingId}`, {
        method:  'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         editForm.title.trim(),
          description:   editForm.description.trim() || undefined,
          images:        editImages,
          purchaseLink:  editForm.purchaseLink.trim() || undefined,
          purchasePrice: editForm.purchasePrice ? Number(editForm.purchasePrice) : undefined,
          store:         editForm.store.trim() || undefined,
          tags:          editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          category:      editForm.category,
          brand:         editForm.brand.trim() || undefined,
          size:          editForm.size.trim() || undefined,
          color:         editForm.color.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Update failed');
      setEditingId(null);
      await fetchMyOutfits();
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/user-outfits/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setDeletingId(null);
      await fetchMyOutfits();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = (outfit: UserOutfit) => {
    if (outfit.isApproved && outfit.isPublished) return { label: 'Published', cls: 'bg-success/20 text-success border-success/30' };
    if (outfit.isPublished && !outfit.isApproved) return { label: 'Pending', cls: 'bg-warning/20 text-warning border-warning/30' };
    return { label: 'Draft', cls: 'bg-neutral-700/20 text-neutral-400 border-neutral-600/30' };
  };

  // ── Shared input class ────────────────────────────────────────────────────
  const inp = "w-full glass-card px-4 py-3 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent text-sm";
  const lbl = "block text-xs text-neutral-400 mb-1";

  // ── Upload / Edit Form ────────────────────────────────────────────────────
  const renderForm = (
    isEdit: boolean,
    f: UploadForm,
    setF: (v: UploadForm) => void,
    imgs: string[],
    onClose: () => void,
    onSubmit: () => void,
    saving: boolean,
    err: string | null,
    success?: boolean
  ) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-playfair text-2xl font-bold text-white">
            {isEdit ? 'Edit Outfit' : 'Upload New Outfit'}
          </h3>
          <button onClick={onClose} className="glass-card p-2 rounded-full hover:bg-error/20 transition-colors">
            <Icon name="XMarkIcon" size={20} className="text-white" />
          </button>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm text-center">
            ✓ Outfit submitted for review!
          </div>
        )}
        {err && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-red-400 text-sm">
            {err}
          </div>
        )}

        <div className="space-y-5">
          {/* Image upload */}
          <div>
            <label className={lbl}>Photos * (up to 5)</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {imgs.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                  <AppImage src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(url, isEdit ? 'edit' : 'upload')}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Icon name="TrashIcon" size={18} className="text-red-400" />
                  </button>
                </div>
              ))}
              {imgs.length < 5 && (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  {imageUploading
                    ? <div className="w-5 h-5 border-2 border-primary/60 border-t-transparent rounded-full animate-spin" />
                    : <><Icon name="PlusIcon" size={22} className="text-neutral-400" /><span className="text-xs text-neutral-500">Add</span></>
                  }
                </button>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImagePick(e, isEdit ? 'edit' : 'upload')}
            />
          </div>

          {/* Title */}
          <div>
            <label className={lbl}>Title *</label>
            <input
              type="text"
              placeholder="e.g. Women Ethnic Motifs Embroidered Kurta Set"
              className={inp}
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className={lbl}>Description</label>
            <textarea
              rows={3}
              placeholder="Describe the outfit, material, condition, offers..."
              className={inp + ' resize-none'}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </div>

          {/* Row: Category + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Category *</label>
              <select
                className={inp}
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-neutral-900 capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Brand</label>
              <input type="text" placeholder="e.g. Myntra, H&M" className={inp} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
            </div>
          </div>

          {/* Row: Size + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Size</label>
              <input type="text" placeholder="e.g. S, M, L, XL, 32" className={inp} value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Color</label>
              <input type="text" placeholder="e.g. Red, Navy Blue" className={inp} value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
            </div>
          </div>

          {/* Purchase link */}
          <div>
            <label className={lbl}>Purchase Link (optional)</label>
            <input type="url" placeholder="https://www.myntra.com/..." className={inp} value={f.purchaseLink} onChange={(e) => setF({ ...f, purchaseLink: e.target.value })} />
          </div>

          {/* Row: Price + Store */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Price (₹)</label>
              <input type="number" min="0" placeholder="e.g. 999" className={inp} value={f.purchasePrice} onChange={(e) => setF({ ...f, purchasePrice: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Store / Platform</label>
              <input type="text" placeholder="e.g. Myntra, Amazon" className={inp} value={f.store} onChange={(e) => setF({ ...f, store: e.target.value })} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={lbl}>Tags (comma-separated)</label>
            <input type="text" placeholder="e.g. ethnic, kurta, festive, sale" className={inp} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
          </div>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={saving || imageUploading}
            className="w-full bg-primary text-black py-3.5 rounded-full font-semibold hover:glow-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-black/60 border-t-transparent rounded-full animate-spin" /> Submitting...</>
              : <><Icon name="ArrowUpTrayIcon" size={18} /> {isEdit ? 'Save Changes' : 'Submit for Review'}</>
            }
          </button>
          <p className="text-xs text-neutral-500 text-center">Your outfit will be reviewed by our team before it appears publicly.</p>
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map((i) => <div key={i} className="h-72 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-white mb-2">My Uploads</h2>
          <p className="text-neutral-400">Manage your uploaded fashion items</p>
        </div>
        <button
          onClick={() => { setShowUploadForm(true); setForm(EMPTY_FORM); setUploadedImages([]); setSubmitError(null); setSubmitSuccess(false); }}
          className="bg-primary text-black px-6 py-3 rounded-full font-medium hover:glow-gold transition-all flex items-center gap-2"
        >
          <Icon name="ArrowUpTrayIcon" size={20} />
          <span>Upload New</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Uploads', value: stats.totalUploads },
          { label: 'Total Views',   value: stats.totalViews.toLocaleString() },
          { label: 'Total Likes',   value: stats.totalLikes },
          { label: 'Total Clicks',  value: stats.totalClicks },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-6 text-center">
            <p className="font-playfair text-3xl font-bold text-white mb-1">{s.value}</p>
            <p className="text-sm text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {outfits.length === 0 && !loading && (
        <div className="glass-card rounded-3xl p-16 text-center">
          <Icon name="PhotoIcon" size={56} className="text-neutral-600 mx-auto mb-4" />
          <h3 className="font-playfair text-xl text-white mb-2">No uploads yet</h3>
          <p className="text-neutral-400 text-sm mb-6">Upload your first fashion item and share your style with the world!</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-primary text-black px-8 py-3 rounded-full font-medium hover:glow-gold transition-all"
          >
            Upload Your First Outfit
          </button>
        </div>
      )}

      {/* Grid */}
      {outfits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((outfit) => {
            const badge = statusBadge(outfit);
            return (
              <div key={outfit._id} className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:glow-gold transition-all group">
                <div className="relative h-64">
                  <AppImage
                    src={outfit.images[0] || ''}
                    alt={outfit.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Status */}
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Image count */}
                  {outfit.images.length > 1 && (
                    <div className="absolute top-4 right-16 glass-card px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                      <Icon name="PhotoIcon" size={12} />
                      {outfit.images.length}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => startEdit(outfit)}
                      className="glass-card p-2 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      <Icon name="PencilIcon" size={16} className="text-white" />
                    </button>
                    <button
                      onClick={() => setDeletingId(outfit._id)}
                      className="glass-card p-2 rounded-full hover:bg-error/20 transition-colors"
                    >
                      <Icon name="TrashIcon" size={16} className="text-white" />
                    </button>
                  </div>

                  {/* View button */}
                  <Link
                    href={`/user-outfits/${outfit.slug}`}
                    className="absolute bottom-4 right-4 glass-card px-3 py-1.5 rounded-full text-xs text-white hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    View →
                  </Link>
                </div>

                <div className="p-4">
                  <h3 className="font-playfair text-base font-bold text-white mb-1 truncate">{outfit.title}</h3>
                  <p className="text-sm text-neutral-400 capitalize mb-3">{outfit.category}</p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Icon name="EyeIcon" size={14} />
                        {outfit.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="HeartIcon" size={14} />
                        {outfit.likes.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="CursorArrowRaysIcon" size={14} />
                        {outfit.clicks.length}
                      </span>
                    </div>
                    <span>{new Date(outfit.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && renderForm(
        false, form, setForm, uploadedImages,
        () => setShowUploadForm(false),
        handleSubmit, submitting, submitError, submitSuccess
      )}

      {/* Edit Form Modal */}
      {editingId && renderForm(
        true, editForm, setEditForm, editImages,
        () => setEditingId(null),
        saveEdit, editSaving, editError
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="TrashIcon" size={32} className="text-red-400" />
            </div>
            <h3 className="font-playfair text-xl font-bold text-white mb-2">Delete Outfit?</h3>
            <p className="text-neutral-400 text-sm mb-6">This action cannot be undone. All views and click data will be permanently lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 glass-card py-3 rounded-full text-white text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="flex-1 bg-error/80 hover:bg-error text-white py-3 rounded-full text-sm font-medium transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
