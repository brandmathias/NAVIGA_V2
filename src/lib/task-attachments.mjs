export const MAX_TASK_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

const DATABASE_NAME = 'naviga-task-attachments';
const DATABASE_VERSION = 1;
const STORE_NAME = 'files';

export function validateTaskAttachment(file) {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { valid: false, message: 'Pilih file yang valid terlebih dahulu.' };
  }

  if (file.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
    return { valid: false, message: 'Ukuran file maksimal 10 MB.' };
  }

  return { valid: true };
}

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Penyimpanan lampiran tidak tersedia di browser ini.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka penyimpanan lampiran.'));
  });
}

function createAttachmentId() {
  return globalThis.crypto?.randomUUID?.() ?? `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function saveTaskAttachment(file) {
  const validation = validateTaskAttachment(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const id = createAttachmentId();
  const database = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ id, file });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error ?? new Error('Gagal menyimpan lampiran.'));
  });

  database.close();

  return {
    id,
    name: file.name || 'Lampiran tugas',
    type: file.type || 'application/octet-stream',
    size: file.size,
  };
}

export async function getTaskAttachment(id) {
  if (!id) return null;

  const database = await openDatabase();
  const file = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.file ?? null);
    request.onerror = () => reject(request.error ?? new Error('Gagal membaca lampiran.'));
  });

  database.close();
  return file;
}

export async function deleteTaskAttachment(id) {
  if (!id || typeof indexedDB === 'undefined') return;

  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error ?? new Error('Gagal menghapus lampiran.'));
  });
  database.close();
}

export async function downloadTaskAttachment(attachment) {
  const file = await getTaskAttachment(attachment?.id);
  if (!file) {
    throw new Error('Lampiran tidak ditemukan di penyimpanan browser.');
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
