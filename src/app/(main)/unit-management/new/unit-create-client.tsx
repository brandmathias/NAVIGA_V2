'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ChevronLeft, Eye, EyeOff, Info, KeyRound, Loader2, LockKeyhole, Mail, MapPin, Phone, Save, ShieldPlus, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { INDONESIAN_PROVINCES, formatUnitCode } from '@/lib/unit-code-client';
import { registerUnitAction, registerUnitAdminAction } from '../actions';

type Unit = { id: string; name: string; prefix: string; unitCode: string };

function FormField({ icon: Icon, id, label, children, ...props }: React.ComponentProps<typeof Input> & { icon: typeof Building2; id: string; label: string; children?: React.ReactNode }) {
  return <div className="unit-admin-field"><span className="unit-admin-field-icon"><Icon className="h-5 w-5" strokeWidth={1.8} /></span><div className="min-w-0"><Label htmlFor={id} className="unit-admin-field-label">{label} <span>*</span></Label><div className="relative mt-2"><Input id={id} className="unit-admin-input" required {...props} />{children}</div></div></div>;
}

export default function UnitCreateClient({ units, mode }: { units: Unit[]; mode: 'unit' | 'admin' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [prefix, setPrefix] = React.useState('');
  const [domicile, setDomicile] = React.useState('');
  const [province, setProvince] = React.useState('');
  const [unitId, setUnitId] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const unitCode = formatUnitCode(domicile, prefix);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      if (mode === 'unit') {
        await registerUnitAction(formData);
        toast({ title: 'Unit ditambahkan', description: `Unit siap menggunakan filter SBG ${prefix}.`, tone: 'success' });
      } else {
        await registerUnitAdminAction(formData);
        toast({ title: 'Akun admin ditambahkan', description: 'Akun siap digunakan untuk unit terkait.', tone: 'success' });
      }
      router.push('/unit-management');
      router.refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Periksa data dan coba lagi.';
      setError(message);
      toast({ title: 'Data tidak dapat disimpan', description: message, variant: 'destructive', tone: 'error' });
    } finally { setSaving(false); }
  }

  return <main className="unit-create-page flex flex-1 flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:px-7">
    <header className="unit-create-heading"><div className="flex items-center gap-2 text-sm font-semibold"><Link href="/unit-management" className="unit-create-back"><ChevronLeft className="h-4 w-4" /> Manajemen Unit</Link><span className="text-[#92a8b4]">/</span><span className="text-primary">{mode === 'unit' ? 'Tambah Unit' : 'Tambah Akun'}</span></div><div className="mt-2 flex items-center gap-3"><span className="unit-admin-dialog-emblem unit-create-emblem"><ShieldPlus className="h-8 w-8" strokeWidth={1.55} /></span><div><h1 className="font-headline text-3xl font-bold tracking-[-.04em] text-[#064c55] sm:text-[2.55rem]">{mode === 'unit' ? 'Tambah Unit' : 'Tambah akun admin unit'}</h1><p className="mt-1 text-sm text-[#607786]">{mode === 'unit' ? 'Lengkapi informasi unit baru untuk menambah data ke sistem.' : 'Buat akun admin baru untuk mengelola unit terkait.'}</p></div></div></header>

    <form onSubmit={submit} className="unit-create-card unit-create-reference-card">
      <p aria-live="polite" className="min-h-5 text-sm font-medium text-destructive">{error}</p>
      {mode === 'unit' ? <>
        <section><div className="unit-create-section-title"><Building2 className="h-5 w-5" /> <h2>Informasi Unit</h2></div><div className="mt-5 grid gap-4 lg:grid-cols-3">
          <FormField icon={Building2} id="unit-name" name="name" label="Nama unit" placeholder="UPC Wanea" disabled={saving} />
          <FormField icon={KeyRound} id="unit-prefix" name="prefix" label="Kode unit (5 digit)" placeholder="11787" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={prefix} onChange={(event) => setPrefix(event.target.value.replace(/\D/g, '').slice(0, 5))} disabled={saving} />
          <div className="unit-admin-field"><span className="unit-admin-field-icon"><MapPin className="h-5 w-5" strokeWidth={1.8} /></span><div className="min-w-0"><Label className="unit-admin-field-label">Domisili <span>*</span></Label><Select name="province" value={province} onValueChange={setProvince} required disabled={saving}><SelectTrigger aria-label="Domisili" className="unit-admin-select-trigger mt-2"><SelectValue placeholder="Pilih domisili" /></SelectTrigger><SelectContent className="unit-admin-select-content">{INDONESIAN_PROVINCES.map((item) => <SelectItem key={item} value={item} className="unit-admin-select-item">{item}</SelectItem>)}</SelectContent></Select></div></div>
          <FormField icon={MapPin} id="unit-domicile" name="domicile" label="Kota / kabupaten" placeholder="Manado" value={domicile} onChange={(event) => setDomicile(event.target.value)} disabled={saving} />
          <FormField icon={Phone} id="unit-phone" name="phone" label="Nomor telepon" placeholder="0431862000" disabled={saving} />
          <div className="unit-code-preview"><span>Kode tampilan unit</span><strong>{unitCode || 'CP-XXX-00000'}</strong><small>Ekstraksi tetap divalidasi oleh prefix 5 digit: {prefix || '—'}.</small></div>
          <div className="lg:col-span-3"><FormField icon={MapPin} id="unit-address" name="address" label="Alamat" placeholder="Masukkan alamat lengkap unit" disabled={saving} /></div>
        </div></section>
        <section className="mt-7 border-t border-[#e0edee] pt-6"><div className="unit-create-section-title"><UserRound className="h-5 w-5" /> <h2>Akun Admin Unit</h2></div><div className="mt-5 grid gap-4 md:grid-cols-2"><FormField icon={UserRound} id="admin-name" name="adminName" label="Nama admin unit" placeholder="Masukkan nama admin" disabled={saving} /><FormField icon={Mail} id="admin-email" name="email" type="email" label="Email akun" placeholder="admin@pegadaian.co.id" disabled={saving} /><FormField icon={Phone} id="admin-phone" name="adminPhone" label="Nomor telepon" placeholder="081234567890" disabled={saving} /><FormField icon={LockKeyhole} id="admin-password" name="password" type={showPassword ? 'text' : 'password'} minLength={8} label="Password awal" placeholder="Minimal 8 karakter" disabled={saving}>{<button type="button" className="unit-admin-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}</button>}</FormField></div></section>
      </> : <section><div className="unit-create-section-title"><UserRound className="h-5 w-5" /> <h2>Informasi Akun</h2></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="unit-admin-field md:col-span-2"><span className="unit-admin-field-icon"><Building2 className="h-5 w-5" /></span><div className="min-w-0"><Label className="unit-admin-field-label">Unit terkait <span>*</span></Label><Select name="unitId" value={unitId} onValueChange={setUnitId} required disabled={saving || !units.length}><SelectTrigger className="unit-admin-select-trigger mt-2"><SelectValue placeholder="Pilih unit terkait" /></SelectTrigger><SelectContent className="unit-admin-select-content">{units.map((unit) => <SelectItem key={unit.id} value={unit.id} className="unit-admin-select-item"><span>{unit.name}</span><span>{unit.unitCode || unit.prefix}</span></SelectItem>)}</SelectContent></Select></div></div><FormField icon={UserRound} id="name" name="name" label="Nama admin unit" placeholder="Masukkan nama admin" disabled={saving} /><FormField icon={Mail} id="email" name="email" type="email" label="Email akun" placeholder="admin@pegadaian.co.id" disabled={saving} /><FormField icon={Phone} id="phone" name="phone" label="Nomor telepon" placeholder="081234567890" disabled={saving} /><FormField icon={LockKeyhole} id="password" name="password" type={showPassword ? 'text' : 'password'} minLength={8} label="Password awal" placeholder="Minimal 8 karakter" disabled={saving}>{<button type="button" className="unit-admin-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}</button>}</FormField></div></section>}
      <div className="unit-admin-info mt-6"><Info className="h-5 w-5 shrink-0" /><p>{mode === 'unit' ? 'Kode tampilan dibuat dari kota/kabupaten dan kode unit, sementara pembacaan dokumen selalu memakai lima digit kode unit.' : 'Akun admin unit akan digunakan untuk mengelola data sesuai unit terkait.'}</p></div>
      <div className="unit-admin-actions mt-6"><Button asChild variant="outline" className="unit-admin-cancel" aria-disabled={saving}><Link href="/unit-management">Batalkan</Link></Button><Button type="submit" className="unit-admin-submit" disabled={saving || (mode === 'admin' && !unitId)}>{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{saving ? 'Menyimpan...' : mode === 'unit' ? 'Simpan unit' : 'Simpan akun'}</Button></div>
    </form>
  </main>;
}
