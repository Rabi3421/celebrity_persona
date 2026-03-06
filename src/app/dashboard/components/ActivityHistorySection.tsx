"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

type ActivityType =
  | 'uploaded'
  | 'received_like'
  | 'received_comment'
  | 'liked'
  | 'saved'
  | 'commented'
  | 'followed';

interface Activity {
  type: ActivityType;
  title: string;
  description: string;
  link?: string;
  timestamp: string | null; // ISO string or null
  meta?: string;
}

const TYPE_CONFIG: Record<ActivityType, { icon: string; color: string; bg: string }> = {
  uploaded:          { icon: 'ArrowUpTrayIcon',          color: 'text-primary',    bg: 'bg-primary/10' },
  received_like:     { icon: 'HeartIcon',                color: 'text-rose-400',   bg: 'bg-rose-500/10' },
  received_comment:  { icon: 'ChatBubbleLeftEllipsisIcon', color: 'text-sky-400',  bg: 'bg-sky-500/10' },
  liked:             { icon: 'HandThumbUpIcon',          color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  saved:             { icon: 'BookmarkIcon',             color: 'text-violet-400', bg: 'bg-violet-500/10' },
  commented:         { icon: 'ChatBubbleLeftIcon',       color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  followed:          { icon: 'UserPlusIcon',             color: 'text-accent',     bg: 'bg-accent/10' },
};

function timeAgo(isoString: string | null): string {
  if (!isoString) return 'some time ago';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5)   return `${wks}w ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function ActivityHistorySection() {
  const { authHeaders } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/user/activity', { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setActivities(json.activities);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { fetchActivity(); }, []); // eslint-disable-line

  const visible = activities.slice(0, visibleCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-white mb-2">Activity History</h2>
          <p className="text-neutral-400">Your recent actions and interactions</p>
        </div>
        {!loading && activities.length > 0 && (
          <div className="glass-card px-4 py-2 rounded-full text-xs text-neutral-400">
            {activities.length} events
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-3xl p-6 md:p-8">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="ClockIcon" size={52} className="text-neutral-700 mx-auto mb-4" />
            <h3 className="font-playfair text-xl text-white mb-2">No activity yet</h3>
            <p className="text-neutral-500 text-sm">
              Start uploading outfits, liking posts, or following celebrities — your activity will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {visible.map((activity, index) => {
                const cfg  = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.liked;
                const isLast = index === visible.length - 1;
                const card = (
                  <div
                    key={index}
                    className={`flex gap-4 group ${activity.link ? 'cursor-pointer' : ''}`}
                  >
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-1 ring-white/10 ${cfg.bg} ${index === 0 ? 'ring-primary/40' : ''}`}>
                        <Icon name={cfg.icon as never} size={20} className={cfg.color} />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-white/8 my-1.5" />}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${!isLast ? 'pb-5' : ''}`}>
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-white text-sm leading-snug group-hover:text-primary transition-colors">
                            {activity.title}
                          </h3>
                          {activity.meta && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/10">
                              {activity.meta}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500 whitespace-nowrap flex-shrink-0">
                          {timeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed">{activity.description}</p>
                    </div>
                  </div>
                );

                return activity.link ? (
                  <Link key={index} href={activity.link} className="block hover:no-underline">
                    {card}
                  </Link>
                ) : (
                  <div key={index}>{card}</div>
                );
              })}
            </div>

            {/* Load more / show less */}
            {activities.length > 10 && (
              <div className="text-center mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-3">
                {visibleCount < activities.length && (
                  <button
                    onClick={() => setVisibleCount((v) => v + 10)}
                    className="glass-card px-6 py-3 rounded-full text-sm text-white hover:text-primary transition-colors border border-white/10 hover:border-primary/30"
                  >
                    Load More ({activities.length - visibleCount} left)
                  </button>
                )}
                {visibleCount > 10 && (
                  <button
                    onClick={() => setVisibleCount(10)}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}