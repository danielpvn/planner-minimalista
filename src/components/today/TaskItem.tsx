import React from 'react';
import { 
  Check, 
  Clock, 
  Trash2, 
  Edit3, 
  ArrowRightCircle, 
  AlertCircle,
  GripVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '../../types';
import { sound } from '../../lib/sound';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPostponeTomorrow?: (task: Task) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onPostponeTomorrow,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}) => {
  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!task.completed) {
      // Audio cue
      sound.playCheck();

      // Confetti burst on completion
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { x, y },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b'],
        disableForReducedMotion: true,
      });
    } else {
      sound.playUncheck();
    }

    onToggle(task.id);
  };

  // Check if overdue
  const isToday = task.date === new Date().toISOString().split('T')[0];
  let isOverdue = false;
  if (isToday && task.time && !task.completed) {
    const now = new Date();
    const [h, m] = task.time.split(':').map(Number);
    if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) {
      isOverdue = true;
    }
  }

  const priorityColors = {
    high: 'border-l-red-500 text-red-400 bg-red-500/10',
    medium: 'border-l-amber-500 text-amber-400 bg-amber-500/10',
    low: 'border-l-emerald-500 text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, task.id)}
      onDrop={(e) => onDrop && onDrop(e, task.id)}
      onDragEnd={onDragEnd}
      className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border transition-all duration-200 ${
        isDragging
          ? 'opacity-30 border-dashed border-accent scale-[0.98]'
          : task.completed
          ? 'opacity-55 border-surface-border'
          : 'border-surface-border hover:border-surface-hover hover:bg-surface-hover/60 shadow-sm'
      }`}
    >
      {/* Drag Grip Handle */}
      {draggable && !task.completed && (
        <div
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground p-0.5 -ml-1 mt-0.5 touch-none"
          title="Arraste para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={handleCheck}
        className={`checkbox-pop mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
          task.completed
            ? 'bg-accent border-accent text-white scale-95 shadow-md shadow-accent/30'
            : 'border-muted-foreground/40 hover:border-accent hover:bg-accent-soft'
        }`}
      >
        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm sm:text-base font-medium tracking-tight cursor-pointer select-text transition-all ${
              task.completed
                ? 'line-through text-muted-foreground'
                : 'text-foreground'
            }`}
          >
            {task.title}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 select-text font-normal">
            {task.description}
          </p>
        )}

        {/* Metadata Badges (Time, Priority, Category) */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Time Badge */}
          {task.time && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                isOverdue
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse-subtle'
                  : 'bg-surface-hover text-muted-foreground border border-surface-border'
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="w-3 h-3 text-red-400" />
              ) : (
                <Clock className="w-3 h-3 text-accent-text" />
              )}
              <span>{task.time}</span>
              {isOverdue && <span className="font-semibold">(atrasada)</span>}
            </span>
          )}

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}
          >
            {task.priority === 'high' && 'P1 Alta'}
            {task.priority === 'medium' && 'P2 Média'}
            {task.priority === 'low' && 'P3 Baixa'}
          </span>

          {/* Category */}
          {task.category && (
            <span className="text-[11px] text-muted-foreground/80 px-2 py-0.5 rounded-md bg-muted/60">
              {task.category}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons (Desktop hover / Always accessible on mobile) */}
      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onPostponeTomorrow && !task.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPostponeTomorrow(task);
            }}
            title="Adiar para amanhã"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-border transition-colors"
          >
            <ArrowRightCircle className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          title="Editar tarefa"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-border transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Excluir tarefa"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
