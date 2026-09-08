import React, { useState } from 'react';
import { 
  Plus, 
  Compass, 
  Check, 
  Trash2, 
  Edit3, 
  CalendarPlus, 
  Sparkles, 
  X, 
  Layers,
  GripVertical,
  ArrowUpDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { LifeGoal, PriorityLevel, Milestone } from '../../types';
import { sound } from '../../lib/sound';

interface LifeGoalsProps {
  goals: LifeGoal[];
  onAddGoal: (goal: Omit<LifeGoal, 'id' | 'created_at'>) => void;
  onUpdateGoal: (goal: LifeGoal) => void;
  onDeleteGoal: (id: string) => void;
  onSendMilestoneToToday: (title: string, category?: string) => void;
  onReorderGoals: (reorderedGoals: LifeGoal[]) => void;
}

export const LifeGoals: React.FC<LifeGoalsProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onSendMilestoneToToday,
  onReorderGoals,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LifeGoal | null>(null);
  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [category, setCategory] = useState('Carreira Tech');
  const [milestoneInputs, setMilestoneInputs] = useState<string[]>(['']);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setPriority('high');
    setCategory('Carreira Tech');
    setMilestoneInputs(['']);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: LifeGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setPriority(goal.priority);
    setCategory(goal.category || 'Carreira Tech');
    setMilestoneInputs(goal.milestones.map((m) => m.title));
    setIsModalOpen(true);
  };

  const handleMilestoneToggle = (goal: LifeGoal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((m) => {
      if (m.id === milestoneId) {
        const nextState = !m.completed;
        if (nextState) {
          sound.playCheck();
        } else {
          sound.playUncheck();
        }
        return { ...m, completed: nextState };
      }
      return m;
    });

    // Check if all milestones are completed
    const allCompleted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
    if (allCompleted && goal.status !== 'completed') {
      sound.playCelebration();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    }

    onUpdateGoal({
      ...goal,
      milestones: updatedMilestones,
      status: allCompleted ? 'completed' : 'active',
    });
  };

  const handleAddMilestoneInput = () => {
    setMilestoneInputs([...milestoneInputs, '']);
  };

  const handleMilestoneInputChange = (index: number, val: string) => {
    const updated = [...milestoneInputs];
    updated[index] = val;
    setMilestoneInputs(updated);
  };

  const handleRemoveMilestoneInput = (index: number) => {
    if (milestoneInputs.length > 1) {
      setMilestoneInputs(milestoneInputs.filter((_, i) => i !== index));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validMilestones: Milestone[] = milestoneInputs
      .filter((m) => m.trim().length > 0)
      .map((m, idx) => {
        const existing = editingGoal?.milestones[idx];
        return {
          id: existing ? existing.id : `m-${Date.now()}-${idx}`,
          title: m.trim(),
          completed: existing ? existing.completed : false,
        };
      });

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        milestones: validMilestones,
      });
    } else {
      onAddGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        milestones: validMilestones,
        status: 'active',
      });
    }

    setIsModalOpen(false);
  };

  // Drag & Drop handlers for Life Goals
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedGoalId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedGoalId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedGoalId(null);
      return;
    }

    const sourceIndex = goals.findIndex((g) => g.id === sourceId);
    const targetIndex = goals.findIndex((g) => g.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedGoalId(null);
      return;
    }

    const updatedGoals = [...goals];
    const [removed] = updatedGoals.splice(sourceIndex, 1);
    updatedGoals.splice(targetIndex, 0, removed);

    onReorderGoals(updatedGoals);
    setDraggedGoalId(null);
  };

  // Filter goals
  const filteredGoals = goals.filter((g) => {
    if (selectedFilter === 'completed') return g.status === 'completed';
    if (g.status === 'completed') return false;
    if (selectedFilter === 'all') return true;
    return g.priority === selectedFilter;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 sm:pb-8">
      {/* Intro Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-accent/10 via-surface to-surface border border-surface-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent-text font-semibold text-sm">
            <Compass className="w-4 h-4" />
            <span>Roadmap & Metas de Vida</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            O que você quer conquistar na vida?
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Projetos contínuos e metas sem prazo fixo (ex: <i>Aprender Swift</i>, <i>AWS</i>, <i>Reserva Financeira</i>). Defina a prioridade, quebre em etapas e avance um pouco a cada dia.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-all shadow-lg shadow-accent/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta de Vida</span>
        </button>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-2 border-b border-surface-border no-scrollbar">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === 'all'
                ? 'bg-accent-soft text-accent-text font-semibold border border-accent/30'
                : 'text-muted-foreground hover:bg-surface-hover'
            }`}
          >
            Todas Ativas ({goals.filter((g) => g.status !== 'completed').length})
          </button>

          <button
            onClick={() => setSelectedFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === 'high'
                ? 'bg-red-500/15 text-red-400 font-semibold border border-red-500/30'
                : 'text-muted-foreground hover:bg-surface-hover'
            }`}
          >
            🔴 Alta Prioridade (P1)
          </button>

          <button
            onClick={() => setSelectedFilter('medium')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === 'medium'
                ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
                : 'text-muted-foreground hover:bg-surface-hover'
            }`}
          >
            🟡 Média (P2)
          </button>

          <button
            onClick={() => setSelectedFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === 'low'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                : 'text-muted-foreground hover:bg-surface-hover'
            }`}
          >
            🟢 Baixa (P3)
          </button>

          <button
            onClick={() => setSelectedFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === 'completed'
                ? 'bg-surface-hover text-foreground font-semibold border border-surface-border'
                : 'text-muted-foreground hover:bg-surface-hover'
            }`}
          >
            ✨ Concluídas ({goals.filter((g) => g.status === 'completed').length})
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground/60 hidden sm:flex items-center gap-1 shrink-0">
          <ArrowUpDown className="w-3 h-3" /> Arraste para reordenar
        </span>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const completedMilestones = goal.milestones.filter((m) => m.completed).length;
          const totalMilestones = goal.milestones.length;
          const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
          const nextMilestone = goal.milestones.find((m) => !m.completed);

          const priorityBadge = {
            high: 'bg-red-500/15 text-red-400 border-red-500/30',
            medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          }[goal.priority];

          const isDragging = draggedGoalId === goal.id;

          return (
            <div
              key={goal.id}
              draggable={goal.status !== 'completed'}
              onDragStart={(e) => handleDragStart(e, goal.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, goal.id)}
              onDragEnd={() => setDraggedGoalId(null)}
              className={`p-5 rounded-2xl bg-surface border transition-all duration-200 shadow-sm space-y-4 ${
                isDragging
                  ? 'opacity-30 border-dashed border-accent scale-[0.99]'
                  : 'border-surface-border hover:border-surface-hover'
              }`}
            >
              {/* Header: Title & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {goal.status !== 'completed' && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground p-0.5 mt-0.5 touch-none shrink-0"
                      title="Arraste para reordenar meta"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-bold text-foreground">
                        {goal.title}
                      </h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityBadge}`}>
                        {goal.priority === 'high' ? 'P1 Alta' : goal.priority === 'medium' ? 'P2 Média' : 'P3 Baixa'}
                      </span>
                      {goal.category && (
                        <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60">
                          {goal.category}
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(goal)}
                    title="Editar meta"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    title="Excluir meta"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {totalMilestones > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-accent-text" />
                      {completedMilestones} de {totalMilestones} etapas concluídas
                    </span>
                    <span className="font-semibold text-accent-text">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sub-milestones Checklist */}
              {goal.milestones.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Checklist de Etapas:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {goal.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleMilestoneToggle(goal, m.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          m.completed
                            ? 'bg-muted/30 border-surface-border opacity-60 text-muted-foreground'
                            : 'bg-background/60 border-surface-border hover:border-accent hover:bg-surface-hover text-foreground'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            m.completed
                              ? 'bg-accent border-accent text-white'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {m.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs select-text ${m.completed ? 'line-through' : ''}`}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Send next milestone to Today */}
              {nextMilestone && goal.status !== 'completed' && (
                <div className="pt-2 flex items-center justify-between bg-accent-soft/40 -mx-5 -mb-5 p-3 px-5 rounded-b-2xl border-t border-accent/10">
                  <div className="flex items-center gap-2 text-xs text-accent-text truncate pr-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Próximo passo: <b>{nextMilestone.title}</b>
                    </span>
                  </div>
                  <button
                    onClick={() => onSendMilestoneToToday(`${goal.title}: ${nextMilestone.title}`, goal.category)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shrink-0 shadow-sm"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Fazer Hoje</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="p-12 text-center bg-surface/50 border border-dashed border-surface-border rounded-3xl space-y-3">
            <Compass className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-semibold text-foreground">Nenhuma meta nesta categoria</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Adicione suas ambições de carreira, estudos ou finanças para acompanhar o progresso.
            </p>
          </div>
        )}
      </div>

      {/* Goal Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingGoal ? 'Editar Meta de Vida' : 'Nova Meta de Vida'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Título da Meta *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Aprender Swift, Dominar AWS, Fazer Mestrado..."
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-surface-border text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Por que isso é importante para você? (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivo principal e motivação..."
                  className="w-full px-4 py-2 rounded-xl bg-background border border-surface-border text-foreground text-sm resize-none focus:outline-none focus:border-accent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Nível de Prioridade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      priority === 'high'
                        ? 'bg-red-500/15 border-red-500/40 text-red-400 font-semibold'
                        : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                    }`}
                  >
                    🔴 Alta (P1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      priority === 'medium'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-semibold'
                        : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                    }`}
                  >
                    🟡 Média (P2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      priority === 'low'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                        : 'border-surface-border text-muted-foreground hover:bg-surface-hover'
                    }`}
                  >
                    🟢 Baixa (P3)
                  </button>
                </div>
              </div>

              {/* Milestone Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Etapas / Checkpoints (Subtarefas)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMilestoneInput}
                    className="text-xs text-accent-text hover:underline font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Etapa
                  </button>
                </div>

                <div className="space-y-2">
                  {milestoneInputs.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 font-mono">{idx + 1}.</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleMilestoneInputChange(idx, e.target.value)}
                        placeholder={`Etapa ${idx + 1} (ex: Sintaxe básica, Projeto prático...)`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-foreground focus:outline-none focus:border-accent"
                      />
                      {milestoneInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestoneInput(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
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
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-lg shadow-accent/20 disabled:opacity-40"
                >
                  {editingGoal ? 'Salvar Meta' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
