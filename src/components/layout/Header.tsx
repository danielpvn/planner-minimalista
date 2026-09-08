import React from 'react';
import { Plus, Bell, BellOff, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddTask: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  progressPercent?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onAddTask,
  notificationsEnabled,
  onToggleNotifications,
  progressPercent,
}) => {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border select-none">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {progressPercent !== undefined && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-soft text-accent-text border border-accent/20">
              <Sparkles className="w-3 h-3" />
              {progressPercent}% Concluído
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 capitalize-first">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
        {/* Notification toggle button */}
        <button
          onClick={onToggleNotifications}
          title={notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
          className={`p-2.5 rounded-xl border transition-all ${
            notificationsEnabled
              ? 'bg-surface hover:bg-surface-hover border-surface-border text-foreground'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {notificationsEnabled ? (
            <Bell className="w-4 h-4 text-accent-text" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
        </button>

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-all shadow-lg shadow-accent/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
          <span className="hidden sm:inline-block ml-1 text-[11px] px-1.5 py-0.2 rounded bg-white/20 font-mono">N</span>
        </button>
      </div>
    </header>
  );
};
