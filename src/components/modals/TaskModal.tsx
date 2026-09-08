import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle, Tag } from 'lucide-react';
import type { Task, PriorityLevel } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'completed' | 'created_at'> & { id?: string }) => void;
  editingTask?: Task | null;
  defaultDate?: string;
}

const CATEGORIES = ['Estudos', 'Trabalho', 'Pessoal', 'Saúde', 'Finanças', 'Projetos'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [category, setCategory] = useState('Pessoal');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDate(editingTask.date);
      setTime(editingTask.time || '');
      setPriority(editingTask.priority);
      setCategory(editingTask.category || 'Pessoal');
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('');
      setPriority('medium');
      setCategory('Pessoal');
    }
  }, [editingTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: editingTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      time: time.trim() || undefined,
      priority,
      category,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="text-lg font-semibold text-foreground">
            {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              O que você precisa fazer? *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Estudar 30min de Swift, Finalizar relatório..."
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-surface-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent text-sm transition-all"
            />
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Detalhes ou anotações (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione links, tópicos ou detalhes extras..."
              className="w-full px-4 py-2 rounded-xl bg-background border border-surface-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent text-sm resize-none transition-all"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5" />
                Horário / Limite (opcional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Prioridade
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  priority === 'high'
                    ? 'bg-red-500/15 border-red-500/40 text-red-400 font-semibold'
                    : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Alta (P1)
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  priority === 'medium'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-semibold'
                    : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Média (P2)
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  priority === 'low'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                    : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Baixa (P3)
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <Tag className="w-3.5 h-3.5" />
              Categoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    category === cat
                      ? 'bg-accent-soft border-accent/40 text-accent-text font-medium'
                      : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium transition-all shadow-lg shadow-accent/25"
            >
              {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
