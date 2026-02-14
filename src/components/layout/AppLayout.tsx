import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, MessageSquare, Users, Map, User, Settings, LogOut, Zap, Bell, Wifi
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Users, label: 'Sessions', path: '/sessions' },
  { icon: Map, label: 'Heatmap', path: '/heatmap' },
  { icon: Zap, label: 'Broadcast', path: '/broadcast' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { campus, profile, signOut } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleNav = (path: string) => navigate(path);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={{ width: 240 }}
          animate={{ width: collapsed ? 72 : 240 }}
          className="hidden md:flex flex-col glass-strong border-r border-border/40 z-30"
        >
          {/* Logo */}
          <div className="p-4 flex items-center gap-3 border-b border-border/30">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-cyan">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display text-sm font-bold text-primary text-glow-cyan truncate">IRL FINDER</h1>
                <p className="text-[10px] text-muted-foreground truncate">{campus?.short_code || 'Campus'}</p>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary neon-border-cyan glow-cyan"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="p-3 border-t border-border/30">
            <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 glass-strong border-b border-border/40 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2">
            {campus && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full glass neon-border-cyan">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-display text-primary">{campus.short_code}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-green/10 neon-border-cyan">
              <Wifi className="w-3 h-3 text-neon-green" />
              <span className="text-[10px] text-neon-green font-medium">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/40 flex items-center justify-around px-2 py-1 z-40">
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="flex flex-col items-center gap-0.5 py-1.5 px-3 relative"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1 w-8 h-0.5 rounded-full bg-primary glow-cyan"
                  />
                )}
                <item.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[9px]", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
