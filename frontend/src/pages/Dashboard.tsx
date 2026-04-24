import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, CheckCircle2, Circle, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import TaskModal, { Task } from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ label, value, icon, accentClass }: { label: string; value: number; icon: React.ReactNode; accentClass: string }) {
  return (
    <div className={`stat-card ${accentClass}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PriorityDot({ p }: { p: string }) {
  const bg = p === 'HIGH' ? '#FC6454' : p === 'MEDIUM' ? '#e8c000' : '#1a7a4a';
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: bg, display: 'inline-block', marginRight: 5, flexShrink: 0 }} />;
}

function KanbanCard({ task, onEdit, onDelete, canEdit }: { task: Task; onEdit: (t: Task) => void; onDelete: (t: Task) => void; canEdit: boolean }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  return (
    <div className="task-card" onClick={() => canEdit && onEdit(task)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div className="task-card-title" style={{ display: 'flex', alignItems: 'center' }}>
          <PriorityDot p={task.priority} />{task.title}
        </div>
        {canEdit && (
          <div className="task-card-actions" onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}><Pencil size={13} /></button>
            <button className="btn btn-ghost btn-sm" style={{ color: '#FC6454' }} onClick={() => onDelete(task)}><Trash2 size={13} /></button>
          </div>
        )}
      </div>
      {task.description && <div className="task-card-desc">{task.description}</div>}
      <div className="task-card-meta">
        {task.dueDate && (
          <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
            <Clock size={11} />{isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.assignee && (
          <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 500 }}>→ {task.assignee.name || task.assignee.email}</span>
        )}
      </div>
    </div>
  );
}

const COLS = [
  { key: 'TODO', label: 'To Do', colClass: 'col-todo', icon: <Circle size={14} /> },
  { key: 'IN_PROGRESS', label: 'In Progress', colClass: 'col-progress', icon: <Clock size={14} /> },
  { key: 'DONE', label: 'Done', colClass: 'col-done', icon: <CheckCircle2 size={14} /> },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try { const r = await api.get('/tasks'); setTasks(r.data); } catch { addToast('Failed to load tasks', 'error'); } finally { setLoading(false); }
  }, []);

  const fetchActivity = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    try { const r = await api.get('/tasks/audit'); setActivity(r.data.slice(0, 8)); } catch {}
  }, [user]);

  useEffect(() => { fetchTasks(); fetchActivity(); }, [fetchTasks, fetchActivity]);

  const handleSave = (saved: Task) => {
    setTasks(prev => { const e = prev.find(t => t.id === saved.id); return e ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]; });
    setModal({ open: false, task: null });
    addToast(modal.task ? 'Task updated ✓' : 'Task created ✓', 'success');
    fetchActivity();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${deleteTarget.id}`);
      setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
      addToast('Task deleted', 'success');
      fetchActivity();
    } catch (e: any) { addToast(e.response?.data?.error || 'Delete failed', 'error'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const canEdit = (t: Task) => user?.role === 'ADMIN' || t.creatorId === user?.id;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{user?.organization?.name || 'Dashboard'}</h1>
          <p className="page-header-sub">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋  &nbsp;·&nbsp; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button className="btn btn-primary" id="new-task-btn" onClick={() => setModal({ open: true, task: null })}>
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total" value={tasks.length} accentClass="accent-dark" icon={<Circle size={20} color="#282828" />} />
        <StatCard label="To Do" value={tasks.filter(t => t.status === 'TODO').length} accentClass="accent-coral" icon={<Circle size={20} color="#FC6454" />} />
        <StatCard label="In Progress" value={tasks.filter(t => t.status === 'IN_PROGRESS').length} accentClass="accent-yellow" icon={<Clock size={20} color="#e8c000" />} />
        <StatCard label="Done" value={tasks.filter(t => t.status === 'DONE').length} accentClass="accent-mint" icon={<CheckCircle2 size={20} color="#1a7a4a" />} />
        {overdue > 0 && <StatCard label="Overdue" value={overdue} accentClass="accent-coral" icon={<AlertCircle size={20} color="#FC6454" />} />}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: activity.length ? '1fr 290px' : '1fr', gap: 20, alignItems: 'start' }}>
          <div className="board">
            {COLS.map(col => (
              <div key={col.key} className={`kanban-column ${col.colClass}`}>
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{col.icon} {col.label}</span>
                  <span className="kanban-count">{tasks.filter(t => t.status === col.key).length}</span>
                </div>
                {tasks.filter(t => t.status === col.key).map(t => (
                  <KanbanCard key={t.id} task={t} onEdit={t2 => setModal({ open: true, task: t2 })} onDelete={setDeleteTarget} canEdit={canEdit(t)} />
                ))}
                {tasks.filter(t => t.status === col.key).length === 0 && (
                  <div className="empty-state" style={{ padding: '28px 12px' }}>
                    <div style={{ fontSize: '1.6rem' }}>📋</div>
                    <div className="empty-state-desc" style={{ marginTop: 8 }}>No tasks here</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {activity.length > 0 && (
            <div className="section-card">
              <div className="section-card-title">Recent Activity</div>
              {activity.map((log: any) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-dot" style={{ background: log.action === 'TASK_CREATED' ? '#1a7a4a' : log.action === 'TASK_DELETED' ? '#FC6454' : '#e8c000' }} />
                  <div>
                    <div className="activity-text">
                      <strong>{log.user?.name || log.user?.email}</strong>{' '}
                      {log.action === 'TASK_CREATED' ? 'created' : log.action === 'TASK_UPDATED' ? 'updated' : 'deleted'}{' '}
                      {log.task ? <em>"{log.task.title}"</em> : <em>a task</em>}
                    </div>
                    <div className="activity-time">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal.open && <TaskModal task={modal.task} onSave={handleSave} onClose={() => setModal({ open: false, task: null })} />}
      {deleteTarget && <ConfirmDialog title="Delete Task" message={`Delete "${deleteTarget.title}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
    </>
  );
}
