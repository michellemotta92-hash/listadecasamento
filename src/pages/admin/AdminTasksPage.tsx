import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, CircleDashed, Clock3, Plus, Trash2 } from 'lucide-react';
import { EventTask, TaskPriority, TaskStatus } from '@/types';
import { createTask, deleteTask, getTasks, setTaskStatus } from '@/lib/services/tasks';

const columns: Array<{ status: TaskStatus; title: string; icon: typeof CircleDashed }> = [
  { status: 'todo', title: 'A fazer', icon: CircleDashed },
  { status: 'in_progress', title: 'Em andamento', icon: Clock3 },
  { status: 'blocked', title: 'Bloqueadas', icon: CalendarDays },
  { status: 'done', title: 'Concluídas', icon: CheckCircle2 },
];

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium' as TaskPriority,
    visibility: 'internal' as 'internal' | 'client',
  });

  const load = useCallback(async () => {
    try {
      setTasks(await getTasks());
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const overdue = useMemo(
    () => tasks.filter((task) => task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10)).length,
    [tasks]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const task = await createTask({
        ...form,
        title: form.title.trim(),
        due_date: form.due_date || null,
      });
      setTasks((current) => [task, ...current]);
      setForm({ title: '', description: '', due_date: '', priority: 'medium', visibility: 'internal' });
      setShowForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erro ao criar tarefa');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task: EventTask, status: TaskStatus) => {
    try {
      const updated = await setTaskStatus(task, status);
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'A tarefa foi atualizada por outra pessoa');
      await load();
    }
  };

  const remove = async (task: EventTask) => {
    if (!window.confirm(`Excluir a tarefa “${task.title}”?`)) return;
    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erro ao excluir tarefa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-500">Planejamento</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Checklist do evento</h1>
          <p className="mt-1 text-sm text-slate-500">{tasks.length} tarefas · {overdue} atrasadas</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Nova tarefa
        </button>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-500">Título</label>
            <input
              autoFocus required maxLength={240} value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              placeholder="Ex.: Confirmar cardápio com o buffet"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Prazo</label>
            <input type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Prioridade</label>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Visibilidade</label>
            <select value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value as 'internal' | 'client' }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="internal">Só equipe</option><option value="client">Compartilhar com casal</option>
            </select>
          </div>
          <div className="md:col-span-5">
            <label className="mb-1 block text-xs font-medium text-slate-500">Descrição</label>
            <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Notas, contato ou próximo passo" />
          </div>
          <div className="flex items-end">
            <button disabled={saving} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Adicionar'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Carregando planejamento...</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const items = tasks.filter((task) => task.status === column.status);
            return (
              <section key={column.status} className="min-h-52 rounded-2xl bg-slate-100/70 p-3">
                <header className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-2"><column.icon className="h-4 w-4" />{column.title}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{items.length}</span>
                </header>
                <div className="space-y-3">
                  {items.map((task) => (
                    <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-5 text-slate-900">{task.title}</h3>
                        <button type="button" onClick={() => remove(task)} className="text-slate-300 hover:text-red-500" aria-label="Excluir tarefa"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {task.description && <p className="mt-2 text-xs leading-5 text-slate-500">{task.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                        <span className={`rounded-full px-2 py-1 ${priorityStyles[task.priority]}`}>{priorityLabels[task.priority]}</span>
                        {task.visibility === 'client' && <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">Casal</span>}
                      </div>
                      {task.due_date && <p className={`mt-3 text-xs ${task.due_date < new Date().toISOString().slice(0, 10) && task.status !== 'done' ? 'font-medium text-red-600' : 'text-slate-400'}`}>Prazo: {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</p>}
                      <select value={task.status} onChange={(event) => changeStatus(task, event.target.value as TaskStatus)} className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                        {columns.map((option) => <option key={option.status} value={option.status}>{option.title}</option>)}
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </article>
                  ))}
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-400">Nenhuma tarefa</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
