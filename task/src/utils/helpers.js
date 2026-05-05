import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy · h:mm a');
  } catch {
    return '—';
  }
};

export const timeAgo = (date) => {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '—';
  }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
};

export const getDueDateLabel = (dueDate, status) => {
  if (!dueDate) return null;
  if (status === 'done') return { label: formatDate(dueDate), type: 'done' };
  if (isToday(new Date(dueDate))) return { label: 'Due today', type: 'warning' };
  if (isOverdue(dueDate, status)) return { label: `Overdue · ${formatDate(dueDate)}`, type: 'error' };
  return { label: formatDate(dueDate), type: 'normal' };
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export const getAvatarColor = (name = '') => {
  const colors = [
    '#7c6af7', '#10d9a0', '#f59e0b', '#f43f5e',
    '#38bdf8', '#a78bfa', '#34d399', '#fb923c',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const statusOrder = { todo: 0, 'in-progress': 1, review: 2, done: 3 };
export const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };

export const STATUS_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'In Review',
  done: 'Done',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const PROJECT_STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  'on-hold': 'On Hold',
  archived: 'Archived',
};