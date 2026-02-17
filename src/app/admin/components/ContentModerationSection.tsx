"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Submission {
  id: string;
  type: 'outfit' | 'celebrity';
  title: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  image: string;
  imageAlt: string;
  description: string;
}

export default function ContentModerationSection() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all'
  );
  const [submissions, setSubmissions] = useState<Submission[]>([
  {
    id: 'sub_1',
    type: 'outfit',
    title: 'Red Carpet Gown - Met Gala 2026',
    submittedBy: 'Sarah Johnson',
    submittedDate: '2026-02-08',
    status: 'pending',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1a6992b94-1770213414145.png",
    imageAlt: 'Elegant red evening gown with flowing train',
    description: 'Stunning red carpet gown worn at Met Gala 2026 featuring intricate beadwork.'
  },
  {
    id: 'sub_2',
    type: 'celebrity',
    title: 'New Celebrity Profile: Anya Taylor-Joy',
    submittedBy: 'Michael Chen',
    submittedDate: '2026-02-07',
    status: 'pending',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_129bd742b-1766922249596.png",
    imageAlt: 'Portrait of woman with elegant styling',
    description: 'Complete profile for actress Anya Taylor-Joy including filmography and fashion moments.'
  },
  {
    id: 'sub_3',
    type: 'outfit',
    title: 'Casual Street Style - NYC Fashion Week',
    submittedBy: 'Emma Rodriguez',
    submittedDate: '2026-02-06',
    status: 'approved',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c8e1ab76-1764798615891.png",
    imageAlt: 'Casual street style outfit with denim jacket',
    description: 'Trendy street style look spotted during NYC Fashion Week.'
  },
  {
    id: 'sub_4',
    type: 'celebrity',
    title: 'New Celebrity Profile: Pedro Pascal',
    submittedBy: 'Olivia Martinez',
    submittedDate: '2026-02-05',
    status: 'approved',
    image: "https://images.unsplash.com/photo-1585076800172-98875d666c55",
    imageAlt: 'Portrait of man in formal attire',
    description: 'Profile for actor Pedro Pascal with recent projects and style evolution.'
  },
  {
    id: 'sub_5',
    type: 'outfit',
    title: 'Vintage Inspired Evening Wear',
    submittedBy: 'James Wilson',
    submittedDate: '2026-02-04',
    status: 'rejected',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_156cbdd9f-1770620310805.png",
    imageAlt: 'Vintage style evening dress',
    description: 'Vintage-inspired evening wear with poor image quality.'
  },
  {
    id: 'sub_6',
    type: 'outfit',
    title: 'Designer Suit - Awards Season',
    submittedBy: 'Sarah Johnson',
    submittedDate: '2026-02-08',
    status: 'pending',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1932136a6-1770620312233.png",
    imageAlt: 'Elegant designer suit in neutral tones',
    description: 'Custom designer suit worn during awards season with impeccable tailoring.'
  }]
  );

  const filteredSubmissions = submissions.filter(
    (sub) => filterStatus === 'all' || sub.status === filterStatus
  );

  const handleApprove = (id: string) => {
    setSubmissions((prev) =>
    prev.map((sub) => sub.id === id ? { ...sub, status: 'approved' as const } : sub)
    );
  };

  const handleReject = (id: string) => {
    setSubmissions((prev) =>
    prev.map((sub) => sub.id === id ? { ...sub, status: 'rejected' as const } : sub)
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-accent/20 text-accent';
      case 'rejected':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-warning/20 text-warning';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    return type === 'celebrity' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="ClockIcon" size={24} className="text-warning" />
            <span className="text-neutral-400 text-sm">Pending Review</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">
            {submissions.filter((s) => s.status === 'pending').length}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="CheckCircleIcon" size={24} className="text-accent" />
            <span className="text-neutral-400 text-sm">Approved</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">
            {submissions.filter((s) => s.status === 'approved').length}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="XCircleIcon" size={24} className="text-destructive" />
            <span className="text-neutral-400 text-sm">Rejected</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">
            {submissions.filter((s) => s.status === 'rejected').length}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="DocumentTextIcon" size={24} className="text-primary" />
            <span className="text-neutral-400 text-sm">Total Submissions</span>
          </div>
          <p className="font-playfair text-3xl font-bold text-white">{submissions.length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-2">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected'].map((status) =>
          <button
            key={status}
            onClick={() => setFilterStatus(status as typeof filterStatus)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            filterStatus === status ?
            'bg-primary text-black' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`
            }>
            
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )}
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubmissions.map((submission) =>
        <div
          key={submission.id}
          className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300">
          
            {/* Image */}
            <div className="relative aspect-[4/5]">
              <AppImage
              src={submission.image}
              alt={submission.imageAlt}
              className="w-full h-full object-cover" />
            
              <div className="absolute top-4 left-4 flex gap-2">
                <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                  submission.type
                )}`}>
                
                  {submission.type === 'celebrity' ? 'Celebrity' : 'Outfit'}
                </span>
                <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                  submission.status
                )}`}>
                
                  {submission.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-playfair text-xl font-bold text-white mb-2">
                {submission.title}
              </h3>
              <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                {submission.description}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500">
                <Icon name="UserIcon" size={14} />
                <span>{submission.submittedBy}</span>
                <span>•</span>
                <Icon name="CalendarIcon" size={14} />
                <span>
                  {new Date(submission.submittedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
                </span>
              </div>

              {/* Actions */}
              {submission.status === 'pending' &&
            <div className="flex gap-2">
                  <button
                onClick={() => handleApprove(submission.id)}
                className="flex-1 bg-accent text-black font-medium px-4 py-2 rounded-xl hover:bg-accent/80 transition-all flex items-center justify-center gap-2">
                
                    <Icon name="CheckIcon" size={16} />
                    Approve
                  </button>
                  <button
                onClick={() => handleReject(submission.id)}
                className="flex-1 bg-destructive text-white font-medium px-4 py-2 rounded-xl hover:bg-destructive/80 transition-all flex items-center justify-center gap-2">
                
                    <Icon name="XMarkIcon" size={16} />
                    Reject
                  </button>
                </div>
            }
            </div>
          </div>
        )}
      </div>

      {filteredSubmissions.length === 0 &&
      <div className="glass-card rounded-2xl p-12 text-center">
          <Icon name="InboxIcon" size={48} className="text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg">No submissions found</p>
        </div>
      }
    </div>);

}