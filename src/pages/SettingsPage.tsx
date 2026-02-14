import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { profile, campus, signOut, fetchProfile } = useAuthStore();
  const [crossCampus, setCrossCampus] = useState(profile?.cross_campus_visible || false);

  const toggleCrossCampus = async () => {
    if (!profile) return;
    const newVal = !crossCampus;
    setCrossCampus(newVal);
    await supabase.from('profiles').update({ cross_campus_visible: newVal }).eq('user_id', profile.user_id);
    await fetchProfile();
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 md:pb-0">
      <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
        <Settings className="w-5 h-5" /> Settings
      </h1>

      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Cross-Campus Discoverability</p>
              <p className="text-xs text-muted-foreground">Allow students from other campuses to find you</p>
            </div>
          </div>
          <Switch checked={crossCampus} onCheckedChange={toggleCrossCampus} />
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Campus</p>
            <p className="text-xs text-muted-foreground">{campus?.name}</p>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">{campus?.domain}</span>
        </div>
      </div>

      <Button variant="destructive" onClick={signOut} className="w-full">
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
