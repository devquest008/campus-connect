import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Plus, Clock, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Broadcast = Tables<'broadcasts'>;

const CATEGORIES = [
  { value: 'study', label: '📚 Study' },
  { value: 'hobby', label: '🎮 Hobby' },
  { value: 'help', label: '🆘 Help' },
  { value: 'social', label: '🎉 Social' },
];

const DURATIONS = [15, 30, 60, 120];

export default function BroadcastPage() {
  const { profile, campus } = useAuthStore();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('study');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBroadcasts();
    const channel = supabase.channel('broadcasts-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => loadBroadcasts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const loadBroadcasts = async () => {
    const { data } = await supabase.from('broadcasts').select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (data) setBroadcasts(data);
  };

  const createBroadcast = async () => {
    if (!profile || !campus || !message.trim()) return;
    setLoading(true);
    const expiresAt = new Date(Date.now() + duration * 60000).toISOString();
    await supabase.from('broadcasts').insert({
      user_id: profile.user_id,
      campus_id: campus.id,
      message: message.trim(),
      category,
      duration_minutes: duration,
      expires_at: expiresAt,
    });
    setShowCreate(false);
    setMessage('');
    setLoading(false);
  };

  const deleteBroadcast = async (id: string) => {
    await supabase.from('broadcasts').delete().eq('id', id);
  };

  const categoryColors: Record<string, string> = {
    study: 'neon-border-cyan bg-blue-500/10',
    hobby: 'border-neon-green/30 bg-neon-green/10',
    help: 'border-destructive/30 bg-destructive/10',
    social: 'neon-border-purple bg-neon-purple/10',
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-destructive animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">Right Now Mode</h1>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="glow-cyan">
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'Broadcast'}
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-xl p-4 space-y-3 neon-border-cyan">
          <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="What are you doing right now?" />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <Badge key={cat.value} variant={category === cat.value ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCategory(cat.value)}>
                {cat.label}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(d => (
              <Badge key={d} variant={duration === d ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setDuration(d)}>
                <Clock className="w-3 h-3 mr-1" />{d}m
              </Badge>
            ))}
          </div>
          <Button onClick={createBroadcast} disabled={loading || !message.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '📡 Go Live'}
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {broadcasts.map((b, i) => {
          const timeLeft = Math.max(0, Math.floor((new Date(b.expires_at).getTime() - Date.now()) / 60000));
          const isMine = b.user_id === profile?.user_id;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn("glass rounded-xl p-4 animate-glow-pulse", categoryColors[b.category])}
            >
              <p className="text-foreground font-medium text-lg">{b.message}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{b.category}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeLeft}m remaining
                  </span>
                </div>
                {isMine && (
                  <Button size="sm" variant="ghost" onClick={() => deleteBroadcast(b.id)} className="text-destructive">
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {broadcasts.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No active broadcasts. Be the first to go live!</p>
        </div>
      )}
    </div>
  );
}
