'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  Camera,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useLocalSession } from '@/components/main-shell';
import { useToast } from '@/hooks/use-toast';
import {
  loadProfilePhoto,
  saveProfilePhoto,
  validateProfilePhoto,
} from '@/lib/profile-photo-storage';
import styles from './profile.module.css';

function ProfileInfoCard({
  icon,
  label,
  value,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  index: number;
}) {
  return (
    <div className={`${styles.infoCard} ${styles.entry}`} style={{ '--profile-index': index } as React.CSSProperties}>
      <span className={styles.infoIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.infoCopy}>
        <span className={styles.infoLabel}>{label}</span>
        <span className={styles.infoValue}>{value}</span>
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useLocalSession();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState('');
  const [isSavingPhoto, setIsSavingPhoto] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const roleLabel = user.role === 'superadmin' ? 'Superadmin' : 'Admin Unit';
  const branchLabel = user.upc === 'all' ? 'Semua Cabang (Super Admin)' : user.upc;

  React.useEffect(() => {
    let isMounted = true;

    loadProfilePhoto()
      .then((storedPhoto) => {
        if (!isMounted || !storedPhoto) return;

        const nextUrl = URL.createObjectURL(storedPhoto);
        objectUrlRef.current = nextUrl;
        setPhotoUrl(nextUrl);
      })
      .catch((error) => {
        console.error('Foto profil tidak dapat dimuat.', error);
      });

    return () => {
      isMounted = false;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateProfilePhoto(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }

    setIsSavingPhoto(true);
    setPhotoError('');

    try {
      await saveProfilePhoto(file);
      const nextUrl = URL.createObjectURL(file);

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = nextUrl;
      setPhotoUrl(nextUrl);
      toast({ title: 'Foto profil tersimpan', description: 'Foto akan tetap tersedia setelah refresh.', tone: 'success' });
    } catch (error) {
      console.error('Foto profil tidak dapat disimpan.', error);
      setPhotoError('Foto belum dapat disimpan. Silakan coba lagi.');
      toast({ title: 'Foto gagal disimpan', description: 'Penyimpanan browser belum dapat digunakan.', variant: 'destructive', tone: 'error' });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout gagal.');
      toast({ title: 'Logout berhasil', description: 'Sesi Anda telah diakhiri dengan aman.', tone: 'success' });
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ title: 'Logout gagal', description: 'Sesi belum dapat diakhiri. Silakan coba lagi.', variant: 'destructive', tone: 'error' });
      setIsLoggingOut(false);
    }
  };

  return (
    <main className={styles.profilePage}>
      <section className={styles.profilePanel} aria-labelledby="profile-heading">
        <div className={styles.panelBackdrop} aria-hidden="true" />
        <div className={styles.panelWaveOne} aria-hidden="true" />
        <div className={styles.panelWaveTwo} aria-hidden="true" />

        <div className={styles.profileGrid}>
          <div className={`${styles.photoColumn} ${styles.entry}`} style={{ '--profile-index': 0 } as React.CSSProperties}>
            <div className={styles.avatarStage}>
              <div className={styles.avatarFrame}>
                {photoUrl ? (
                  <img className={styles.avatarImage} src={photoUrl} alt={`Foto profil ${user.name}`} />
                ) : (
                  <span aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <button
                aria-label={isSavingPhoto ? 'Menyimpan foto profil' : 'Ganti foto profil'}
                className={styles.cameraButton}
                type="button"
                disabled={isSavingPhoto}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className={styles.cameraIcon} size={28} strokeWidth={1.9} aria-hidden="true" />
                <span className={styles.cameraTooltip}>Ganti foto profil</span>
              </button>

              <input
                ref={fileInputRef}
                id="profile-photo-input"
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />
            </div>
            {photoError && <p className={styles.photoError} role="alert">{photoError}</p>}
          </div>

          <div className={`${styles.profileDetails} ${styles.entry}`} style={{ '--profile-index': 1 } as React.CSSProperties}>
            <div className={styles.accountBadge}>
              <UserRound size={20} strokeWidth={1.9} aria-hidden="true" />
              <span>Profil Akun</span>
            </div>

            <div className={styles.identityRow}>
              <h1 id="profile-heading" className={styles.identityHeading}>{user.name}</h1>
              <span className={styles.verifiedBadge} title="Akun terverifikasi">
                <BadgeCheck size={20} strokeWidth={2.1} aria-hidden="true" />
              </span>
            </div>

            <div className={styles.titleRule} aria-hidden="true" />
            <p className={styles.description}>Detail akun sesi lokal Anda</p>

            <div className={styles.infoGrid}>
              <ProfileInfoCard
                index={2}
                icon={<UserRound size={28} strokeWidth={1.8} />}
                label="Nama Lengkap"
                value={user.name}
              />
              <ProfileInfoCard
                index={3}
                icon={<Mail size={28} strokeWidth={1.8} />}
                label="Alamat Email"
                value={user.email}
              />
              <ProfileInfoCard
                index={4}
                icon={<Building2 size={28} strokeWidth={1.8} />}
                label="Unit/Cabang"
                value={branchLabel}
              />
              <ProfileInfoCard
                index={5}
                icon={<ShieldCheck size={28} strokeWidth={1.8} />}
                label="Peran Akses"
                value={roleLabel}
              />
            </div>
          </div>
        </div>

        <div className={`${styles.securityPanel} ${styles.entry}`} style={{ '--profile-index': 6 } as React.CSSProperties}>
          <div className={styles.securityCopy}>
            <span className={styles.securityIcon} aria-hidden="true">
              <ShieldCheck size={28} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={styles.securityTitle}>Akses Aman</h2>
              <p className={styles.securityDescription}>
                Anda login sebagai {roleLabel} dengan akses {user.role === 'superadmin' ? 'penuh ke seluruh fitur dan data NAVIGA.' : 'sesuai unit kerja Anda.'}
              </p>
            </div>
          </div>

          <button
            className={styles.logoutButton}
            type="button"
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            onClick={handleLogout}
          >
            <span className={styles.logoutSweep} aria-hidden="true" />
            <span className={styles.logoutContent}>
              <LogOut className={styles.logoutIcon} size={24} strokeWidth={1.9} aria-hidden="true" />
              <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
            </span>
          </button>
        </div>
      </section>

      <p className={styles.copyright}>© 2026 NAVIGA Control Center. All rights reserved.</p>
    </main>
  );
}
