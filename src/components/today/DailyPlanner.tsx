import React, { useState } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  ListFilter,
  CheckCheck,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import type { Task, PriorityLevel } from '../../types';
import { TaskItem } from './TaskItem';

interface DailyPlannerProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onQuickAddTask: (title: string, priority: PriorityLevel, time?: string) => void;
  onOpenFullModal: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onReorderTasks: (reorderedTasks: Task[]) => void;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onQuickAddTask,
  onOpenFullModal,
  selectedDate,
  onDateChange,
  onReorderTasks,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<PriorityLevel>('medium');
  const [quickTime, setQuickTime] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Filter tasks for the selected day
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const pendingTasks = dayTasks.filter((t) => !t.completed);
  const completedTasks = dayTasks.filter((t) => t.completed);

  // High priority vs regular
  const highPriorityPending = pendingTasks.filter((t) => t.priority === 'high');
  const regularPending = pendingTasks.filter((t) => t.priority !== 'high');

  const totalCount = dayTasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Navigation helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDateTitle = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayAndMonth = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayAndMonth}`;
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(quickTitle.trim(), quickPriority, quickTime || undefined);
    setQuickTitle('');
    setQuickTime('');
  };

  const handlePostponeTomorrow = (task: Task) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + 1);
    const tomorrowStr = current.toISOString().split('T')[0];
    onEditTask({ ...task, date: tomorrowStr });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedTaskId(null);
      return;
    }

    const sourceIndex = tasks.findIndex((t) => t.id === sourceId);
    const targetIndex = tasks.findIndex((t) => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedTaskId(null);
      return;
    }

    const updatedTasks = [...tasks];
    const [removed] = updatedTasks.splice(sourceIndex, 1);
    updatedTasks.splice(targetIndex, 0, removed);

    onReorderTasks(updatedTasks);
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 sm:pb-8">
      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-surface border border-surface-border rounded-2xl p-2 sm:p-3 shadow-sm">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-center">
          <div className="flex flex-col">
            <div className="flex items-center justify-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-foreground">
                {formatDateTitle(selectedDate)}
              </span>
              {isToday && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent-text border border-accent/30">
                  Hoje
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5">
              {completedCount} de {totalCount} concluídas ({progressPercent}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isToday && (
            <button
              onClick={() => onDateChange(new Date().toISOString().split('T')[0])}
              className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-muted text-foreground font-medium transition-colors mr-1"
            >
              Voltar para Hoje
            </button>
          )}
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Próximo dia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-surface border border-surface-border rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              Progresso do Dia
            </span>
            <span className="font-semibold text-accent-text">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-indigo-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickSubmit}
        className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-surface border border-surface-border focus-within:border-accent shadow-sm transition-all"
      >
        <div className="flex items-center gap-2 w-full flex-1 px-2">
          <Plus className="w-4 h-4 text-accent-text" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Adicionar tarefa rápida para este dia... (Enter para salvar)"
            className="w-full py-2 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2 pb-1 sm:pb-0">
          <input
            type="time"
            value={quickTime}
            onChange={(e) => setQuickTime(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-foreground focus:outline-none"
            title="Horário agendado"
          />

          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as PriorityLevel)}
            className="px-2 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-foreground focus:outline-none"
          >
            <option value="high">🔴 Alta (P1)</option>
            <option value="medium">🟡 Média (P2)</option>
            <option value="low">🟢 Baixa (P3)</option>
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-md shadow-accent/20"
          >
            Adicionar
          </button>
        </div>
      </form>

      {/* High Priority Tasks Section */}
      {highPriorityPending.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>Prioridade Máxima (Foco do Dia)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400">
                {highPriorityPending.length}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 hidden sm:inline-flex">
              <ArrowUpDown className="w-3 h-3" /> Arraste para reordenar
            </span>
          </div>
          <div className="space-y-2.5">
            {highPriorityPending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onPostponeTomorrow={handlePostponeTomorrow}
                draggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={draggedTaskId === task.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular Pending Tasks Section */}
      {regularPending.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tarefas do Dia</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {regularPending.length}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 hidden sm:inline-flex">
              <ArrowUpDown className="w-3 h-3" /> Arraste para reordenar
            </span>
          </div>
          <div className="space-y-2.5">
            {regularPending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onPostponeTomorrow={handlePostponeTomorrow}
                draggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={draggedTaskId === task.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State when no tasks for today */}
      {dayTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-dashed border-surface-border rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center text-accent-text">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">Nenhuma tarefa para este dia</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Aproveite a tranquilidade ou adicione suas principais prioridades usando o formulário acima.
            </p>
          </div>
          <button
            onClick={onOpenFullModal}
            className="px-4 py-2 rounded-xl bg-surface-hover hover:bg-surface-border text-foreground text-xs font-medium border border-surface-border transition-all"
          >
            + Criar Tarefa Detalhada
          </button>
        </div>
      )}

      {/* Completed Tasks Accordion */}
      {completedTasks.length > 0 && (
        <section className="pt-4 border-t border-surface-border space-y-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Concluídas ({completedTasks.length})</span>
            </div>
            <span className="text-[11px] underline">
              {showCompleted ? 'Ocultar' : 'Mostrar'}
            </span>
          </button>

          {showCompleted && (
            <div className="space-y-2.5 animate-fade-in">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
