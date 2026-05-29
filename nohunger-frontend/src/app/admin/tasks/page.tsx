'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getTasks, updateTask, deleteTask } from '@/lib/api/tasks';
import { getVolunteers } from '@/lib/api/volunteers';
import { getActivities } from '@/lib/api/activities';
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  Edit2,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskForm {
  title: string;
  description: string;
  activity_id: string;
  assigned_to: string;
  priority: string;
  due_date: string;
  status: string;
}

const defaultForm: TaskForm = {
  title: '',
  description: '',
  activity_id: '',
  assigned_to: '',
  priority: 'medium',
  due_date: '',
  status: 'todo',
};

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TaskForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [taskData, volData, actData] = await Promise.all([
        getTasks(),
        getVolunteers({ status: 'approved' }),
        getActivities(),
      ]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setVolunteers(Array.isArray(volData) ? volData : (volData?.data ?? []));
      setActivities(Array.isArray(actData) ? actData : []);
    } catch (err) {
      console.log('Tasks fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error('Task title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        activityId: form.activity_id || undefined,
        assignedTo: form.assigned_to || undefined,
        priority: form.priority,
        dueDate: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        status: form.status === 'in_progress' ? 'in-progress' : form.status,
      };

      if (!editId) {
        toast.error('Task creation is disabled. Please select an existing task to edit.');
        setSaving(false);
        return;
      }
      await updateTask(editId, payload);
      toast.success('✅ Task updated successfully. Volunteers will see the latest details now.');

      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Unable to save this task. Please review the values and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (task: any) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      activity_id: task.activity_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      status: task.status || 'todo',
    });
    setEditId(task.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('🗑️ Task deleted. The schedule has been updated.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Unable to delete this task. Please try again later.');
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const priorityColor = (p: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-destructive/10 text-destructive border-destructive/25',
      high: 'bg-warning/10 text-warning border-warning/25',
      medium: 'bg-primary/10 text-primary border-primary/25',
      low: 'bg-muted text-muted-foreground border-border',
    };
    return map[p] || 'bg-muted text-muted-foreground border-border';
  };

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle2 size={14} className="text-success" />;
    if (s === 'in_progress') return <Clock size={14} className="text-primary" />;
    if (s === 'cancelled') return <X size={14} className="text-destructive" />;
    return <AlertTriangle size={14} className="text-warning" />;
  };

  return (
    <AppLayout activePath="/admin/tasks">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Tasks</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Review and manage existing tasks for NoHunger Champions
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground">
            Task creation is disabled in this view.
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'todo', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-600 transition-all border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'}`}
            >
              {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
              <span className="ml-1.5 text-[11px] opacity-70">
                (
                {filter === f
                  ? filtered.length
                  : tasks.filter((t) => f === 'all' || t.status === f).length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-[17px] font-700 text-foreground">
                  {editId ? 'Edit Task' : 'Create Task'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Title *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Task title"
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Task details…"
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">
                      Assign to Champion
                    </label>
                    <select
                      value={form.assigned_to}
                      onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">Unassigned</option>
                      {volunteers.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">
                      Activity
                    </label>
                    <select
                      value={form.activity_id}
                      onChange={(e) => setForm((p) => ({ ...p, activity_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">No activity</option>
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-muted text-muted-foreground font-600 rounded-xl hover:bg-border transition-all text-[13.5px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[13.5px]"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {editId ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-card border border-border rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <ClipboardList size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] font-600 text-foreground">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="bg-card border border-border rounded-2xl shadow-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">{statusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[14px] font-700 text-foreground">{task.title}</p>
                        <span
                          className={`text-[10px] font-700 px-2 py-0.5 rounded-full border uppercase tracking-wide ${priorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[12.5px] text-muted-foreground mb-2 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {task.user_profiles && (
                          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <User size={12} />
                            <span>{task.user_profiles.full_name}</span>
                          </div>
                        )}
                        {task.activities && (
                          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <ClipboardList size={12} />
                            <span className="truncate max-w-[150px]">{task.activities.title}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <Clock size={12} />
                            <span>
                              Due{' '}
                              {new Date(task.due_date).toLocaleDateString('en', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
