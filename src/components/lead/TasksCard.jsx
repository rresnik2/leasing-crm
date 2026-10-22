import { useState } from 'react';

import { addTask, deleteTask, setTaskDone } from '../../data/tasks';
import useTasks from '../../hooks/useTasks';
import Button from '../ui/Button';
import Card from '../ui/Card';
import IconButton from '../ui/IconButton';
import Input from '../ui/Input';
import Skeleton from '../ui/Skeleton';
import { cn } from '../ui/cn';
import { useToast } from '../ui/useToast';
import Icon from './icons';
import { getTaskDueLabel } from './leadPageUtils';

const DUE_TONE_CLASSES = {
  danger: 'text-danger-strong',
  warning: 'text-warning-strong',
  muted: 'text-fg-muted',
};

function TaskRow({ task, onToggle, onDelete }) {
  const due = task.done ? null : getTaskDueLabel(task.dueDate);
  const inputId = `task-${task.id}`;
  return (
    <li className="flex items-start gap-3 py-2.5">
      <input
        id={inputId}
        type="checkbox"
        checked={Boolean(task.done)}
        onChange={(e) => onToggle(task, e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-control border-line-strong accent-brand focus-ring"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className={cn('break-words text-body', task.done ? 'text-fg-muted line-through' : 'text-fg')}>
          {task.title}
        </label>
        {due && <p className={cn('text-caption', DUE_TONE_CLASSES[due.tone])}>{due.label}</p>}
      </div>
      <IconButton size="sm" label={`Delete task: ${task.title}`} onClick={() => onDelete(task)}>
        <Icon name="trash" />
      </IconButton>
    </li>
  );
}

export default function TasksCard({ lead }) {
  const { toast } = useToast();
  const { tasks, loading, error } = useTasks(lead.id);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adding, setAdding] = useState(false);

  const run = async (action, failure) => {
    try {
      await action();
      return true;
    } catch (err) {
      console.error(failure, err);
      toast({ tone: 'danger', title: failure });
      return false;
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    const text = title.trim();
    if (!text || adding) return;
    setAdding(true);
    const ok = await run(() => addTask(lead.id, { title: text, dueDate }), "Couldn't add task");
    setAdding(false);
    if (ok) {
      setTitle('');
      setDueDate('');
    }
  };

  const handleToggle = (task, done) => run(() => setTaskDone(lead.id, task.id, done), "Couldn't update task");
  const handleDelete = (task) => run(() => deleteTask(lead.id, task.id), "Couldn't delete task");

  let list;
  if (loading) {
    list = (
      <div role="status" className="mt-3 space-y-3">
        <span className="sr-only">Loading tasks…</span>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    );
  } else if (error) {
    list = <p className="mt-3 text-body text-danger-strong">Couldn't load tasks.</p>;
  } else if (tasks.length === 0) {
    list = <p className="mt-3 text-body text-fg-muted">No tasks yet.</p>;
  } else {
    list = (
      <ul role="list" className="mt-2 divide-y divide-line">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </ul>
    );
  }

  return (
    <Card>
      <h2 className="text-title text-fg">Tasks</h2>
      {list}
      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
        <Input
          label="New task"
          placeholder="e.g. Send floor plans"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          wrapperClassName="flex-[1_1_10rem]"
        />
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          wrapperClassName="flex-[0_1_9rem]"
        />
        <Button type="submit" variant="secondary" loading={adding} disabled={!title.trim()}>
          Add
        </Button>
      </form>
    </Card>
  );
}
