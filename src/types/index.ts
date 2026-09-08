export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (horário agendado ou limite)
  priority: PriorityLevel;
  category?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  user_id?: string;
}

export interface LifeGoal {
  id: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  category?: string;
  milestones: Milestone[];
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  user_id?: string;
}

export interface Habit {
  id: string;
  title: string;
  icon?: string;
  streak: number;
  completed_dates: string[]; // YYYY-MM-DD
  created_at: string;
  user_id?: string;
}

export interface UserSettings {
  daily_cutoff_time: string; // ex: "21:00"
  notifications_enabled: boolean;
  sound_enabled: boolean;
  theme: 'dark' | 'oled' | 'light';
  sync_enabled: boolean;
  supabase_url?: string;
  supabase_key?: string;
  user_id: string; // Unique sync identifier
}

export type ViewMode = 'today' | 'life' | 'calendar' | 'habits' | 'focus' | 'settings';
