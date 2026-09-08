import type { Task, LifeGoal, Habit, UserSettings } from '../types';

const STORAGE_KEYS = {
  TASKS: 'planner_tasks_v1',
  LIFE_GOALS: 'planner_life_goals_v1',
  HABITS: 'planner_habits_v1',
  SETTINGS: 'planner_settings_v1',
};

// Generate an intuitive short pairing ID (e.g. "DAN-9482") for instant pairing
export const generateSyncId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'PLAN-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Default initial tasks and goals for a fantastic first-time experience
const getInitialTasks = (): Task[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'task-1',
      title: 'Planejar as prioridades do dia',
      description: 'Revisar tarefas de hoje e alinhar com metas da semana.',
      date: today,
      time: '09:00',
      priority: 'high',
      category: 'Foco',
      completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Estudar 30 minutos do roadmap de Swift / iOS',
      description: 'Praticar sintaxe moderna de SwiftUI e views declarativas.',
      date: today,
      time: '14:30',
      priority: 'high',
      category: 'Estudos',
      completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Revisar conceitos de arquitetura AWS Cloud Practitioner',
      description: 'Módulos de IAM, S3 e instâncias EC2.',
      date: today,
      time: '18:00',
      priority: 'medium',
      category: 'Estudos',
      completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Fazer caminhada ou treino de 40 min',
      description: 'Saúde física e clareza mental.',
      date: today,
      time: '19:30',
      priority: 'low',
      category: 'Saúde',
      completed: false,
      created_at: new Date().toISOString(),
    },
  ];
};

const getInitialLifeGoals = (): LifeGoal[] => {
  return [
    {
      id: 'goal-1',
      title: 'Dominar Swift & SwiftUI para iOS',
      description: 'Construir aplicativos nativos com arquitetura limpa e publicar na App Store.',
      priority: 'high',
      category: 'Carreira Tech',
      status: 'active',
      created_at: new Date().toISOString(),
      milestones: [
        { id: 'm-1-1', title: 'Fundamentos de Swift (Optionals, Structs, Protocols)', completed: true },
        { id: 'm-1-2', title: 'SwiftUI Layouts e Gerenciamento de Estado (@State, @Binding)', completed: true },
        { id: 'm-1-3', title: 'Integração com APIs REST e Swift Concurrency (async/await)', completed: false },
        { id: 'm-1-4', title: 'Persistência com SwiftData / CoreData', completed: false },
        { id: 'm-1-5', title: 'Publicar primeiro app na App Store', completed: false },
      ],
    },
    {
      id: 'goal-2',
      title: 'Certificação AWS Cloud Practitioner & Solutions Architect',
      description: 'Entender computação em nuvem, segurança, alta disponibilidade e custos na AWS.',
      priority: 'high',
      category: 'Carreira Tech',
      status: 'active',
      created_at: new Date().toISOString(),
      milestones: [
        { id: 'm-2-1', title: 'Conceitos globais de nuvem e modelo de responsabilidade compartilhada', completed: true },
        { id: 'm-2-2', title: 'Computação & Armazenamento (EC2, Lambda, S3, EBS)', completed: false },
        { id: 'm-2-3', title: 'Redes e Segurança (VPC, Security Groups, IAM, WAF)', completed: false },
        { id: 'm-2-4', title: 'Simulado de exame e agendamento da prova', completed: false },
      ],
    },
    {
      id: 'goal-3',
      title: 'Construir Reserva de Emergência de 6 Meses',
      description: 'Garantir estabilidade financeira e tranquilidade com investimentos em liquidez diária.',
      priority: 'medium',
      category: 'Finanças',
      status: 'active',
      created_at: new Date().toISOString(),
      milestones: [
        { id: 'm-3-1', title: 'Calcular custo de vida mensal exato', completed: true },
        { id: 'm-3-2', title: 'Alcançar 3 meses de reserva guardada', completed: false },
        { id: 'm-3-3', title: 'Completar 6 meses de segurança total', completed: false },
      ],
    },
    {
      id: 'goal-4',
      title: 'Fluência em Inglês para Entrevistas Internacionais',
      description: 'Praticar conversação semanal e vocabulário técnico de engenharia de software.',
      priority: 'low',
      category: 'Desenvolvimento Pessoal',
      status: 'active',
      created_at: new Date().toISOString(),
      milestones: [
        { id: 'm-4-1', title: 'Ler documentação e artigos técnicos exclusivamente em inglês', completed: true },
        { id: 'm-4-2', title: 'Assistir palestras tech sem legenda', completed: false },
        { id: 'm-4-3', title: 'Fazer simulado de entrevista técnica em inglês', completed: false },
      ],
    }
  ];
};

const getInitialHabits = (): Habit[] => {
  return [
    {
      id: 'habit-1',
      title: 'Beber 2.5L de água',
      icon: '💧',
      streak: 3,
      completed_dates: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'habit-2',
      title: 'Leitura de 15 páginas',
      icon: '📖',
      streak: 5,
      completed_dates: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'habit-3',
      title: 'Exercício físico / Treino',
      icon: '⚡',
      streak: 2,
      completed_dates: [],
      created_at: new Date().toISOString(),
    },
  ];
};

const getInitialSettings = (): UserSettings => {
  return {
    daily_cutoff_time: '21:00',
    notifications_enabled: true,
    sound_enabled: true,
    theme: 'dark',
    sync_enabled: true,
    user_id: generateSyncId(),
    supabase_url: (import.meta as any).env?.VITE_SUPABASE_URL || undefined,
    supabase_key: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || undefined,
  };
};

export const Storage = {
  getTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        const initial = getInitialTasks();
        Storage.saveTasks(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialTasks();
    }
  },

  saveTasks: (tasks: Task[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Falha ao salvar tarefas no LocalStorage:', e);
    }
  },

  getLifeGoals: (): LifeGoal[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIFE_GOALS);
      if (!data) {
        const initial = getInitialLifeGoals();
        Storage.saveLifeGoals(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialLifeGoals();
    }
  },

  saveLifeGoals: (goals: LifeGoal[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIFE_GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Falha ao salvar metas de vida:', e);
    }
  },

  getHabits: (): Habit[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (!data) {
        const initial = getInitialHabits();
        Storage.saveHabits(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialHabits();
    }
  },

  saveHabits: (habits: Habit[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.error('Falha ao salvar hábitos:', e);
    }
  },

  getSettings: (): UserSettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        const initial = getInitialSettings();
        Storage.saveSettings(initial);
        return initial;
      }
      return { ...getInitialSettings(), ...JSON.parse(data) };
    } catch {
      return getInitialSettings();
    }
  },

  saveSettings: (settings: UserSettings): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Falha ao salvar configurações:', e);
    }
  },

  exportData: (): string => {
    const backup = {
      tasks: Storage.getTasks(),
      lifeGoals: Storage.getLifeGoals(),
      habits: Storage.getHabits(),
      settings: Storage.getSettings(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) Storage.saveTasks(data.tasks);
      if (data.lifeGoals) Storage.saveLifeGoals(data.lifeGoals);
      if (data.habits) Storage.saveHabits(data.habits);
      if (data.settings) Storage.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Erro ao importar backup:', e);
      return false;
    }
  },
};
