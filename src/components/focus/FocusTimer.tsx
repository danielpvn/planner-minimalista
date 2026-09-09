import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '../../types';
import { sound } from '../../lib/sound';
import { getTodayString } from '../../lib/dates';
import { NotificationManager } from '../../lib/notifications';

interface FocusTimerProps {
  tasks: Task[];
  onCompleteTask?: (id: string) => void;
}

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<Mode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, onCompleteTask }) => {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_TIMES.pomodoro);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const todayStr = getTodayString();
  const pendingTodayTasks = tasks.filter((t) => t.date === todayStr && !t.completed);

  // Switch mode
  const handleModeChange = (newMode: Mode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  // Timer Tick
  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      sound.playCelebration();

      if (mode === 'pomodoro') {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        NotificationManager.notify('🎉 Sessão de Foco Concluída!', 'Excelente trabalho! Hora de uma pausa revigorante.');
      } else {
        NotificationManager.notify('⚡ Pausa Concluída', 'Pronto para a próxima rodada de foco?');
      }
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalTime = MODE_TIMES[mode];
  const progressPercent = Math.round(((totalTime - timeLeft) / totalTime) * 100);

  const handleFinishTask = () => {
    if (selectedTaskId && onCompleteTask) {
      onCompleteTask(selectedTaskId);
      setSelectedTaskId('');
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16 sm:pb-8 text-center">
      {/* Modes Selector */}
      <div className="inline-flex p-1.5 rounded-2xl bg-surface border border-surface-border">
        <button
          onClick={() => handleModeChange('pomodoro')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === 'pomodoro'
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Foco (25m)
        </button>
        <button
          onClick={() => handleModeChange('shortBreak')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === 'shortBreak'
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pausa Curta (5m)
        </button>
        <button
          onClick={() => handleModeChange('longBreak')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === 'longBreak'
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pausa Longa (15m)
        </button>
      </div>

      {/* Main Timer Display */}
      <div className="relative p-10 sm:p-14 rounded-3xl bg-surface border border-surface-border shadow-xl space-y-6 flex flex-col items-center justify-center">
        {/* Progress ring or background aura */}
        <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-foreground select-none">
          {formattedTime}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Active Task Selector */}
        <div className="w-full max-w-sm space-y-2">
          <label className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-text" />
            Focar na tarefa de hoje:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-background border border-surface-border text-xs text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Selecione uma tarefa (opcional)</option>
            {pendingTodayTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} {t.time ? `(${t.time})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-surface-hover hover:bg-muted text-muted-foreground hover:text-foreground border border-surface-border transition-all"
            title="Reiniciar timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className="px-8 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white text-base font-bold flex items-center gap-2 shadow-xl shadow-accent/30 active:scale-95 transition-all"
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isActive ? 'Pausar' : 'Iniciar'}</span>
          </button>

          {selectedTaskId && (
            <button
              onClick={handleFinishTask}
              className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
              title="Concluir tarefa selecionada"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
