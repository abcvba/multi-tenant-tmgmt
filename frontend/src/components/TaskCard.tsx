export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export default function TaskCard({ task }: { task: Task }) {
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'TODO': return 'status-todo';
      case 'IN_PROGRESS': return 'status-progress';
      case 'DONE': return 'status-done';
      default: return 'status-todo';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'TODO': return 'Todo';
      case 'IN_PROGRESS': return 'In Progress';
      case 'DONE': return 'Done';
      default: return status;
    }
  };

  return (
    <div className="task-card">
      <div className="task-title">{task.title}</div>
      <div className="task-desc">{task.description}</div>
      <div className="task-meta">
        <span className={`status-pill ${getStatusClass(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>
    </div>
  );
}
