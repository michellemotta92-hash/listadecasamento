import { api } from '@/lib/api';
import { EventTask, TaskPriority, TaskStatus } from '@/types';

export function getTasks(): Promise<EventTask[]> {
  return api.get<EventTask[]>('/tasks');
}

export function createTask(input: {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string | null;
  visibility?: 'internal' | 'client';
}): Promise<EventTask> {
  return api.post<EventTask>('/tasks', input);
}

export function updateTask(
  task: EventTask,
  updates: Partial<Pick<EventTask, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'visibility'>>
): Promise<EventTask> {
  return api.patch<EventTask>(`/tasks/${task.id}`, { ...updates, version: task.version });
}

export function setTaskStatus(task: EventTask, status: TaskStatus): Promise<EventTask> {
  return updateTask(task, { status });
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
