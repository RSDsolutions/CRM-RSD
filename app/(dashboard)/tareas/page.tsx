import { Metadata } from 'next';
import { getTasksAction } from '@/app/actions/tasks';
import { TaskBoardView } from '@/components/tasks/task-board-view';

export const metadata: Metadata = {
  title: 'Tareas | RSD Solutions CRM',
  description: 'Gestión global y seguimiento de tareas comerciales, técnicas y operativas.',
};

export default async function TareasPage() {
  const tasks = await getTasksAction();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TaskBoardView initialTasks={tasks} />
    </div>
  );
}
