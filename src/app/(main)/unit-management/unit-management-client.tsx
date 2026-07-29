'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LockKeyhole,
  Loader2,
  Mail,
  Plus,
  Phone,
  Save,
  Search,
  ShieldCheck,
  ShieldPlus,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { registerUnitAdminAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type Unit = {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  domicile: string;
  phone: string;
  address: string;
  email: string;
  adminName: string;
  adminPhone: string;
};

type UnitAdmin = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  unitId: string;
  unitName: string;
  unitPrefix: string;
  domicile: string;
  phone: string;
  address: string;
};

const missingValue = (value: string) => value || '—';

function Field({ id, label, ...props }: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} {...props} /></div>;
}

function AdminFormField({ icon: Icon, id, label, required = true, children, ...props }: React.ComponentProps<typeof Input> & { icon: React.ElementType; id: string; label: string; children?: React.ReactNode }) {
  return <div className="unit-admin-field">
    <span className="unit-admin-field-icon" aria-hidden="true"><Icon className="h-5 w-5" strokeWidth={1.8} /></span>
    <div className="min-w-0">
      <Label htmlFor={id} className="unit-admin-field-label">{label}{required && <span aria-hidden="true"> *</span>}</Label>
      <div className="relative mt-2"><Input id={id} className="unit-admin-input" required={required} {...props} />{children}</div>
    </div>
  </div>;
}

export default function UnitManagementClient({ units: initialUnits, admins: initialAdmins }: { units: Unit[]; admins: UnitAdmin[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [units, setUnits] = React.useState(initialUnits);
  const [admins, setAdmins] = React.useState(initialAdmins);
  const [saving, setSaving] = React.useState<'unit' | 'admin' | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = React.useState(false);
  const [adminError, setAdminError] = React.useState<string | null>(null);
  const [adminUnitId, setAdminUnitId] = React.useState('');
  const [showAdminPassword, setShowAdminPassword] = React.useState(false);
  const [unitQuery, setUnitQuery] = React.useState('');
  const [adminQuery, setAdminQuery] = React.useState('');

  const visibleUnits = units.filter((unit) =>
    [unit.name, unit.prefix, unit.domicile, unit.phone, unit.address].join(' ').toLowerCase().includes(unitQuery.trim().toLowerCase()),
  );
  const visibleAdmins = admins.filter((admin) =>
    [admin.name, admin.unitName, admin.domicile, admin.phone, admin.email].join(' ').toLowerCase().includes(adminQuery.trim().toLowerCase()),
  );

  const handleAdminSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setAdminError(null);
    setSaving('admin');
    try {
      const admin = await registerUnitAdminAction(new FormData(form)) as UnitAdmin;
      setAdmins((current) => [...current, admin].sort((left, right) => left.name.localeCompare(right.name)));
      form.reset();
      setAdminUnitId('');
      setShowAdminPassword(false);
      setIsAdminDialogOpen(false);
      toast({ title: 'Akun admin ditambahkan', description: `${admin.name} dapat masuk untuk ${admin.unitName}.`, tone: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Periksa data akun dan coba lagi.';
      setAdminError(message);
      toast({ title: 'Akun tidak dapat ditambahkan', description: message, variant: 'destructive', tone: 'error' });
    } finally {
      setSaving(null);
    }
  };

  const showUnit = (unit: Unit) => toast({ title: unit.name, description: `${unit.prefix} · ${missingValue(unit.address)}`, tone: 'info' });
  const showAdmin = (admin: UnitAdmin) => toast({ title: admin.name, description: `${admin.unitName} · ${admin.email}`, tone: 'info' });

  return (
    <main className="unit-management-page flex flex-1 flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 xl:px-6">
      <section className="unit-hero naviga-entry relative isolate overflow-hidden rounded-[20px] border border-white/90 shadow-[0_14px_38px_rgba(10,79,89,.09)]">
        <div className="unit-hero-copy relative z-[1] flex min-h-[242px] flex-col justify-between px-6 py-7 sm:px-9 sm:py-8 lg:px-12 lg:py-9">
          <div className="flex min-w-0 items-center gap-5">
            <span className="unit-hero-emblem flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full"><ShieldCheck className="h-11 w-11" strokeWidth={1.7} /></span>
            <div className="min-w-0">
              <h1 className="font-headline text-[clamp(2.25rem,4vw,3.35rem)] font-bold leading-none tracking-[-0.055em] text-[#064c55]">Manajemen Unit</h1>
              <span className="mt-4 block h-1 w-24 rounded-full bg-primary" />
              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#12394a] sm:text-[15px]">Kelola unit operasional dan akun admin unit secara terpusat.<br className="hidden md:block" /> Setiap unit dibatasi oleh lima digit awal kode atau nomor angsuran.</p>
              <div className="unit-hero-stats mt-5 flex flex-nowrap gap-2.5" aria-label="Ringkasan manajemen unit">
                <span className="unit-hero-stat">
                  <span className="unit-hero-stat-icon"><Building2 className="h-4 w-4" strokeWidth={1.9} /></span>
                  <span className="unit-hero-stat-copy"><strong>{units.length}</strong><span>Unit terdaftar</span></span>
                </span>
                <span className="unit-hero-stat">
                  <span className="unit-hero-stat-icon"><UsersRound className="h-4 w-4" strokeWidth={1.9} /></span>
                  <span className="unit-hero-stat-copy"><strong>{admins.length}</strong><span>Akun admin</span></span>
                </span>
              </div>
              <div className="unit-hero-actions relative z-10 mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Button type="button" onClick={() => router.push('/unit-management/new')} className="unit-hero-secondary group h-12 min-w-[178px] rounded-xl px-5">
                  <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" strokeWidth={1.7} />
                  Tambah unit
                </Button>
                <Button type="button" onClick={() => router.push('/unit-management/new?mode=admin')} className="unit-hero-primary group h-12 min-w-[220px] rounded-xl px-5">
                  <UserPlus className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.7} />
                  Tambahkan akun
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="unit-management-content grid items-start gap-3 xl:gap-4">
        <div className="space-y-3 xl:space-y-4">
          <section className="naviga-entry naviga-entry-delay-1 naviga-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#e0edee] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9faf7] text-primary"><Building2 className="h-5 w-5" strokeWidth={1.6} /></span>
                <div className="min-w-0"><h2 className="text-base font-bold tracking-tight text-[#102f45]">Unit terdaftar</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Akun unit hanya membaca dokumen dengan awalan nomor yang sesuai.</p></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a8191]" strokeWidth={1.7} /><Input value={unitQuery} onChange={(event) => setUnitQuery(event.target.value)} className="h-10 w-full rounded-lg border-[#d8e9ec] bg-white pl-9 text-xs shadow-none sm:w-56" placeholder="Cari unit..." aria-label="Cari unit" /></label>
              </div>
            </div>
            <div className="overflow-x-auto px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
              <table className="w-full min-w-[860px] overflow-hidden rounded-xl border border-[#e0ecee] text-left text-xs">
                <thead className="bg-[#f8fbfb] font-semibold text-[#496171]"><tr><th className="px-3 py-3">Nama unit</th><th className="px-3 py-3">Kode unit</th><th className="px-3 py-3">Domisili</th><th className="px-3 py-3">Nomor telepon</th><th className="px-3 py-3">Alamat</th><th className="px-3 py-3 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-[#e6f0f1] bg-white text-[#19374b]">{visibleUnits.map((unit) => <tr key={unit.id} className="transition-colors duration-150 hover:bg-[#f4fbfa]"><td className="px-3 py-3 font-semibold">{unit.name}</td><td className="px-3 py-3 font-mono tabular-nums">{unit.prefix}</td><td className="px-3 py-3">{missingValue(unit.domicile)}</td><td className="px-3 py-3">{missingValue(unit.phone)}</td><td className="max-w-[230px] px-3 py-3 leading-5">{missingValue(unit.address)}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => showUnit(unit)} className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-primary transition-transform duration-150 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Lihat detail <ChevronRight className="h-4 w-4" /></button></td></tr>)}{!visibleUnits.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Unit tidak ditemukan.</td></tr>}</tbody>
              </table>
            </div>
            <p className="px-5 pb-4 text-xs text-muted-foreground">Menampilkan 1–{visibleUnits.length} dari {units.length} unit</p>
          </section>

          <section className="naviga-entry naviga-entry-delay-2 naviga-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#e0edee] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9faf7] text-primary"><UsersRound className="h-5 w-5" strokeWidth={1.6} /></span><div className="min-w-0"><h2 className="text-base font-bold tracking-tight text-[#102f45]">Daftar akun admin unit</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Kelola akun admin untuk setiap unit operasional.</p></div></div>
              <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a8191]" strokeWidth={1.7} /><Input value={adminQuery} onChange={(event) => setAdminQuery(event.target.value)} className="h-10 w-full rounded-lg border-[#d8e9ec] bg-white pl-9 text-xs shadow-none sm:w-56" placeholder="Cari admin..." aria-label="Cari admin" /></label>
            </div>
            <div className="overflow-x-auto px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
              <table className="w-full min-w-[920px] overflow-hidden rounded-xl border border-[#e0ecee] text-left text-xs">
                <thead className="bg-[#f8fbfb] font-semibold text-[#496171]"><tr><th className="px-3 py-3">Nama admin</th><th className="px-3 py-3">Unit terkait</th><th className="px-3 py-3">Domisili</th><th className="px-3 py-3">Nomor telepon</th><th className="px-3 py-3">Email akun</th><th className="px-3 py-3 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-[#e6f0f1] bg-white text-[#19374b]">{visibleAdmins.map((admin) => <tr key={admin.id} className="transition-colors duration-150 hover:bg-[#f4fbfa]"><td className="px-3 py-3 font-semibold">{admin.name}</td><td className="px-3 py-3">{admin.unitName}</td><td className="px-3 py-3">{missingValue(admin.domicile)}</td><td className="px-3 py-3">{missingValue(admin.phone)}</td><td className="px-3 py-3 text-[#526b7a]">{admin.email}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => showAdmin(admin)} className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-primary transition-transform duration-150 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Lihat detail <ChevronRight className="h-4 w-4" /></button></td></tr>)}{!visibleAdmins.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Akun admin tidak ditemukan.</td></tr>}</tbody>
              </table>
            </div>
            <p className="px-5 pb-4 text-xs text-muted-foreground">Menampilkan 1–{visibleAdmins.length} dari {admins.length} akun admin</p>
          </section>
        </div>

        <aside className="naviga-entry naviga-entry-delay-3 naviga-panel h-fit p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9faf7] text-primary"><UsersRound className="h-5 w-5" strokeWidth={1.6} /></span><h2 className="text-base font-bold tracking-tight text-[#102f45]">Ringkasan</h2></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[#dcebed] bg-[#fbfefe] p-4 text-center"><p className="text-3xl font-bold tracking-tight text-primary">{units.length}</p><p className="mt-1 text-xs text-[#607786]">Unit terdaftar</p></div><div className="rounded-xl border border-[#dcebed] bg-[#fbfefe] p-4 text-center"><p className="text-3xl font-bold tracking-tight text-primary">{admins.length}</p><p className="mt-1 text-xs text-[#607786]">Akun admin</p></div></div><div className="mt-6 border-t border-[#e2eeee] pt-6"><h3 className="text-base font-bold text-[#102f45]">Informasi cepat</h3><ul className="mt-4 space-y-4 text-sm leading-5 text-[#526b7a]"><li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Setiap unit dibatasi oleh 5 digit awal kode unit atau nomor angsuran.</li><li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Akun unit hanya bersifat read-only sesuai cakupan unit.</li><li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Kelola akun admin untuk memberikan akses sesuai unit.</li></ul></div><div className="mt-6 rounded-xl border border-[#cbe7e4] bg-[#f0faf9] p-4 text-sm leading-5 text-[#456675]"><div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.6} /><p>Pastikan data unit dan akun selalu terbaru untuk keamanan sistem.</p></div></div></aside>
      </div>

      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent data-testid="admin-registration" className="unit-admin-dialog max-h-[92dvh] overflow-y-auto p-5 sm:p-7">
          <DialogHeader className="unit-admin-dialog-header">
            <span className="unit-admin-dialog-emblem" aria-hidden="true"><ShieldPlus className="h-10 w-10" strokeWidth={1.55} /></span>
            <div className="min-w-0"><DialogTitle className="unit-admin-dialog-title">Tambah akun admin unit</DialogTitle><DialogDescription className="unit-admin-dialog-description">Buat akun admin baru untuk mengelola unit.</DialogDescription></div>
          </DialogHeader>
          <form className="unit-admin-form" onSubmit={handleAdminSubmit}>
            <p aria-live="polite" className="min-h-5 text-sm font-medium text-destructive">{adminError}</p>
            <div className="unit-admin-field">
              <span className="unit-admin-field-icon" aria-hidden="true"><Building2 className="h-5 w-5" strokeWidth={1.8} /></span>
              <div className="min-w-0"><Label htmlFor="admin-unit" className="unit-admin-field-label">Unit terkait <span aria-hidden="true">*</span></Label>
                <Select name="unitId" value={adminUnitId} onValueChange={setAdminUnitId} required disabled={saving === 'admin' || !units.length}>
                  <SelectTrigger id="admin-unit" aria-label="Unit terkait" className="unit-admin-select-trigger mt-2"><SelectValue placeholder="Pilih unit terkait" /></SelectTrigger>
                  <SelectContent className="unit-admin-select-content" position="popper">{units.map((unit) => <SelectItem key={unit.id} value={unit.id} className="unit-admin-select-item"><span>{unit.name}</span><span>{unit.prefix}</span></SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <AdminFormField icon={UserRound} id="admin-name" name="name" label="Nama admin unit" placeholder="Masukkan nama admin unit" disabled={saving === 'admin'} />
            <AdminFormField icon={Mail} id="admin-email" name="email" type="email" label="Email akun" placeholder="Masukkan email akun" disabled={saving === 'admin'} />
            <AdminFormField icon={Phone} id="admin-phone" name="phone" label="Nomor telepon" placeholder="Masukkan nomor telepon" disabled={saving === 'admin'} />
            <AdminFormField icon={Building2} id="admin-domicile" name="domicile" label="Domisili" placeholder="Masukkan domisili" disabled={saving === 'admin'} />
            <AdminFormField icon={Building2} id="admin-address" name="address" label="Alamat" placeholder="Masukkan alamat admin" disabled={saving === 'admin'} />
            <AdminFormField icon={LockKeyhole} id="admin-password" name="password" type={showAdminPassword ? 'text' : 'password'} minLength={8} label="Password awal" placeholder="Masukkan password awal" disabled={saving === 'admin'}>
              <button type="button" className="unit-admin-password-toggle" onClick={() => setShowAdminPassword((current) => !current)} aria-label={showAdminPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </AdminFormField>
            <div className="unit-admin-info"><Info className="h-5 w-5 shrink-0" strokeWidth={1.9} /><p>Akun admin unit akan digunakan untuk mengelola data unit.</p></div>
            <div className="unit-admin-actions"><Button type="button" variant="outline" className="unit-admin-cancel" onClick={() => setIsAdminDialogOpen(false)} disabled={saving === 'admin'}>Batalkan</Button><Button type="submit" className="unit-admin-submit" disabled={saving === 'admin' || !units.length}>{saving === 'admin' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" strokeWidth={1.8} />}{saving === 'admin' ? 'Menyimpan...' : 'Simpan'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
