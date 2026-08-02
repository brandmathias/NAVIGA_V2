export const TASK_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua prioritas' },
  { value: 'high', label: 'Prioritas tinggi' },
  { value: 'medium', label: 'Prioritas sedang' },
  { value: 'low', label: 'Prioritas rendah' },
  { value: 'flagged', label: 'Ditandai' },
  { value: 'attachment', label: 'Ada lampiran' },
];

export const TASK_SORT_OPTIONS = [
  { value: 'oldest', label: 'Terlama' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'nearest', label: 'Terdekat' },
];

function hasAttachments(task) {
  return Boolean(task?.attachment || task?.attachments?.length);
}

export function taskMatchesFilter(task, filter) {
  if (filter === 'all') return true;
  if (filter === 'high') return task?.priority === 'tinggi';
  if (filter === 'medium') return task?.priority === 'sedang';
  if (filter === 'low') return task?.priority === 'rendah';
  if (filter === 'flagged') return Boolean(task?.isFlagged);
  return hasAttachments(task);
}

function timestamp(value) {
  if (!value) return null;
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

export function sortTaskIds(taskIds, tasks, sortMode) {
  return [...taskIds].sort((leftId, rightId) => {
    const left = tasks[leftId];
    const right = tasks[rightId];
    const leftTime = timestamp(sortMode === 'nearest' ? left?.dueDate : left?.createdAt);
    const rightTime = timestamp(sortMode === 'nearest' ? right?.dueDate : right?.createdAt);

    if (leftTime === null || rightTime === null) {
      if (leftTime !== rightTime) return leftTime === null ? 1 : -1;
    } else if (leftTime !== rightTime) {
      return sortMode === 'newest' ? rightTime - leftTime : leftTime - rightTime;
    }

    return String(leftId).localeCompare(String(rightId));
  });
}
