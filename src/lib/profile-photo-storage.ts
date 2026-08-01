const PROFILE_PHOTO_DATABASE = 'naviga-profile';
const PROFILE_PHOTO_STORE = 'photos';
const PROFILE_PHOTO_KEY = 'avatar';

export const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
export const PROFILE_PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function validateProfilePhoto(file: Pick<Blob, 'type' | 'size'>): string | null {
  if (!PROFILE_PHOTO_ACCEPTED_TYPES.includes(file.type as (typeof PROFILE_PHOTO_ACCEPTED_TYPES)[number])) {
    return 'File tidak didukung. Gunakan gambar JPG, PNG, atau WEBP.';
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    return 'Ukuran foto maksimal 5 MB.';
  }

  return null;
}

function openProfilePhotoDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Penyimpanan foto tidak tersedia di browser ini.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROFILE_PHOTO_DATABASE, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PROFILE_PHOTO_STORE)) {
        request.result.createObjectStore(PROFILE_PHOTO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Database foto tidak dapat dibuka.'));
  });
}

export async function loadProfilePhoto(): Promise<Blob | null> {
  const database = await openProfilePhotoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROFILE_PHOTO_STORE, 'readonly');
    const request = transaction.objectStore(PROFILE_PHOTO_STORE).get(PROFILE_PHOTO_KEY);

    request.onsuccess = () => {
      const storedPhoto = request.result;
      resolve(storedPhoto instanceof Blob ? storedPhoto : null);
    };
    request.onerror = () => reject(request.error ?? new Error('Foto profil tidak dapat dibaca.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('Foto profil tidak dapat dibaca.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Pembacaan foto profil dibatalkan.'));
  });
}

export async function saveProfilePhoto(file: Blob): Promise<void> {
  const validationError = validateProfilePhoto(file);
  if (validationError) throw new Error(validationError);

  const database = await openProfilePhotoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROFILE_PHOTO_STORE, 'readwrite');
    transaction.objectStore(PROFILE_PHOTO_STORE).put(file, PROFILE_PHOTO_KEY);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Foto profil tidak dapat disimpan.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Penyimpanan foto profil dibatalkan.'));
    };
  });
}
