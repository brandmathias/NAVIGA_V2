export const MAX_TASK_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

const ATTACHMENT_API_PATH = '/api/tasks/attachments';

export function validateTaskAttachment(file) {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { valid: false, message: 'Pilih file yang valid terlebih dahulu.' };
  }

  if (file.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
    return { valid: false, message: 'Ukuran file maksimal 10 MB.' };
  }

  return { valid: true };
}

async function responseMessage(response, fallback) {
  try {
    const payload = await response.json();
    if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  } catch {
    // Keep the local fallback when the API response is not JSON.
  }
  return fallback;
}

function attachmentUrl(id, options = '') {
  return `${ATTACHMENT_API_PATH}/${encodeURIComponent(id)}${options}`;
}

export async function saveTaskAttachment(file) {
  const validation = validateTaskAttachment(file);
  if (!validation.valid) throw new Error(validation.message);

  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(ATTACHMENT_API_PATH, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(await responseMessage(response, 'Lampiran belum dapat disimpan.'));

  const payload = await response.json();
  if (!payload?.attachment?.id) throw new Error('Respons penyimpanan lampiran tidak valid.');
  return payload.attachment;
}

export async function getTaskAttachment(id) {
  if (!id) return null;

  const response = await fetch(attachmentUrl(id), { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await responseMessage(response, 'Gagal membaca lampiran.'));
  return response.blob();
}

export async function deleteTaskAttachment(id) {
  if (!id) return;

  const response = await fetch(attachmentUrl(id), { method: 'DELETE' });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(await responseMessage(response, 'Gagal menghapus lampiran.'));
}

export async function downloadTaskAttachment(attachment) {
  const file = await getTaskAttachment(attachment?.id);
  if (!file) throw new Error('Lampiran tidak ditemukan di database.');

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function previewTaskAttachment(attachment) {
  const previewWindow = window.open('about:blank', '_blank');
  if (!previewWindow) {
    throw new Error('Pratinjau lampiran diblokir browser. Izinkan pop-up untuk melihat file.');
  }
  previewWindow.opener = null;

  try {
    const file = await getTaskAttachment(attachment?.id);
    if (!file) throw new Error('Lampiran tidak ditemukan di database.');

    const url = URL.createObjectURL(file);
    previewWindow.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}
