import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Tables } from '@/integrations/supabase/types';

type Campus = Tables<'campuses'>;

const campusColors: Record<string, string> = {
  SRMAP: 'from-[hsl(185,100%,50%)] to-[hsl(200,100%,40%)]',
  VITAP: 'from-[hsl(300,100%,45%)] to-[hsl(320,100%,35%)]',
  AMRITA: 'from-[hsl(270,95%,60%)] to-[hsl(280,90%,45%)]',
  VVITU: 'from-[hsl(142,71%,45%)] to-[hsl(160,70%,35%)]',
};

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [step, setStep] = useState<'campus' | 'username' | 'verify'>('campus');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && profile) navigate('/dashboard');
  }, [user, profile]);

  useEffect(() => {
    supabase.from('campuses').select('*').then(({ data }) => {
      if (data) setCampuses(data);
    });
  }, []);

  const handleCampusSelect = (campus: Campus) => {
    setSelectedCampus(campus);
    setStep('username');
  };

  const handleLogin = async () => {
    if (!selectedCampus || !username.trim()) return;
    if (username.includes('@') || username.includes('.')) {
      setError('Enter only your username, not a full email address');
      return;
    }

    setLoading(true);
    setError('');
    const email = `${username.trim()}@${selectedCampus.domain}`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setStep('verify');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center glow-cyan mb-4"
          >
            <Zap className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-primary text-glow-cyan">IRL FRIEND FINDER</h1>
          <p className="text-muted-foreground text-sm mt-1">College Edition</p>
        </div>

        {/* Social Sign-In */}
        <div className="mb-6 space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 gap-3 glass border-border hover:border-primary/50 transition-all"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) console.error("Google sign-in error:", error);
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-foreground font-medium">Continue with Google</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 gap-3 glass border-border hover:border-primary/50 transition-all"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin,
              });
              if (error) console.error("Apple sign-in error:", error);
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-foreground font-medium">Continue with Apple</span>
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or use campus email</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Campus Selection */}
          {step === 'campus' && (
            <motion.div
              key="campus"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <h2 className="font-display text-lg text-center text-foreground mb-4">Select Your Campus</h2>
              {campuses.map((campus, i) => (
                <motion.button
                  key={campus.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCampusSelect(campus)}
                  className="w-full p-4 rounded-xl glass hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${campusColors[campus.short_code] || 'from-primary to-accent'} flex items-center justify-center shadow-lg`}>
                      <span className="text-lg font-display font-bold text-white">{campus.short_code[0]}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-foreground">{campus.name}</h3>
                      <p className="text-xs text-muted-foreground">@{campus.domain}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Username Entry */}
          {step === 'username' && selectedCampus && (
            <motion.div
              key="username"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button onClick={() => setStep('campus')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to campus selection
              </button>
              <div className="glass rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <h2 className="font-display text-lg text-foreground">Enter Your Username</h2>
                  <p className="text-sm text-muted-foreground mt-1">for {selectedCampus.name}</p>
                </div>
                <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-border focus-within:ring-2 focus-within:ring-primary/50">
                  <Input
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder="username"
                    className="border-0 rounded-none focus-visible:ring-0 bg-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <div className="px-3 py-2 bg-muted text-muted-foreground text-sm whitespace-nowrap">
                    @{selectedCampus.domain}
                  </div>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button onClick={handleLogin} disabled={loading || !username.trim()} className="w-full glow-cyan">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Magic Link
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Verification */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-8 text-center space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              </motion.div>
              <h2 className="font-display text-lg text-foreground">Check Your Email</h2>
              <p className="text-muted-foreground text-sm">
                We sent a magic link to <span className="text-primary font-medium">{username}@{selectedCampus?.domain}</span>
              </p>
              <p className="text-muted-foreground text-xs">Click the link in the email to sign in</p>
              <Button variant="ghost" onClick={() => { setStep('username'); setUsername(''); }}>
                Try a different username
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
