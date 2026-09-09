import type { Task } from '../types';
import { sound } from './sound';
import { getTodayString } from './dates';

export class NotificationManager {
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Current permission state
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  static async notify(title: string, body: string, options?: NotificationOptions) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    sound.playAlert();

    const defaultOptions: NotificationOptions = {
      body,
      icon: '/icon-192.png',
      badge: '/icon.svg',
      tag: 'planner-alert',
      ...options,
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (e) {
      console.error('Erro ao disparar notificação:', e);
    }
  }

  // Check if pending tasks exist for cutoff time
  static checkDailyCutoff(tasks: Task[], cutoffTime: string) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const todayStr = getTodayString();
    const pendingToday = tasks.filter((t) => t.date === todayStr && !t.completed);

    if (pendingToday.length === 0) return;

    const now = new Date();
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
    
    // Check if current time is equal to or past cutoff time
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const isCutoffReached = 
      currentHours > cutoffHours || 
      (currentHours === cutoffHours && currentMinutes >= cutoffMinutes);

    // Prevent spamming notification: save last alert timestamp in sessionStorage
    const lastAlertKey = `planner_cutoff_alert_${todayStr}`;
    const alreadyAlerted = sessionStorage.getItem(lastAlertKey);

    if (isCutoffReached && !alreadyAlerted) {
      this.notify(
        '⚠️ Tarefas Pendentes de Hoje',
        `Você ainda tem ${pendingToday.length} ${pendingToday.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'} para concluir antes de encerrar o dia!`,
        { tag: 'daily-cutoff' }
      );
      sessionStorage.setItem(lastAlertKey, 'true');
    }
  }

  // Check specific task time limits (e.g. 15 minutes before or exactly on time)
  static checkTaskDeadlines(tasks: Task[]) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const todayStr = getTodayString();
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    tasks.forEach((task) => {
      if (task.date === todayStr && !task.completed && task.time) {
        const [taskHours, taskMinutes] = task.time.split(':').map(Number);
        const taskTotalMinutes = taskHours * 60 + taskMinutes;
        const diff = taskTotalMinutes - currentTotalMinutes;

        const alertKey = `planner_task_alert_${task.id}_${todayStr}`;
        if (sessionStorage.getItem(alertKey)) return;

        // Trigger on exact time or within 5 minutes overdue
        if (diff === 0 || (diff < 0 && diff >= -5)) {
          this.notify(
            '⏰ Hora da Tarefa!',
            `Chegou a hora de: "${task.title}" (Horário: ${task.time})`,
            { tag: `task-${task.id}` }
          );
          sessionStorage.setItem(alertKey, 'true');
        } else if (diff === 15) {
          this.notify(
            '⏳ Lembrete em 15 min',
            `Sua tarefa "${task.title}" está agendada para às ${task.time}.`,
            { tag: `task-15m-${task.id}` }
          );
        }
      }
    });
  }
}
