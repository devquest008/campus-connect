import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const INTEREST_OPTIONS = [
  'Programming', 'Gaming', 'Music', 'Sports', 'Art', 'Reading',
  'Photography', 'Cooking', 'Fitness', 'Movies', 'Anime', 'Travel',
  'Chess', 'Dance', 'Science', 'Entrepreneurship', 'Volunteering', 'Writing',
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, campus, fetchProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 8 ? [...prev, tag] : prev
    );
  };

  const handleSubmit = async () => {
    if (!user || !campus || !displayName.trim()) return;
    setLoading(true);

    const username = user.email?.split('@')[0] || '';
    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      campus_id: campus.id,
      username,
      display_name: displayName.trim(),
      department: department.trim() || null,
      year: year ? parseInt(year) : null,
      bio: bio.trim() || null,
      interest_tags: selectedTags,
    });

    if (!error) {
      await fetchProfile();
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-accent/20 flex items-center justify-center glow-purple mb-3">
            <User className="w-7 h-7 text-accent" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Create Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">{campus?.name}</p>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Display Name *</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Department</label>
              <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="CSE, ECE..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Year</label>
              <Input value={year} onChange={e => setYear(e.target.value)} placeholder="1-4" type="number" min={1} max={6} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Bio</label>
            <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Interest Tags ({selectedTags.length}/8)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_OPTIONS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all text-xs ${selectedTags.includes(tag) ? 'glow-cyan' : 'hover:bg-muted'}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading || !displayName.trim()} className="w-full glow-cyan">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Launch Profile 🚀'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
