const LEGACY_CREATOR_IDS = new Set(['admin-1', 'admin-2', 'admin-3']);
const LEGACY_CREATOR_NAMES = new Set(['admin 1', 'admin 2', 'admin 3', 'naviga']);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function creatorIsLegacy(task) {
  const userId = String(task?.createdByUserId ?? '').trim().toLowerCase();
  const name = String(task?.createdByName ?? task?.createdBy ?? '').trim().toLowerCase();
  return LEGACY_CREATOR_IDS.has(userId) || LEGACY_CREATOR_NAMES.has(name);
}

function normalizePriority(task) {
  const priority = String(task?.priority ?? '').trim().toLowerCase();
  if (priority === 'tinggi' || priority === 'sedang' || priority === 'rendah') return priority;
  if (priority === 'important' || priority === 'urgent' || priority === 'high') return 'tinggi';
  if (priority === 'medium' || priority === 'normal') return 'sedang';
  if (priority === 'low') return 'rendah';

  const legacyLabels = Array.isArray(task?.labels) ? task.labels.map((label) => String(label).toLowerCase()) : [];
  if (legacyLabels.some((label) => label.includes('penting') || label.includes('urgent') || label.includes('tinggi'))) return 'tinggi';
  if (legacyLabels.some((label) => label.includes('sedang') || label.includes('review') || label.includes('laporan'))) return 'sedang';
  if (legacyLabels.some((label) => label.includes('rendah') || label.includes('rapat'))) return 'rendah';
  return 'sedang';
}

function normalizeCreator(task, fallbackCreator, existingTask, forceCreator) {
  if (existingTask?.createdByUserId && existingTask?.createdByName) {
    return { userId: existingTask.createdByUserId, name: existingTask.createdByName };
  }
  if (!forceCreator && task?.createdByUserId && task?.createdByName && !creatorIsLegacy(task)) {
    return { userId: task.createdByUserId, name: task.createdByName };
  }
  return fallbackCreator;
}

function normalizeTask(task, fallbackCreator, existingTask, forceCreator) {
  const creator = normalizeCreator(task, fallbackCreator, existingTask, forceCreator);
  const createdAt = typeof task?.createdAt === 'string' && task.createdAt.trim()
    ? task.createdAt
    : (typeof task?.dueDate === 'string' && task.dueDate.trim() ? task.dueDate : '1970-01-01T00:00:00.000Z');

  const normalized = {
    ...task,
    priority: normalizePriority(task),
    createdAt,
    createdByUserId: creator.userId,
    createdByName: creator.name,
    createdBy: creator.name,
  };

  if (typeof task?.isFlagged !== 'boolean' && typeof task?.isFavorite === 'boolean') {
    normalized.isFlagged = task.isFavorite;
  }
  delete normalized.labels;
  delete normalized.assignee;
  delete normalized.isFavorite;
  return normalized;
}

export function normalizeTaskBoardData(value, fallbackCreator, options = {}) {
  if (!isRecord(value) || !isRecord(value.tasks) || !isRecord(value.columns) || !Array.isArray(value.columnOrder)) return value;

  const previousTasks = isRecord(options.previousBoardData?.tasks) ? options.previousBoardData.tasks : {};
  const forceCreator = Boolean(options.forceCreator || isRecord(options.previousBoardData?.tasks));
  const tasks = Object.fromEntries(Object.entries(value.tasks).map(([taskId, task]) => [
    taskId,
    normalizeTask(task, fallbackCreator, previousTasks[taskId], forceCreator),
  ]));

  return { ...value, tasks };
}

export function creatorFromSession(session) {
  return { userId: String(session.userId), name: String(session.name).trim() };
}
