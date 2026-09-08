import React, { useState } from 'react';
import { Plus, Sparkles, Flame, Check, Trash2, X, GripVertical, ArrowUpDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Habit } from '../../types';
import { sound } from '../../lib/sound';

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => void;
  onToggleHabitForToday: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onReorderHabits: (reorderedHabits: Habit[]) => void;
}

const EMOJI_OPTIONS = ['💧', '📖', '⚡', '🏃‍♂️', '🧘‍♂️', '💻', '🥗', '🎯', '🌙', '✍️'];

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onAddHabit,
  onToggleHabitForToday,
  onDeleteHabit,
  onReorderHabits,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💧');
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Get last 7 days for the weekly mini grid
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayLetter: d.toLocaleDateString('pt-BR', { weekday: 'narrow' }).toUpperCase(),
      dayNumber: d.getDate(),
    };
  });

  const handleToggle = (habit: Habit) => {
    const isDoneToday = habit.completed_dates.includes(todayStr);
    if (!isDoneToday) {
      sound.playCheck();
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#10b981', '#f59e0b'],
      });
    } else {
      sound.playUncheck();
    }
    onToggleHabitForToday(habit.id);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddHabit({
      title: title.trim(),
      icon: selectedEmoji,
      streak: 0,
      completed_dates: [],
    });

    setTitle('');
    setIsModalOpen(false);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedHabitId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedHabitId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedHabitId(null);
      return;
    }

    const sourceIndex = habits.findIndex((h) => h.id === sourceId);
    const targetIndex = habits.findIndex((h) => h.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedHabitId(null);
      return;
    }

    const updatedHabits = [...habits];
    const [removed] = updatedHabits.splice(sourceIndex, 1);
    updatedHabits.splice(targetIndex, 0, removed);

    onReorderHabits(updatedHabits);
    setDraggedHabitId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 sm:pb-8">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-surface border border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-accent-text text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rotina & Consistência</span>
          </div>
          <h3 className="text-lg font-bold text-foreground mt-0.5">
            Hábitos Diários
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Pequenas ações repetidas todos os dias que constroem grandes resultados.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-lg shadow-accent/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Hábito</span>
        </button>
      </div>

      {/* Habits List Header with reorder hint */}
      {habits.length > 1 && (
        <div className="flex justify-end px-1">
          <span className="text-[11px] text-muted-foreground/60 hidden sm:flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Arraste para ajustar a ordem
          </span>
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {habits.map((habit) => {
          const isDoneToday = habit.completed_dates.includes(todayStr);
          const isDragging = draggedHabitId === habit.id;

          return (
            <div
              key={habit.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, habit.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, habit.id)}
              onDragEnd={() => setDraggedHabitId(null)}
              className={`p-4 rounded-2xl bg-surface border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDragging
                  ? 'opacity-30 border-dashed border-accent scale-[0.99]'
                  : isDoneToday
                  ? 'border-accent/30 bg-accent-soft/20 shadow-sm'
                  : 'border-surface-border hover:border-surface-hover'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground p-0.5 touch-none shrink-0"
                  title="Arraste para reordenar"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <button
                  onClick={() => handleToggle(habit)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border shrink-0 ${
                    isDoneToday
                      ? 'bg-accent border-accent text-white shadow-md shadow-accent/25 scale-105'
                      : 'bg-background border-surface-border hover:border-accent'
                  }`}
                >
                  {isDoneToday ? <Check className="w-5 h-5 stroke-[3]" /> : habit.icon || '💧'}
                </button>

                <div className="min-w-0">
                  <h4 className={`text-sm font-semibold tracking-tight ${isDoneToday ? 'text-accent-text' : 'text-foreground'}`}>
                    {habit.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {habit.streak} {habit.streak === 1 ? 'dia' : 'dias'} de sequência
                    </span>
                    <span>•</span>
                    <span>{isDoneToday ? 'Concluído hoje' : 'Pendente para hoje'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Last 7 Days Mini History & Delete */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-surface-border pt-2 sm:pt-0 shrink-0">
                {/* 7-day row */}
                <div className="flex items-center gap-1">
                  {last7Days.map((day) => {
                    const isCompleted = habit.completed_dates.includes(day.dateStr);
                    const isCurrent = day.dateStr === todayStr;
                    return (
                      <div
                        key={day.dateStr}
                        className="flex flex-col items-center gap-1"
                        title={day.dateStr}
                      >
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {day.dayLetter}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                            isCompleted
                              ? 'bg-accent text-white border-accent'
                              : isCurrent
                              ? 'border-dashed border-accent/60 bg-accent-soft/30 text-accent-text'
                              : 'bg-background border-surface-border text-muted-foreground/50'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : day.dayNumber}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Excluir hábito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="p-12 text-center bg-surface/50 border border-dashed border-surface-border rounded-3xl space-y-3">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-semibold text-foreground">Nenhum hábito cadastrado</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Crie hábitos como beber água, leitura diária ou treinos para acompanhar seu progresso diário.
            </p>
          </div>
        )}
      </div>

      {/* New Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-foreground">Criar Novo Hábito</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Ícone / Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-accent/20 border-accent scale-110'
                          : 'bg-background border-surface-border hover:bg-surface-hover'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Beber 2L de água, Meditar 10min, Ler 15 páginas..."
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/20 disabled:opacity-40"
                >
                  Criar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
