import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { Navigate } from 'react-router-dom';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  createdAt: string;
  user: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  task?: { id: string; title: string } | null;
}

function ActionBadge({ action }: { action: string }) {
  if (action === 'TASK_CREATED') return <span className="pill pill-done">Created</span>;
  if (action === 'TASK_UPDATED') return <span className="pill pill-progress">Updated</span>;
  if (action === 'TASK_DELETED') return <span className="pill" style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--color-danger)' }}>Deleted</span>;
  return <span className="pill">{action}</span>;
}

export default function AuditLog() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    api.get('/tasks/audit')
      .then(r => setLogs(r.data))
      .catch(() => addToast('Failed to load audit logs', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterAction ? logs.filter(l => l.action === filterAction) : logs;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p className="page-header-sub">Track all changes in your organization</p>
        </div>
        <select className="filter-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All actions</option>
          <option value="TASK_CREATED">Created</option>
          <option value="TASK_UPDATED">Updated</option>
          <option value="TASK_DELETED">Deleted</option>
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert size={40} style={{ marginBottom: 12, color: 'var(--color-text-dim)' }} />
            <div className="empty-state-title">No audit events</div>
            <div className="empty-state-desc">Activity will appear here as your team works</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Task</th>
                <th>By</th>
                <th>Details</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td><ActionBadge action={log.action} /></td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {log.task ? (
                      <span style={{ fontWeight: 500 }}>{log.task.title}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-dim)' }}>
                        {log.details?.title || <em>Deleted task</em>}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{log.user?.name || log.user?.email}</div>
                    {log.user?.name && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{log.user.email}</div>}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', maxWidth: 200 }}>
                    {log.details ? (
                      <span>{log.details.status ? `Status: ${log.details.status}` : ''}{log.details.priority ? ` · ${log.details.priority}` : ''}</span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap' }}>
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
