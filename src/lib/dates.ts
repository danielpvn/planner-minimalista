/**
 * Date utilities for local timezone safety (immune to UTC offset issues)
 */

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = (): string => getLocalDateString(new Date());

export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const formatFriendlyDate = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayAndMonth = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayAndMonth}`;
};

export const addDaysToDateString = (dateStr: string, days: number): string => {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
};
