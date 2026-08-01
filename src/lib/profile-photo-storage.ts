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
