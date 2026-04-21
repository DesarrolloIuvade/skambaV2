export const TASKS_UPDATED_EVENT = 'skamba:tareas-updated';

export interface TasksUpdatedDetail {
  proIde: string;
  source?: string;
  pendingCount?: number;
}

export function emitTasksUpdated(detail: TasksUpdatedDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TasksUpdatedDetail>(TASKS_UPDATED_EVENT, { detail }),
  );
}
