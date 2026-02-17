"use client";

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

export default function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    bio: 'Fashion enthusiast and celebrity style follower. Love discovering new trends and sharing outfit inspirations.',
    location: 'Los Angeles, CA',
    joinDate: 'January 2024',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11bfa8fdc-1768654380345.png"
  });

  const stats = [
  { label: 'Saved Outfits', value: '127', icon: 'HeartIcon', color: 'text-secondary' },
  { label: 'Uploads', value: '43', icon: 'PhotoIcon', color: 'text-primary' },
  { label: 'Following', value: '89', icon: 'UserGroupIcon', color: 'text-accent' },
  { label: 'Reviews', value: '56', icon: 'StarIcon', color: 'text-warning' }];


  const handleSave = () => {
    setIsEditing(false);
    // Static UI - no backend save
  };

  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20">
              <AppImage
                src={profile?.avatar}
                alt="User profile photo showing a person"
                className="w-full h-full object-cover" />
              
            </div>
            <button className="mt-4 w-full glass-card px-4 py-2 rounded-full text-sm text-white hover:text-primary transition-colors">
              Change Photo
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-playfair text-3xl font-bold text-white mb-2">
                  {profile?.name}
                </h2>
                <p className="text-neutral-400 text-sm mb-1">{profile?.email}</p>
                <p className="text-neutral-500 text-xs">Member since {profile?.joinDate}</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="glass-card px-4 py-2 rounded-full text-sm text-white hover:text-primary transition-colors flex items-center gap-2">
                
                <Icon name={isEditing ? 'XMarkIcon' : 'PencilIcon'} size={16} />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ?
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Full Name
                  </label>
                  <input
                  type="text"
                  value={profile?.name}
                  onChange={(e) => setProfile({ ...profile, name: e?.target?.value })}
                  className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                  value={profile?.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e?.target?.value })}
                  rows={3}
                  className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Location
                  </label>
                  <input
                  type="text"
                  value={profile?.location}
                  onChange={(e) => setProfile({ ...profile, location: e?.target?.value })}
                  className="w-full glass-card px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                
                </div>
                <button
                onClick={handleSave}
                className="bg-primary text-black px-6 py-3 rounded-full font-medium hover:glow-gold transition-all">
                
                  Save Changes
                </button>
              </div> :

            <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-1">Bio</h3>
                  <p className="text-white">{profile?.bio}</p>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Icon name="MapPinIcon" size={16} />
                  <span className="text-sm">{profile?.location}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats?.map((stat) =>
        <div key={stat?.label} className="glass-card rounded-2xl p-6 text-center">
            <Icon name={stat?.icon} size={24} className={`${stat?.color} mx-auto mb-3`} />
            <p className="font-playfair text-3xl font-bold text-white mb-1">{stat?.value}</p>
            <p className="text-sm text-neutral-400">{stat?.label}</p>
          </div>
        )}
      </div>
    </div>);

}