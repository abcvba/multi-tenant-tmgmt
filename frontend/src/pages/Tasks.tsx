import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import TaskModal, { Task } from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';

function PriorityPill({ p }: { p: string }) {
  const cls = p === 'HIGH' ? 'pill-high' : p === 'MEDIUM' ? 'pill-medium' : 'pill-low';
  return <span className={`pill ${cls}`}>{p}</span>;
}

function StatusPill({ s }: { s: string }) {
  const cls = s === 'TODO' ? 'pill-todo' : s === 'IN_PROGRESS' ? 'pill-progress' : 'pill-done';
  const label = s === 'IN_PROGRESS' ? 'In Progress' : s === 'TODO' ? 'To Do' : 'Done';
  return <span className={`pill ${cls}`}>{label}</span>;
}

export default function Tasks() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [modal, setModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (search) params.search = search;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch { addToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [filterStatus, filterPriority, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchTasks(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const handleSave = (saved: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === saved.id);
      return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
    });
    setModal({ open: false, task: null });
    addToast(modal.task ? 'Task updated' : 'Task created', 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${deleteTarget.id}`);
      setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
      addToast('Task deleted', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const canEdit = (t: Task) => user?.role === 'ADMIN' || t.creatorId === user?.id;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-header-sub">{tasks.length} task{tasks.length !== 1 ? 's' : ''} in your organization</p>
        </div>
        <button className="btn btn-primary" id="tasks-new-btn" onClick={() => setModal({ open: true, task: null })}>
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input id="task-search" className="form-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="filter-status" className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select id="filter-priority" className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No tasks found</div>
            <div className="empty-state-desc">Create a task or adjust your filters</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
                <th>Creator</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: 2 }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td><StatusPill s={t.status} /></td>
                    <td><PriorityPill p={t.priority} /></td>
                    <td style={{ fontSize: '0.82rem' }}>{t.assignee?.name || t.assignee?.email || <span style={{ color: 'var(--color-text-dim)' }}>—</span>}</td>
                    <td>
                      {t.dueDate ? (
                        <span className={`task-due ${isOverdue ? 'overdue' : ''}`} style={{ display: 'flex' }}>
                          {isOverdue && <Clock size={11} />}
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      ) : <span style={{ color: 'var(--color-text-dim)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{t.creator?.name || t.creator?.email}</td>
                    <td>
                      {canEdit(t) && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setModal({ open: true, task: t })}><Pencil size={13} /></button>
                          <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(t)}><Trash2 size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && <TaskModal task={modal.task} onSave={handleSave} onClose={() => setModal({ open: false, task: null })} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Task"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
