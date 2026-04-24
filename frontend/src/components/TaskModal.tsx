import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string | null;
  creatorId: string;
  assigneeId?: string | null;
  creator?: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  assignee?: { id: string; name?: string | null; email: string; avatarUrl?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Member { id: string; name?: string | null; email: string; }

interface Props {
  task?: Task | null;
  onSave: (task: Task) => void;
  onClose: () => void;
}

export default function TaskModal({ task, onSave, onClose }: Props) {
  const { user } = useAuth();
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId || '',
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setMembers(r.data)).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      };
      const res = isEdit
        ? await api.put(`/tasks/${task!.id}`, payload)
        : await api.post('/tasks', payload);
      onSave(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isOwnerOrAdmin = !isEdit || user?.role === 'ADMIN' || task?.creatorId === user?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Task title..." disabled={!isOwnerOrAdmin} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Optional details..." disabled={!isOwnerOrAdmin} />
          </div>

          <div className="form-input-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)} disabled={!isOwnerOrAdmin}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)} disabled={!isOwnerOrAdmin}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="form-input-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} disabled={!isOwnerOrAdmin} />
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-input" value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)} disabled={!isOwnerOrAdmin}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            {isOwnerOrAdmin && (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
