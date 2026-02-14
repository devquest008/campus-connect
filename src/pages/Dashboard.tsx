import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, TrendingUp, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Session = Tables<'sessions'>;
type Broadcast = Tables<'broadcasts'>;

export default function Dashboard() {
  const { profile, campus } = useAuthStore();
  const [nearbyStudents, setNearbyStudents] = useState<Profile[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    if (!profile) return;

    // Fetch nearby students (same campus, shared interests)
    supabase.from('profiles').select('*').neq('user_id', profile.user_id).limit(12)
      .then(({ data }) => {
        if (data) {
          const sorted = data.sort((a, b) => {
            const aShared = (a.interest_tags || []).filter(t => (profile.interest_tags || []).includes(t)).length;
            const bShared = (b.interest_tags || []).filter(t => (profile.interest_tags || []).includes(t)).length;
            return bShared - aShared;
          });
          setNearbyStudents(sorted);

          // Trending tags
          const tagCount: Record<string, number> = {};
          data.forEach(p => (p.interest_tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
          const trending = Object.entries(tagCount).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 10);
          setTrendingTags(trending);
        }
      });

    // Fetch active sessions
    supabase.from('sessions').select('*').eq('is_active', true).limit(6)
      .then(({ data }) => { if (data) setActiveSessions(data); });

    // Fetch active broadcasts
    supabase.from('broadcasts').select('*').gte('expires_at', new Date().toISOString()).limit(8)
      .then(({ data }) => { if (data) setBroadcasts(data); });

    // Realtime broadcasts
    const channel = supabase.channel('dashboard-broadcasts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
        supabase.from('broadcasts').select('*').gte('expires_at', new Date().toISOString()).limit(8)
          .then(({ data }) => { if (data) setBroadcasts(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const categoryColors: Record<string, string> = {
    study: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    hobby: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    help: 'bg-destructive/20 text-destructive border-destructive/30',
    social: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary text-glow-cyan">{profile?.display_name}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{campus?.name} • {nearbyStudents.length} students online</p>
      </motion.div>

      {/* Live Broadcasts */}
      {broadcasts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-destructive animate-pulse" />
            <h2 className="font-display text-sm font-semibold text-foreground">RIGHT NOW</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {broadcasts.map((b, i) => {
              const timeLeft = Math.max(0, Math.floor((new Date(b.expires_at).getTime() - Date.now()) / 60000));
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4 neon-border-cyan animate-glow-pulse"
                >
                  <p className="text-foreground font-medium">{b.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[b.category] || ''}`}>{b.category}</span>
                    <span className="text-xs text-muted-foreground">{timeLeft}m left</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Nearby Students */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-semibold text-foreground">NEARBY STUDENTS</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {nearbyStudents.slice(0, 8).map((student, i) => {
            const shared = (student.interest_tags || []).filter(t => (profile?.interest_tags || []).includes(t));
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 hover:neon-border-cyan transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-2 group-hover:glow-cyan transition-all">
                  <span className="text-primary font-display font-bold text-sm">
                    {(student.display_name || student.username)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">{student.display_name || student.username}</h3>
                <p className="text-xs text-muted-foreground">{student.department} • Y{student.year}</p>
                {shared.length > 0 && (
                  <p className="text-[10px] text-primary mt-1">{shared.length} shared interest{shared.length > 1 ? 's' : ''}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Active Sessions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-secondary" />
          <h2 className="font-display text-sm font-semibold text-foreground">ACTIVE SESSIONS</h2>
        </div>
        {activeSessions.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No active sessions yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 hover:neon-border-magenta transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-foreground">{session.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{session.location || 'No location'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[session.category] || ''}`}>
                    {session.category}
                  </span>
                  {session.interest_tag && (
                    <span className="text-xs text-muted-foreground">#{session.interest_tag}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Trending Interests */}
      {trendingTags.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h2 className="font-display text-sm font-semibold text-foreground">TRENDING</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((item, i) => (
              <motion.div
                key={item.tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-1.5 rounded-full glass text-sm font-medium text-foreground hover:glow-purple transition-all cursor-pointer"
              >
                #{item.tag} <span className="text-muted-foreground text-xs ml-1">({item.count})</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
