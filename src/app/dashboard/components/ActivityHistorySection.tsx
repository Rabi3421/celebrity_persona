"use client";

import Icon from '@/components/ui/AppIcon';

interface Activity {
  id: string;
  type: 'saved' | 'uploaded' | 'reviewed' | 'followed' | 'liked';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function ActivityHistorySection() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'saved',
      title: 'Saved Outfit',
      description: 'Saved "Zendaya Red Carpet Gown" to wishlist',
      timestamp: '2 hours ago',
      icon: 'HeartIcon',
      color: 'text-secondary',
    },
    {
      id: '2',
      type: 'uploaded',
      title: 'Uploaded Item',
      description: 'Uploaded "Vintage Denim Jacket" to gallery',
      timestamp: '5 hours ago',
      icon: 'ArrowUpTrayIcon',
      color: 'text-primary',
    },
    {
      id: '3',
      type: 'reviewed',
      title: 'Posted Review',
      description: 'Reviewed "Dune: Part Two" with 4.5 stars',
      timestamp: '1 day ago',
      icon: 'StarIcon',
      color: 'text-warning',
    },
    {
      id: '4',
      type: 'followed',
      title: 'Followed Celebrity',
      description: 'Started following Timothée Chalamet',
      timestamp: '2 days ago',
      icon: 'UserPlusIcon',
      color: 'text-accent',
    },
    {
      id: '5',
      type: 'liked',
      title: 'Liked Outfit',
      description: 'Liked "Blake Lively Gala Look"',
      timestamp: '3 days ago',
      icon: 'HandThumbUpIcon',
      color: 'text-secondary',
    },
    {
      id: '6',
      type: 'saved',
      title: 'Saved Celebrity',
      description: 'Saved Florence Pugh to favorites',
      timestamp: '5 days ago',
      icon: 'BookmarkIcon',
      color: 'text-primary',
    },
    {
      id: '7',
      type: 'uploaded',
      title: 'Uploaded Item',
      description: 'Uploaded "Red Carpet Gown" to gallery',
      timestamp: '1 week ago',
      icon: 'ArrowUpTrayIcon',
      color: 'text-primary',
    },
    {
      id: '8',
      type: 'reviewed',
      title: 'Posted Review',
      description: 'Reviewed "Barbie" with 5 stars',
      timestamp: '1 week ago',
      icon: 'StarIcon',
      color: 'text-warning',
    },
    {
      id: '9',
      type: 'followed',
      title: 'Followed Celebrity',
      description: 'Started following Harry Styles',
      timestamp: '2 weeks ago',
      icon: 'UserPlusIcon',
      color: 'text-accent',
    },
    {
      id: '10',
      type: 'saved',
      title: 'Saved Outfit',
      description: 'Saved "Emma Stone Casual Look" to wishlist',
      timestamp: '2 weeks ago',
      icon: 'HeartIcon',
      color: 'text-secondary',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-playfair text-3xl font-bold text-white mb-2">
          Activity History
        </h2>
        <p className="text-neutral-400">Your recent actions and interactions</p>
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-3xl p-8">
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`glass-card p-3 rounded-full ${
                    index === 0 ? 'ring-2 ring-primary/30' : ''
                  }`}
                >
                  <Icon name={activity.icon} size={20} className={activity.color} />
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-full bg-white/10 mt-2" />
                )}
              </div>

              {/* Activity Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-white">{activity.title}</h3>
                  <span className="text-xs text-neutral-500">{activity.timestamp}</span>
                </div>
                <p className="text-sm text-neutral-400">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <button className="glass-card px-6 py-3 rounded-full text-sm text-white hover:text-primary transition-colors">
            Load More Activity
          </button>
        </div>
      </div>
    </div>
  );
}