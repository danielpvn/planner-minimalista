import React from 'react';
import { 
  Sun, 
  Compass, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Timer, 
  Settings, 
  Cloud,
  CheckCircle2,
  User,
  LogOut
} from 'lucide-react';
import type { ViewMode } from '../../types';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  todayPendingCount: number;
  user: any | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  syncStatus,
  todayPendingCount,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'today' as ViewMode,
      label: 'Hoje',
      icon: Sun,
      badge: todayPendingCount > 0 ? todayPendingCount : undefined,
    },
    {
      id: 'life' as ViewMode,
      label: 'Vida & Metas',
      icon: Compass,
    },
    {
      id: 'calendar' as ViewMode,
      label: 'Calendário',
      icon: CalendarIcon,
    },
    {
      id: 'habits' as ViewMode,
      label: 'Hábitos',
      icon: Sparkles,
    },
    {
      id: 'focus' as ViewMode,
      label: 'Foco',
      icon: Timer,
    },
    {
      id: 'settings' as ViewMode,
      label: 'Ajustes',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (Left side on PC) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-surface-border p-4 justify-between h-screen select-none sticky top-0">
        <div>
          {/* Logo / App Name */}
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground tracking-tight text-base">Plannerm</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Minimalista & Sincronizado</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-soft text-accent-text font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-accent-text' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile, Sync Status & Footer info */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          {/* User Account / Login Button */}
          {user ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-hover/50 border border-surface-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-accent-soft text-accent-text hover:bg-accent hover:text-white border border-accent/20 text-xs font-semibold transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar / Criar Conta</span>
            </button>
          )}

          {/* Sync status */}
          <div 
            onClick={() => onViewChange('settings')}
            className="cursor-pointer flex items-center justify-between px-3 py-2 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Cloud className={`w-3.5 h-3.5 ${
                syncStatus === 'synced' ? 'text-emerald-400' :
                syncStatus === 'syncing' ? 'text-blue-400 animate-pulse' :
                syncStatus === 'error' ? 'text-amber-400' : 'text-slate-500'
              }`} />
              <span>
                {syncStatus === 'synced' && 'Nuvem Conectada'}
                {syncStatus === 'syncing' && 'Sincronizando...'}
                {syncStatus === 'error' && 'Offline / Local'}
                {syncStatus === 'offline' && 'Modo Offline'}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted">PC + iOS</span>
          </div>

          <div className="px-3 text-[11px] text-muted-foreground/60 flex items-center justify-between">
            <span>Atalho: <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-muted font-mono">N</kbd> Nova tarefa</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (iPhone / iOS PWA) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-surface-border px-2 py-1.5 flex items-center justify-around select-none safe-bottom shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-accent-text font-medium scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 text-[9px] w-4 h-4 rounded-full bg-accent text-white font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
