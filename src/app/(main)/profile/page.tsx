'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  Camera,
  History,
  KeyRound,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useLocalSession } from '@/components/main-shell';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { validateProfilePhoto } from '@/lib/profile-photo-storage';
import styles from './profile.module.css';

type LoginHistoryItem = {
  loggedInAt: string;
  ipAddress: string;
  browser: string;
  device: string;
  location: string;
  locationSource: 'device' | 'network';
  locationAccuracyMeters: number | null;
};

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
      <span className={styles.infoSurface} aria-hidden="true" />
      <span className={styles.infoAccent} aria-hidden="true" />
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');
  const [loginHistory, setLoginHistory] = React.useState<LoginHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  const roleLabel = user.role === 'superadmin' ? 'Superadmin' : 'Admin Unit';
  const branchLabel = user.upc === 'all' ? 'Semua Cabang (Super Admin)' : user.upc;

  const enrichLoginNetwork = React.useCallback(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch('https://ipwho.is/', { cache: 'no-store', signal: controller.signal });
      const network = await response.json() as { success?: boolean; ip?: string; city?: string; region?: string; country?: string };
      if (!response.ok || !network.success || !network.ip) return;
      await fetch('/api/profile/login-context', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: network.ip, city: network.city, region: network.region, country: network.country }),
      });
    } catch {
      // ponytail: the local fallback remains useful when the optional network lookup is unavailable.
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  const enrichDeviceLocation = React.useCallback(async () => {
    if (!('geolocation' in navigator)) return false;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        let bestPosition: GeolocationPosition | null = null;
        let watchId: number | undefined;
        let timeout: number | undefined;
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
          if (timeout !== undefined) window.clearTimeout(timeout);
          if (bestPosition) resolve(bestPosition);
          else reject(new Error('Lokasi perangkat belum tersedia.'));
        };

        watchId = navigator.geolocation.watchPosition((nextPosition) => {
          if (!bestPosition || nextPosition.coords.accuracy < bestPosition.coords.accuracy) bestPosition = nextPosition;
          if (nextPosition.coords.accuracy <= 30) finish();
        }, finish, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20_000,
        });
        timeout = window.setTimeout(finish, 20_000);
      });
      if (position.coords.accuracy > 5_000) return false;
      const response = await fetch('/api/profile/login-location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    fetch('/api/profile/photo', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Foto profil tidak dapat dimuat.');
        return response.blob();
      })
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

  React.useEffect(() => {
    void enrichLoginNetwork();
  }, [enrichLoginNetwork]);

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
      const form = new FormData();
      form.append('photo', file);
      const response = await fetch('/api/profile/photo', { method: 'PUT', body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'Foto belum dapat disimpan.');
      const nextUrl = URL.createObjectURL(file);

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = nextUrl;
      setPhotoUrl(nextUrl);
      toast({ title: 'Foto profil tersimpan', description: 'Foto tersimpan pada akun Anda.', tone: 'success' });
    } catch (error) {
      console.error('Foto profil tidak dapat disimpan.', error);
      const message = error instanceof Error ? error.message : 'Foto belum dapat disimpan. Silakan coba lagi.';
      setPhotoError(message);
      toast({ title: 'Foto gagal disimpan', description: message, variant: 'destructive', tone: 'error' });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') ?? '');
    const newPassword = String(form.get('newPassword') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Lengkapi seluruh kolom kata sandi.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi belum sama.');
      return;
    }

    setPasswordError('');
    setIsChangingPassword(true);
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false });
      if (result.error) throw new Error(result.error.message ?? 'Kata sandi belum dapat diubah.');
      setIsPasswordDialogOpen(false);
      toast({ title: 'Kata sandi diperbarui', description: 'Kata sandi akun Anda berhasil diganti.', tone: 'success' });
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Kata sandi belum dapat diubah.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const loadLoginHistory = async () => {
    const response = await fetch('/api/profile/login-history', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error ?? 'Riwayat login belum dapat dimuat.');
    setLoginHistory(Array.isArray(payload.items) ? payload.items : []);
  };

  const openLoginHistory = async () => {
    setIsHistoryDialogOpen(true);
    setIsLoadingHistory(true);
    try {
      await enrichLoginNetwork();
      await loadLoginHistory();
      void enrichDeviceLocation().then((updated) => {
        if (updated) return loadLoginHistory();
      }).catch(() => undefined);
    } catch (error) {
      toast({ title: 'Riwayat login gagal dimuat', description: error instanceof Error ? error.message : 'Silakan coba lagi.', variant: 'destructive', tone: 'error' });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? 'Logout gagal.');
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
            <p className={styles.description}>Detail akun tersimpan Anda</p>

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

          <div className={styles.securityActions}>
            <button className={styles.securityActionButton} type="button" onClick={() => setIsPasswordDialogOpen(true)}>
              <KeyRound size={18} strokeWidth={2} aria-hidden="true" />
              <span>Ubah sandi</span>
            </button>
            <button className={styles.securityActionButton} type="button" onClick={openLoginHistory}>
              <History size={18} strokeWidth={2} aria-hidden="true" />
              <span>Riwayat login</span>
            </button>
            <button
              className={styles.logoutButton}
              type="button"
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              onClick={handleLogout}
            >
              <span className={styles.logoutSweep} aria-hidden="true" />
              <span className={styles.logoutContent}>
                <LogOut className={styles.logoutIcon} size={20} strokeWidth={1.9} aria-hidden="true" />
                <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => { setIsPasswordDialogOpen(open); if (!open) setPasswordError(''); }}>
        <DialogContent className={styles.accountDialog}>
          <DialogHeader className={styles.dialogHeader}>
            <span className={styles.dialogEmblem} aria-hidden="true"><KeyRound size={23} strokeWidth={1.8} /></span>
            <div>
              <DialogTitle className={styles.dialogTitle}>Ubah kata sandi</DialogTitle>
              <DialogDescription className={styles.dialogDescription}>Gunakan kata sandi baru minimal 8 karakter.</DialogDescription>
            </div>
          </DialogHeader>
          <form className={styles.passwordForm} onSubmit={handlePasswordChange}>
            <label className={styles.formField}>
              <span>Kata sandi saat ini</span>
              <input name="currentPassword" type="password" autoComplete="current-password" required />
            </label>
            <label className={styles.formField}>
              <span>Kata sandi baru</span>
              <input name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <label className={styles.formField}>
              <span>Konfirmasi kata sandi baru</span>
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            {passwordError && <p className={styles.dialogError} role="alert">{passwordError}</p>}
            <DialogFooter className={styles.dialogActions}>
              <button className={styles.dialogSecondaryButton} type="button" onClick={() => setIsPasswordDialogOpen(false)}>Batal</button>
              <button className={styles.dialogPrimaryButton} type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Menyimpan...' : 'Simpan sandi'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className={styles.accountDialog}>
          <DialogHeader className={styles.dialogHeader}>
            <span className={styles.dialogEmblem} aria-hidden="true"><MonitorSmartphone size={23} strokeWidth={1.8} /></span>
            <div>
              <DialogTitle className={styles.dialogTitle}>Riwayat Login</DialogTitle>
              <DialogDescription className={styles.dialogDescription}>30 sesi terakhir yang tercatat pada akun Anda.</DialogDescription>
            </div>
          </DialogHeader>
          <div className={styles.loginHistoryList} aria-live="polite">
            {isLoadingHistory ? <p className={styles.historyEmpty}>Memuat riwayat login...</p> : loginHistory.length === 0 ? <p className={styles.historyEmpty}>Belum ada riwayat login yang tercatat.</p> : loginHistory.map((item) => (
              <article className={styles.loginHistoryItem} key={`${item.loggedInAt}-${item.ipAddress}`}>
                    <span className={styles.historyIcon} aria-hidden="true"><MonitorSmartphone size={19} strokeWidth={1.9} /></span>
                    <div className={styles.historyCopy}>
                      <strong>{item.browser} · {item.device}</strong>
                      <time dateTime={item.loggedInAt}>{new Date(item.loggedInAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                      <span className={styles.historyLocation}>
                        {item.location}{item.locationSource === 'device' && item.locationAccuracyMeters !== null
                          ? ` · Akurasi ±${Math.ceil(item.locationAccuracyMeters)} m`
                          : ' · Perkiraan jaringan'}
                      </span>
                    </div>
                <code>IP {item.ipAddress}</code>
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <p className={styles.copyright}>© 2026 NAVIGA Control Center. All rights reserved.</p>
    </main>
  );
}
