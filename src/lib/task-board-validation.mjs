export const MAX_TASK_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

const MAX_COLUMNS = 20;
const MAX_TASKS = 500;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_ATTACHMENTS = 20;
const TASK_PRIORITIES = new Set(['tinggi', 'sedang', 'rendah']);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validString(value, { min = 0, max }) {
  return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}

function invalid(message) {
  return { valid: false, message };
}

function validateAttachment(attachment) {
  return isRecord(attachment)
    && validString(attachment.id, { min: 1, max: 200 })
    && validString(attachment.name, { min: 1, max: 255 })
    && validString(attachment.type, { max: 120 })
    && Number.isInteger(attachment.size)
    && attachment.size >= 0
    && attachment.size <= MAX_TASK_ATTACHMENT_SIZE_BYTES;
}

export function validateTaskBoardData(value) {
  if (!isRecord(value) || !isRecord(value.tasks) || !isRecord(value.columns) || !Array.isArray(value.columnOrder)) {
    return invalid('Struktur board tugas tidak valid.');
  }

  const columnIds = Object.keys(value.columns);
  const taskIds = Object.keys(value.tasks);
  if (columnIds.length === 0 || columnIds.length > MAX_COLUMNS) return invalid('Jumlah kolom tugas tidak valid.');
  if (taskIds.length > MAX_TASKS) return invalid('Jumlah tugas melebihi batas yang diizinkan.');
  if (value.columnOrder.length !== columnIds.length || new Set(value.columnOrder).size !== columnIds.length) {
    return invalid('Urutan kolom tugas tidak valid.');
  }
  if (value.columnOrder.some((columnId) => typeof columnId !== 'string' || !Object.hasOwn(value.columns, columnId))) {
    return invalid('Urutan kolom merujuk ke kolom yang tidak tersedia.');
  }

  const references = new Set();
  for (const [columnId, column] of Object.entries(value.columns)) {
    if (!isRecord(column) || column.id !== columnId || !validString(column.title, { min: 1, max: 100 }) || !Array.isArray(column.taskIds)) {
      return invalid('Data kolom tugas tidak valid.');
    }
    for (const taskId of column.taskIds) {
      if (typeof taskId !== 'string' || !Object.hasOwn(value.tasks, taskId) || references.has(taskId)) {
        return invalid('Setiap tugas harus berada tepat satu kolom.');
      }
      references.add(taskId);
    }
  }

  if (references.size !== taskIds.length) return invalid('Ada tugas yang belum ditempatkan pada kolom.');

  for (const [taskId, task] of Object.entries(value.tasks)) {
    if (!isRecord(task) || task.id !== taskId || !validString(task.title, { min: 1, max: MAX_TITLE_LENGTH })) {
      return invalid('Data tugas tidak valid.');
    }
    if (!TASK_PRIORITIES.has(task.priority)) return invalid('Prioritas tugas tidak valid.');
    if (!validString(task.createdAt, { min: 1, max: 80 })) return invalid('Waktu pembuatan tugas tidak valid.');
    if (!validString(task.createdByUserId, { min: 1, max: 120 })) return invalid('ID pembuat tugas tidak valid.');
    if (!validString(task.createdByName, { min: 1, max: 120 })) return invalid('Nama pembuat tugas tidak valid.');
    if (task.description !== undefined && !validString(task.description, { max: MAX_DESCRIPTION_LENGTH })) {
      return invalid('Deskripsi tugas terlalu panjang atau tidak valid.');
    }
    if (task.createdBy !== undefined && !validString(task.createdBy, { min: 1, max: 120 })) {
      return invalid('Pembuat tugas tidak valid.');
    }
    if (task.isFlagged !== undefined && typeof task.isFlagged !== 'boolean') {
      return invalid('Status penandaan tugas tidak valid.');
    }
    if (task.dueDate !== undefined && !validString(task.dueDate, { max: 80 })) return invalid('Tanggal tugas tidak valid.');
    if (Object.hasOwn(task, 'labels') || Object.hasOwn(task, 'assignee') || Object.hasOwn(task, 'isFavorite')) return invalid('Board tugas masih memakai field lama.');
    if (task.attachment !== undefined && !validateAttachment(task.attachment)) {
      return invalid('Lampiran tugas tidak valid atau melebihi batas 10 MB.');
    }
    if (task.attachments !== undefined) {
      if (!Array.isArray(task.attachments) || task.attachments.length > MAX_ATTACHMENTS || task.attachments.some((attachment) => !validateAttachment(attachment))) {
        return invalid('Lampiran tugas tidak valid atau melebihi batas 10 MB.');
      }
    }
  }

  return { valid: true };
}
