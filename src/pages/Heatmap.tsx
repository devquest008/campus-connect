import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type Broadcast = Tables<'broadcasts'>;

const categoryColors: Record<string, string> = {
  study: '#3b82f6',
  hobby: '#22c55e',
  help: '#ef4444',
  social: '#a855f7',
};

export default function Heatmap() {
  const { campus } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    if (!campus) return;
    supabase.from('sessions').select('*').eq('is_active', true)
      .then(({ data }) => { if (data) setSessions(data.filter(s => s.lat && s.lng)); });
    supabase.from('broadcasts').select('*').gte('expires_at', new Date().toISOString())
      .then(({ data }) => { if (data) setBroadcasts(data); });
  }, [campus]);

  if (!campus) return null;

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <h1 className="font-display text-xl font-bold text-foreground">Campus Heatmap</h1>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground capitalize">{cat}</span>
          </div>
        ))}
      </div>

      <div className="h-[calc(100vh-14rem)] rounded-xl overflow-hidden neon-border-cyan">
        <MapContainer
          center={[campus.lat, campus.lng]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {sessions.map(session => (
            <CircleMarker
              key={session.id}
              center={[session.lat!, session.lng!]}
              radius={12}
              pathOptions={{
                color: categoryColors[session.category] || '#a855f7',
                fillColor: categoryColors[session.category] || '#a855f7',
                fillOpacity: 0.4,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{session.title}</strong>
                  <br />
                  <span className="text-xs">{session.location}</span>
                  <br />
                  <span className="text-xs capitalize">{session.category}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
