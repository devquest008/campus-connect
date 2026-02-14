import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Clock, Users, CheckCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type SessionMember = Tables<'session_members'>;

const CATEGORIES = [
  { value: 'study', label: '📚 Study', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'hobby', label: '🎮 Hobby', color: 'bg-neon-green/20 text-neon-green border-neon-green/30' },
  { value: 'help', label: '🆘 Help', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  { value: 'social', label: '🎉 Social', color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' },
];

export default function Sessions() {
  const { profile, campus } = useAuthStore();
  const [sessions, setSessions] = useState<(Session & { memberCount: number; isMember: boolean })[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [interestTag, setInterestTag] = useState('');
  const [category, setCategory] = useState('study');

  useEffect(() => { loadSessions(); }, [profile]);

  const loadSessions = async () => {
    if (!profile) return;
    const { data: sessionsData } = await supabase.from('sessions').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (!sessionsData) return;

    const enriched = await Promise.all(sessionsData.map(async (s) => {
      const { count } = await supabase.from('session_members').select('*', { count: 'exact', head: true }).eq('session_id', s.id);
      const { data: membership } = await supabase.from('session_members').select('id').eq('session_id', s.id).eq('user_id', profile.user_id).maybeSingle();
      return { ...s, memberCount: count || 0, isMember: !!membership };
    }));

    setSessions(enriched);
  };

  const createSession = async () => {
    if (!profile || !campus || !title.trim()) return;
    setLoading(true);
    await supabase.from('sessions').insert({
      creator_id: profile.user_id,
      campus_id: campus.id,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      interest_tag: interestTag.trim() || null,
      category,
    });
    setShowCreate(false);
    setTitle(''); setDescription(''); setLocation(''); setInterestTag('');
    await loadSessions();
    setLoading(false);
  };

  const joinSession = async (sessionId: string) => {
    if (!profile) return;
    await supabase.from('session_members').insert({ session_id: sessionId, user_id: profile.user_id });
    await loadSessions();
  };

  const leaveSession = async (sessionId: string) => {
    if (!profile) return;
    await supabase.from('session_members').delete().eq('session_id', sessionId).eq('user_id', profile.user_id);
    await loadSessions();
  };

  const checkIn = async (sessionId: string) => {
    if (!profile) return;
    await supabase.from('session_members').update({ checked_in: true }).eq('session_id', sessionId).eq('user_id', profile.user_id);
    await loadSessions();
  };

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.category === filter);

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Sessions</h1>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="glow-cyan">
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'Create'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-xl p-4 space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Session title *" />
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
            <Input value={interestTag} onChange={e => setInterestTag(e.target.value)} placeholder="Interest tag" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <Badge
                key={cat.value}
                variant="outline"
                className={cn("cursor-pointer", category === cat.value ? cat.color : '')}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
          <Button onClick={createSession} disabled={loading || !title.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Session'}
          </Button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('all')}>All</Badge>
        {CATEGORIES.map(cat => (
          <Badge key={cat.value} variant={filter === cat.value ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter(cat.value)}>
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((session, i) => {
          const catInfo = CATEGORIES.find(c => c.value === session.category);
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 space-y-3 hover:neon-border-cyan transition-all"
            >
              <div>
                <h3 className="font-semibold text-foreground">{session.title}</h3>
                {session.description && <p className="text-sm text-muted-foreground mt-1">{session.description}</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {session.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
                )}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.memberCount}/{session.max_members}</span>
                {session.session_time && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(session.session_time).toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={catInfo?.color}>{catInfo?.label}</Badge>
                {session.interest_tag && <Badge variant="outline">#{session.interest_tag}</Badge>}
              </div>
              <div className="flex gap-2">
                {session.isMember ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => leaveSession(session.id)}>Leave</Button>
                    <Button size="sm" variant="outline" onClick={() => checkIn(session.id)} className="text-neon-green border-neon-green/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> I'm Here
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => joinSession(session.id)} className="glow-cyan">Join Session</Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No sessions found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
