import React, { useState, useEffect, useCallback } from 'react';
import type { 
  Task, 
  LifeGoal, 
  Habit, 
  UserSettings, 
  ViewMode, 
  PriorityLevel 
} from './types';
import { Storage } from './lib/storage';
import { NotificationManager } from './lib/notifications';
import { initSupabase, CloudSync } from './lib/supabase';
import { Navbar } from './components/layout/Navbar';
import { Header } from './components/layout/Header';
import { DailyPlanner } from './components/today/DailyPlanner';
import { LifeGoals } from './components/life/LifeGoals';
import { CalendarView } from './components/calendar/CalendarView';
import { HabitTracker } from './components/habits/HabitTracker';
import { FocusTimer } from './components/focus/FocusTimer';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskModal } from './components/modals/TaskModal';

export const App: React.FC = () => {
  // State Initialization
  const [tasks, setTasks] = useState<Task[]>(() => Storage.getTasks());
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>(() => Storage.getLifeGoals());
  const [habits, setHabits] = useState<Habit[]>(() => Storage.getHabits());
  const [settings, setSettings] = useState<UserSettings>(() => Storage.getSettings());

  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDate, setModalDate] = useState<string>(selectedDate);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-oled', 'theme-light');
    if (settings.theme === 'oled') {
      root.classList.add('theme-oled');
    } else if (settings.theme === 'light') {
      root.classList.add('theme-light');
    }
  }, [settings.theme]);

  // Initialize Supabase if keys provided
  useEffect(() => {
    if (settings.supabase_url && settings.supabase_key) {
      initSupabase(settings.supabase_url, settings.supabase_key);
      // Pull initial cloud data
      CloudSync.pullAll(settings.user_id).then((cloudData) => {
        if (cloudData) {
          if (cloudData.tasks) {
            setTasks(cloudData.tasks);
            Storage.saveTasks(cloudData.tasks);
          }
          if (cloudData.lifeGoals) {
            setLifeGoals(cloudData.lifeGoals);
            Storage.saveLifeGoals(cloudData.lifeGoals);
          }
          if (cloudData.habits) {
            setHabits(cloudData.habits);
            Storage.saveHabits(cloudData.habits);
          }
        }
      });

      // Subscribe to realtime updates
      const unsubscribe = CloudSync.subscribeRealtime(
        settings.user_id,
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setTasks((prev) => {
              const updated = prev.some((t) => t.id === payload.new.id)
                ? prev.map((t) => (t.id === payload.new.id ? payload.new : t))
                : [payload.new, ...prev];
              Storage.saveTasks(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => {
              const updated = prev.filter((t) => t.id !== payload.old.id);
              Storage.saveTasks(updated);
              return updated;
            });
          }
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setLifeGoals((prev) => {
              const updated = prev.some((g) => g.id === payload.new.id)
                ? prev.map((g) => (g.id === payload.new.id ? payload.new : g))
                : [payload.new, ...prev];
              Storage.saveLifeGoals(updated);
              return updated;
            });
          }
        }
      );

      const unsubStatus = CloudSync.subscribeStatus(setSyncStatus);
      return () => {
        unsubscribe();
        unsubStatus();
      };
    } else {
      setSyncStatus('offline');
    }
  }, [settings.supabase_url, settings.supabase_key, settings.user_id]);

  // Periodic Reminder & Cutoff Alarm Checks
  useEffect(() => {
    if (!settings.notifications_enabled) return;

    const checkAlarms = () => {
      NotificationManager.checkDailyCutoff(tasks, settings.daily_cutoff_time);
      NotificationManager.checkTaskDeadlines(tasks);
    };

    checkAlarms(); // Check immediately on mount
    const interval = setInterval(checkAlarms, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks, settings.daily_cutoff_time, settings.notifications_enabled]);

  // Global Keyboard Shortcuts (N for New Task, 1-5 for views)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTask(null);
        setModalDate(selectedDate);
        setIsTaskModalOpen(true);
      } else if (e.key === '1') {
        setCurrentView('today');
      } else if (e.key === '2') {
        setCurrentView('life');
      } else if (e.key === '3') {
        setCurrentView('calendar');
      } else if (e.key === '4') {
        setCurrentView('habits');
      } else if (e.key === '5') {
        setCurrentView('focus');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate]);

  // Tasks Handlers
  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === id) {
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return task;
      });
      Storage.saveTasks(updated);
      CloudSync.pushTasks(updated, settings.user_id);
      return updated;
    });
  }, [settings.user_id]);

  const handleSaveTask = useCallback(
    (taskData: Omit<Task, 'id' | 'completed' | 'created_at'> & { id?: string }) => {
      setTasks((prev) => {
        let updated: Task[];
        if (taskData.id) {
          // Edit existing
          updated = prev.map((t) =>
            t.id === taskData.id
              ? {
                  ...t,
                  ...taskData,
                }
              : t
          );
        } else {
          // Create new
          const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: taskData.title,
            description: taskData.description,
            date: taskData.date,
            time: taskData.time,
            priority: taskData.priority,
            category: taskData.category,
            completed: false,
            created_at: new Date().toISOString(),
          };
          updated = [newTask, ...prev];
        }

        Storage.saveTasks(updated);
        CloudSync.pushTasks(updated, settings.user_id);
        return updated;
      });
    },
    [settings.user_id]
  );

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      Storage.saveTasks(updated);
      CloudSync.pushTasks(updated, settings.user_id);
      return updated;
    });
  }, [settings.user_id]);

  const handleQuickAddTask = useCallback(
    (title: string, priority: PriorityLevel, time?: string) => {
      handleSaveTask({
        title,
        priority,
        time,
        date: selectedDate,
        category: 'Pessoal',
      });
    },
    [handleSaveTask, selectedDate]
  );

  const handleReorderTasks = useCallback(
    (reorderedTasks: Task[]) => {
      setTasks(reorderedTasks);
      Storage.saveTasks(reorderedTasks);
      CloudSync.pushTasks(reorderedTasks, settings.user_id);
    },
    [settings.user_id]
  );

  // Life Goals Handlers
  const handleAddLifeGoal = useCallback(
    (goalData: Omit<LifeGoal, 'id' | 'created_at'>) => {
      setLifeGoals((prev) => {
        const newGoal: LifeGoal = {
          ...goalData,
          id: `goal-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        const updated = [newGoal, ...prev];
        Storage.saveLifeGoals(updated);
        CloudSync.pushLifeGoals(updated, settings.user_id);
        return updated;
      });
    },
    [settings.user_id]
  );

  const handleUpdateLifeGoal = useCallback((updatedGoal: LifeGoal) => {
    setLifeGoals((prev) => {
      const updated = prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
      Storage.saveLifeGoals(updated);
      CloudSync.pushLifeGoals(updated, settings.user_id);
      return updated;
    });
  }, [settings.user_id]);

  const handleDeleteLifeGoal = useCallback((id: string) => {
    setLifeGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      Storage.saveLifeGoals(updated);
      CloudSync.pushLifeGoals(updated, settings.user_id);
      return updated;
    });
  }, [settings.user_id]);

  const handleReorderLifeGoals = useCallback(
    (reorderedGoals: LifeGoal[]) => {
      setLifeGoals(reorderedGoals);
      Storage.saveLifeGoals(reorderedGoals);
      CloudSync.pushLifeGoals(reorderedGoals, settings.user_id);
    },
    [settings.user_id]
  );

  const handleSendMilestoneToToday = useCallback(
    (title: string, category?: string) => {
      const todayStr = new Date().toISOString().split('T')[0];
      handleSaveTask({
        title,
        priority: 'high',
        date: todayStr,
        category: category || 'Metas de Vida',
      });
      setCurrentView('today');
      setSelectedDate(todayStr);
    },
    [handleSaveTask]
  );

  // Habits Handlers
  const handleAddHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'created_at'>) => {
      setHabits((prev) => {
        const newHabit: Habit = {
          ...habitData,
          id: `habit-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        const updated = [newHabit, ...prev];
        Storage.saveHabits(updated);
        CloudSync.pushHabits(updated, settings.user_id);
        return updated;
      });
    },
    [settings.user_id]
  );

  const handleToggleHabitForToday = useCallback((id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setHabits((prev) => {
      const updated = prev.map((h) => {
        if (h.id === id) {
          const isDone = h.completed_dates.includes(todayStr);
          const newCompletedDates = isDone
            ? h.completed_dates.filter((d) => d !== todayStr)
            : [...h.completed_dates, todayStr];
          const newStreak = isDone ? Math.max(0, h.streak - 1) : h.streak + 1;
          return {
            ...h,
            completed_dates: newCompletedDates,
            streak: newStreak,
          };
        }
        return h;
      });
      Storage.saveHabits(updated);
      CloudSync.pushHabits(updated, settings.user_id);
      return updated;
    });
  }, [settings.user_id]);

  const handleDeleteHabit = useCallback((id: string) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      Storage.saveHabits(updated);
      CloudSync.pushHabits(updated, settings.user_id);
      return updated;
    });
  }, [settings.user_id]);

  const handleReorderHabits = useCallback(
    (reorderedHabits: Habit[]) => {
      setHabits(reorderedHabits);
      Storage.saveHabits(reorderedHabits);
      CloudSync.pushHabits(reorderedHabits, settings.user_id);
    },
    [settings.user_id]
  );

  // Settings Handlers
  const handleUpdateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  }, []);

  const handleToggleNotifications = async () => {
    if (!settings.notifications_enabled) {
      const granted = await NotificationManager.requestPermission();
      if (granted || Notification.permission === 'granted') {
        handleUpdateSettings({ ...settings, notifications_enabled: true });
        NotificationManager.notify(
          '🔔 Notificações Ativadas!',
          'Você receberá lembretes das suas tarefas e do horário limite do dia.'
        );
      }
    } else {
      handleUpdateSettings({ ...settings, notifications_enabled: false });
    }
  };

  // Stats for Header
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const todayPendingCount = todayTasks.filter((t) => !t.completed).length;
  const todayCompletedCount = todayTasks.filter((t) => t.completed).length;
  const progressPercent =
    todayTasks.length > 0 ? Math.round((todayCompletedCount / todayTasks.length) * 100) : 0;

  // View titles & subtitles
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'today':
        return {
          title: 'Hoje',
          subtitle: `${todayPendingCount} ${todayPendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'} para concluir hoje`,
        };
      case 'life':
        return {
          title: 'Metas de Vida',
          subtitle: 'Seus objetivos de longo prazo organizados por prioridade',
        };
      case 'calendar':
        return {
          title: 'Calendário Mensal',
          subtitle: 'Planeje e visualize suas tarefas para qualquer dia do mês',
        };
      case 'habits':
        return {
          title: 'Hábitos Diários',
          subtitle: 'Mantenha a consistência em suas rotinas fundamentais',
        };
      case 'focus':
        return {
          title: 'Modo Foco',
          subtitle: 'Temporizador Pomodoro para execução com máxima concentração',
        };
      case 'settings':
        return {
          title: 'Configurações',
          subtitle: 'Sincronização com iPhone, notificações e preferências',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* Sidebar / Bottom Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        syncStatus={syncStatus}
        todayPendingCount={todayPendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 sm:p-8 md:p-10 max-w-5xl mx-auto w-full overflow-y-auto min-h-screen">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onAddTask={() => {
            setEditingTask(null);
            setModalDate(selectedDate);
            setIsTaskModalOpen(true);
          }}
          notificationsEnabled={settings.notifications_enabled}
          onToggleNotifications={handleToggleNotifications}
          progressPercent={currentView === 'today' ? progressPercent : undefined}
        />

        {/* View Router */}
        <div className="pt-6">
          {currentView === 'today' && (
            <DailyPlanner
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onQuickAddTask={handleQuickAddTask}
              onOpenFullModal={() => {
                setEditingTask(null);
                setModalDate(selectedDate);
                setIsTaskModalOpen(true);
              }}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onReorderTasks={handleReorderTasks}
            />
          )}

          {currentView === 'life' && (
            <LifeGoals
              goals={lifeGoals}
              onAddGoal={handleAddLifeGoal}
              onUpdateGoal={handleUpdateLifeGoal}
              onDeleteGoal={handleDeleteLifeGoal}
              onSendMilestoneToToday={handleSendMilestoneToToday}
              onReorderGoals={handleReorderLifeGoals}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onAddTaskForDate={(date) => {
                setEditingTask(null);
                setModalDate(date);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {currentView === 'habits' && (
            <HabitTracker
              habits={habits}
              onAddHabit={handleAddHabit}
              onToggleHabitForToday={handleToggleHabitForToday}
              onDeleteHabit={handleDeleteHabit}
              onReorderHabits={handleReorderHabits}
            />
          )}

          {currentView === 'focus' && (
            <FocusTimer
              tasks={tasks}
              onCompleteTask={handleToggleTask}
            />
          )}

          {currentView === 'settings' && (
            <SettingsModal
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onDataImported={() => {
                setTasks(Storage.getTasks());
                setLifeGoals(Storage.getLifeGoals());
                setHabits(Storage.getHabits());
                setSettings(Storage.getSettings());
              }}
            />
          )}
        </div>
      </main>

      {/* Full Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        editingTask={editingTask}
        defaultDate={modalDate}
      />
    </div>
  );
};
export default App;
