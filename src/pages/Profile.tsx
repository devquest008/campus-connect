import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Star, Edit3, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<'badges'>;

const INTEREST_OPTIONS = [
  'Programming', 'Gaming', 'Music', 'Sports', 'Art', 'Reading',
  'Photography', 'Cooking', 'Fitness', 'Movies', 'Anime', 'Travel',
  'Chess', 'Dance', 'Science', 'Entrepreneurship', 'Volunteering', 'Writing',
];

export default function Profile() {
  const { profile, campus, fetchProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [year, setYear] = useState(profile?.year?.toString() || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [tags, setTags] = useState<string[]>(profile?.interest_tags || []);

  useEffect(() => {
    if (profile) {
      supabase.from('badges').select('*').eq('user_id', profile.user_id)
        .then(({ data }) => { if (data) setBadges(data); });
    }
  }, [profile]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 8 ? [...prev, tag] : prev);
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    await supabase.from('profiles').update({
      display_name: displayName.trim(),
      department: department.trim() || null,
      year: year ? parseInt(year) : null,
      bio: bio.trim() || null,
      interest_tags: tags,
    }).eq('user_id', profile.user_id);
    await fetchProfile();
    setEditing(false);
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center glow-cyan">
              <span className="text-2xl font-display font-bold text-primary">
                {(profile.display_name || profile.username)?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">{profile.display_name || profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username} • {campus?.short_code}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-neon-orange" />
                <span className="text-sm font-semibold text-neon-orange">{profile.reputation}</span>
                <span className="text-xs text-muted-foreground ml-1">reputation</span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Edit3 className="w-3 h-3 mr-1" /> {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {editing ? (
          <div className="mt-4 space-y-3">
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" />
              <Input value={year} onChange={e => setYear(e.target.value)} placeholder="Year" type="number" />
            </div>
            <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Interests ({tags.length}/8)</p>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(tag => (
                  <Badge key={tag} variant={tags.includes(tag) ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => toggleTag(tag)}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading} className="glow-cyan">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
            <div className="flex gap-3 text-sm text-muted-foreground">
              {profile.department && <span>📚 {profile.department}</span>}
              {profile.year && <span>🎓 Year {profile.year}</span>}
            </div>
            {(profile.interest_tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(profile.interest_tags || []).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Badges */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-display text-sm font-semibold text-foreground mb-3">🏅 Badges</h2>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges earned yet. Participate in sessions and connect with others!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map(badge => (
              <div key={badge.id} className="glass rounded-lg p-3 text-center glow-purple">
                <span className="text-2xl">{badge.badge_icon}</span>
                <p className="text-sm font-semibold text-foreground mt-1">{badge.badge_name}</p>
                {badge.description && <p className="text-xs text-muted-foreground">{badge.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
