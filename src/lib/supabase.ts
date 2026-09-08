import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Task, LifeGoal, Habit } from '../types';

let supabaseClient: SupabaseClient | null = null;

export const initSupabase = (url?: string, key?: string): SupabaseClient | null => {
  if (!url || !key) {
    supabaseClient = null;
    return null;
  }
  try {
    supabaseClient = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return supabaseClient;
  } catch (err) {
    console.error('Falha ao inicializar Supabase:', err);
    supabaseClient = null;
    return null;
  }
};

export const getSupabase = (): SupabaseClient | null => supabaseClient;

// Authentication Services
export const AuthServices = {
  async signInWithEmail(email: string, password: string) {
    if (!supabaseClient) throw new Error('Supabase não configurado.');
    return await supabaseClient.auth.signInWithPassword({ email, password });
  },

  async signUpWithEmail(email: string, password: string) {
    if (!supabaseClient) throw new Error('Supabase não configurado.');
    return await supabaseClient.auth.signUp({ email, password });
  },

  async signInWithMagicLink(email: string) {
    if (!supabaseClient) throw new Error('Supabase não configurado.');
    return await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  },

  async signInWithGoogle() {
    if (!supabaseClient) throw new Error('Supabase não configurado.');
    return await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  },

  async signOut() {
    if (!supabaseClient) return;
    return await supabaseClient.auth.signOut();
  },

  async getUser() {
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
  },

  async getSession() {
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabaseClient) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabaseClient.auth.onAuthStateChange(callback);
  },
};

// Sync service that handles cloud pull/push and realtime listener
export class CloudSync {
  private static listeners: Array<(status: 'synced' | 'syncing' | 'offline' | 'error') => void> = [];

  static subscribeStatus(callback: (status: 'synced' | 'syncing' | 'offline' | 'error') => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private static emitStatus(status: 'synced' | 'syncing' | 'offline' | 'error') {
    this.listeners.forEach((cb) => cb(status));
  }

  // Push local changes to Supabase
  static async pushTasks(tasks: Task[], userId: string) {
    if (!supabaseClient) return;
    try {
      this.emitStatus('syncing');
      const payload = tasks.map((t) => ({ ...t, user_id: userId }));
      const { error } = await supabaseClient.from('tasks').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      this.emitStatus('synced');
    } catch (err) {
      console.warn('Erro ao sincronizar tarefas no Supabase:', err);
      this.emitStatus('error');
    }
  }

  static async pushLifeGoals(goals: LifeGoal[], userId: string) {
    if (!supabaseClient) return;
    try {
      this.emitStatus('syncing');
      const payload = goals.map((g) => ({ ...g, user_id: userId }));
      const { error } = await supabaseClient.from('life_goals').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      this.emitStatus('synced');
    } catch (err) {
      console.warn('Erro ao sincronizar metas no Supabase:', err);
      this.emitStatus('error');
    }
  }

  static async pushHabits(habits: Habit[], userId: string) {
    if (!supabaseClient) return;
    try {
      this.emitStatus('syncing');
      const payload = habits.map((h) => ({ ...h, user_id: userId }));
      const { error } = await supabaseClient.from('habits').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      this.emitStatus('synced');
    } catch (err) {
      console.warn('Erro ao sincronizar hábitos no Supabase:', err);
      this.emitStatus('error');
    }
  }

  // Pull all data from Supabase
  static async pullAll(userId: string): Promise<{
    tasks?: Task[];
    lifeGoals?: LifeGoal[];
    habits?: Habit[];
  } | null> {
    if (!supabaseClient) return null;
    try {
      this.emitStatus('syncing');
      const [tasksRes, goalsRes, habitsRes] = await Promise.all([
        supabaseClient.from('tasks').select('*').eq('user_id', userId),
        supabaseClient.from('life_goals').select('*').eq('user_id', userId),
        supabaseClient.from('habits').select('*').eq('user_id', userId),
      ]);

      this.emitStatus('synced');
      return {
        tasks: tasksRes.data || undefined,
        lifeGoals: goalsRes.data || undefined,
        habits: habitsRes.data || undefined,
      };
    } catch (err) {
      console.warn('Erro ao puxar dados da nuvem:', err);
      this.emitStatus('error');
      return null;
    }
  }

  // Subscribe to realtime database changes
  static subscribeRealtime(
    userId: string,
    onTaskChange: (payload: any) => void,
    onGoalChange: (payload: any) => void
  ) {
    if (!supabaseClient) return () => {};

    const channel = supabaseClient
      .channel(`realtime-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        onTaskChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'life_goals', filter: `user_id=eq.${userId}` },
        onGoalChange
      )
      .subscribe();

    return () => {
      supabaseClient?.removeChannel(channel);
    };
  }
}
