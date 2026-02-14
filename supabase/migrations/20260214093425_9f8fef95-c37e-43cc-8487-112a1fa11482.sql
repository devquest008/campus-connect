
-- 1. App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Campuses table
CREATE TABLE public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#00f0ff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campuses are publicly readable" ON public.campuses FOR SELECT USING (true);

INSERT INTO public.campuses (name, short_code, domain, lat, lng, color) VALUES
  ('SRM University AP', 'SRMAP', 'srmap.edu.in', 15.7933, 80.0255, '#00f0ff'),
  ('VIT-AP University', 'VITAP', 'vitap.ac.in', 16.4937, 80.4990, '#ff00e6'),
  ('Amrita Vishwa Vidyapeetham AP', 'AMRITA', 'amrita.edu', 16.5417, 80.5158, '#a855f7'),
  ('Vignan''s Foundation for Science', 'VVITU', 'vvitu.edu.in', 16.2340, 80.6480, '#22c55e');

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES public.campuses(id),
  username TEXT NOT NULL,
  display_name TEXT,
  department TEXT,
  year INTEGER,
  bio TEXT,
  avatar_url TEXT,
  interest_tags TEXT[] DEFAULT '{}',
  reputation INTEGER NOT NULL DEFAULT 0,
  cross_campus_visible BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view same-campus profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    campus_id = (SELECT p.campus_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR cross_campus_visible = true
    OR user_id = auth.uid()
  );
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 4. User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- 5. Connections
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  is_cross_campus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own connections" ON public.connections
  FOR SELECT TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Users can create connections" ON public.connections
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can update connections" ON public.connections
  FOR UPDATE TO authenticated USING (addressee_id = auth.uid() OR requester_id = auth.uid());

-- 6. Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES public.campuses(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  session_time TIMESTAMPTZ,
  interest_tag TEXT,
  category TEXT NOT NULL DEFAULT 'study' CHECK (category IN ('study', 'hobby', 'help', 'social')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view campus sessions" ON public.sessions
  FOR SELECT TO authenticated USING (
    campus_id = (SELECT p.campus_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );
CREATE POLICY "Users can create sessions" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can update sessions" ON public.sessions
  FOR UPDATE TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "Creators can delete sessions" ON public.sessions
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- 7. Session members
CREATE TABLE public.session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
ALTER TABLE public.session_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view session members" ON public.session_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join sessions" ON public.session_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own membership" ON public.session_members FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can leave sessions" ON public.session_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 8. Messages (after session_members exists)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR receiver_id = auth.uid() OR session_id IN (
      SELECT sm.session_id FROM public.session_members sm WHERE sm.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can mark messages read" ON public.messages
  FOR UPDATE TO authenticated USING (receiver_id = auth.uid());

-- 9. Broadcasts
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES public.campuses(id),
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'social' CHECK (category IN ('study', 'hobby', 'help', 'social')),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view campus broadcasts" ON public.broadcasts
  FOR SELECT TO authenticated USING (
    campus_id = (SELECT p.campus_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );
CREATE POLICY "Users can create broadcasts" ON public.broadcasts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own broadcasts" ON public.broadcasts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 10. Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES public.campuses(id),
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏅',
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view campus badges" ON public.badges
  FOR SELECT TO authenticated USING (
    campus_id = (SELECT p.campus_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- 11. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 12. Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Helper function
CREATE OR REPLACE FUNCTION public.get_user_campus_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT campus_id FROM public.profiles WHERE user_id = _user_id LIMIT 1 $$;

-- 14. Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
