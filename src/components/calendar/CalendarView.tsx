import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  CheckCircle2
} from 'lucide-react';
import type { Task } from '../../types';
import { TaskItem } from '../today/TaskItem';

interface CalendarViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTaskForDate: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTaskForDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split('T')[0]
  );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const monthName = currentMonthDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Tasks for selected date
  const selectedDayTasks = tasks.filter((t) => t.date === selectedDateStr);

  // Group tasks by date for the calendar dots
  const tasksByDate = tasks.reduce<Record<string, { total: number; pending: number; completed: number }>>((acc, t) => {
    if (!acc[t.date]) {
      acc[t.date] = { total: 0, pending: 0, completed: 0 };
    }
    acc[t.date].total += 1;
    if (t.completed) acc[t.date].completed += 1;
    else acc[t.date].pending += 1;
    return acc;
  }, {});

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 sm:pb-8">
      {/* Calendar Card */}
      <div className="bg-surface border border-surface-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
        {/* Header: Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent-text" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground capitalize">
              {monthName}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentMonthDate(now);
                setSelectedDateStr(todayStr);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-hover hover:bg-muted text-foreground transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((day, i) => (
            <div
              key={i}
              className="text-xs font-medium text-muted-foreground py-1 select-none"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: startingDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-12 sm:h-16 rounded-xl bg-transparent opacity-20" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const summary = tasksByDate[dateStr];

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-12 sm:h-16 rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all relative border ${
                  isSelected
                    ? 'bg-accent/15 border-accent text-accent-text font-bold shadow-sm'
                    : isToday
                    ? 'bg-surface-hover border-accent/40 text-foreground font-semibold'
                    : 'bg-background/40 border-surface-border/60 hover:border-surface-border hover:bg-surface-hover text-foreground'
                }`}
              >
                <span className="text-xs sm:text-sm">{dayNum}</span>

                {/* Task Indicators */}
                {summary && (
                  <div className="flex items-center gap-1">
                    {summary.pending > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                    {summary.completed > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Section */}
      <div className="bg-surface border border-surface-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Tarefas do Dia Selecionado
            </span>
            <h4 className="text-base sm:text-lg font-bold text-foreground">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h4>
          </div>

          <button
            onClick={() => onAddTaskForDate(selectedDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-all shadow-md shadow-accent/20"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Tarefa</span>
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {selectedDayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}

          {selectedDayTasks.length === 0 && (
            <div className="p-8 text-center bg-background/50 border border-dashed border-surface-border rounded-2xl space-y-2">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                Nenhuma tarefa agendada para este dia.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
