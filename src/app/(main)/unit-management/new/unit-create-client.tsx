'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Building2, ChevronLeft, Eye, EyeOff, Loader2, MoreVertical, Plus, Save, ShieldPlus, UserCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { INDONESIAN_PROVINCES, formatUnitCode } from '@/lib/unit-code-client';
import { registerUnitAction, registerUnitAdminAction } from '../actions';

type Unit = { id: string; name: string; prefix: string; unitCode: string };
type Person = { name: string; nip: string; phone: string };
type Admin = { name: string; email: string; phone: string; password: string };
type DraftPerson = Person;
type DraftAdmin = Admin;

function Field({ id, label, children, ...props }: React.ComponentProps<typeof Input> & { id: string; label: string; children?: React.ReactNode }) {
  return <div className="unit-reference-field"><Label htmlFor={id}>{label} <span>*</span></Label><div className="relative"><Input id={id} className="unit-reference-input" required {...props} />{children}</div></div>;
}

function EmptyRows({ colSpan, message }: { colSpan: number; message: string }) {
  return <tr><td colSpan={colSpan} className="unit-reference-empty">{message}</td></tr>;
}

function PersonCard({ title, Icon, actionLabel, draft, setDraft, people, setPeople, saving }: {
  title: string; Icon: typeof UsersRound; actionLabel: string; draft: DraftPerson; setDraft: React.Dispatch<React.SetStateAction<DraftPerson>>;
  people: Person[]; setPeople: React.Dispatch<React.SetStateAction<Person[]>>; saving: boolean;
}) {
  function addPerson() {
    if (!draft.name.trim() || !draft.nip.trim() || !draft.phone.trim()) return;
    setPeople((current) => [...current, { name: draft.name.trim(), nip: draft.nip.trim(), phone: draft.phone.trim() }]);
    setDraft({ name: '', nip: '', phone: '' });
  }
  return <section className="unit-reference-card unit-reference-person-card">
    <div className="unit-reference-card-head"><div className="unit-reference-title"><Icon /><h2>{title}</h2></div><Button type="button" variant="outline" className="unit-reference-add" onClick={addPerson} disabled={saving}><Plus />{actionLabel}</Button></div>
    <div className="unit-reference-person-inputs">
      <Field id={`${title}-name`} label="Nama lengkap" placeholder="Masukkan nama lengkap" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} disabled={saving} />
      <Field id={`${title}-nip`} label="NIP" placeholder="Masukkan NIP" value={draft.nip} onChange={(event) => setDraft((current) => ({ ...current, nip: event.target.value }))} disabled={saving} />
      <Field id={`${title}-phone`} label="Nomor telepon" placeholder="Masukkan nomor telepon" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} disabled={saving} />
    </div>
    <div className="unit-reference-table-wrap"><table className="unit-reference-table"><thead><tr><th>Nama lengkap</th><th>NIP</th><th>Nomor telepon</th><th aria-label="Aksi">Aksi</th></tr></thead><tbody>{people.length ? people.map((person) => <tr key={`${person.nip}-${person.name}`}><td>{person.name}</td><td>{person.nip}</td><td>{person.phone}</td><td><button type="button" className="unit-reference-more" onClick={() => setPeople((current) => current.filter((candidate) => candidate !== person))} aria-label={`Hapus ${person.name}`} title={`Hapus ${person.name}`}><MoreVertical /></button></td></tr>) : <EmptyRows colSpan={4} message={`Belum ada ${title.toLowerCase()}.`} />}</tbody></table></div>
  </section>;
}

function UnitCreateForm({ saving, error, setError, submit }: { saving: boolean; error: string; setError: React.Dispatch<React.SetStateAction<string>>; submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> }) {
  const [prefix, setPrefix] = React.useState('');
  const [province, setProvince] = React.useState('');
  const [managerDraft, setManagerDraft] = React.useState<DraftPerson>({ name: '', nip: '', phone: '' });
  const [appraiserDraft, setAppraiserDraft] = React.useState<DraftPerson>({ name: '', nip: '', phone: '' });
  const [adminDraft, setAdminDraft] = React.useState<DraftAdmin>({ name: '', email: '', phone: '', password: '' });
  const [managers, setManagers] = React.useState<Person[]>([]);
  const [appraisers, setAppraisers] = React.useState<Person[]>([]);
  const [admins, setAdmins] = React.useState<Admin[]>([]);
  const [showPassword, setShowPassword] = React.useState(false);
  const unitCode = formatUnitCode(province, prefix);

  function addAdmin() {
    if (!adminDraft.name.trim() || !adminDraft.email.trim() || !adminDraft.phone.trim() || adminDraft.password.length < 8) {
      setError('Lengkapi data akun admin, termasuk password minimal 8 karakter.');
      return;
    }
    if (admins.some((admin) => admin.email.toLowerCase() === adminDraft.email.trim().toLowerCase())) {
      setError('Email akun admin tidak boleh ganda.');
      return;
    }
    setAdmins((current) => [...current, { ...adminDraft, name: adminDraft.name.trim(), email: adminDraft.email.trim(), phone: adminDraft.phone.trim() }]);
    setAdminDraft({ name: '', email: '', phone: '', password: '' });
    setError('');
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!admins.length) {
      event.preventDefault();
      setError('Tambahkan minimal satu akun admin unit sebelum menyimpan.');
      return;
    }
    await submit(event);
  }

  return <form onSubmit={onSubmit} className="unit-reference-form">
    <p aria-live="polite" className="unit-reference-error">{error}</p>
    <section className="unit-reference-card unit-reference-unit-card naviga-entry">
      <div className="unit-reference-title"><Building2 /><h2>Informasi Unit</h2></div>
      <div className="unit-reference-unit-grid">
        <Field id="unit-name" name="name" label="Nama unit" placeholder="Masukkan nama unit" disabled={saving} />
        <Field id="unit-prefix" name="prefix" label="Kode unit" placeholder="Masukkan kode unit" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={prefix} onChange={(event) => setPrefix(event.target.value.replace(/\D/g, '').slice(0, 5))} disabled={saving} />
        <div className="unit-reference-field"><Label>Domisili <span>*</span></Label><Select name="province" value={province} onValueChange={setProvince} required disabled={saving}><SelectTrigger aria-label="Domisili" className="unit-reference-select"><SelectValue placeholder="Pilih domisili" /></SelectTrigger><SelectContent className="unit-admin-select-content">{INDONESIAN_PROVINCES.map((item) => <SelectItem key={item} value={item} className="unit-admin-select-item">{item}</SelectItem>)}</SelectContent></Select></div>
        <Field id="unit-phone" name="phone" label="Nomor telepon" placeholder="Masukkan nomor telepon" disabled={saving} />
        <div className="unit-reference-field unit-reference-address"><Label htmlFor="unit-address">Alamat <span>*</span></Label><textarea id="unit-address" name="address" required placeholder="Masukkan alamat lengkap unit" className="unit-reference-textarea" disabled={saving} /></div>
        <Field id="unit-map" name="mapUrl" label="Link Google Maps Alamat" placeholder="Masukkan link Google Maps alamat unit" type="url" disabled={saving} />
        <div className="unit-code-preview"><span>Kode tampilan unit</span><strong>{unitCode || 'CP-XXX-00000'}</strong><small>Terbentuk otomatis dari domisili dan kode unit 5 digit.</small></div>
      </div>
    </section>

    <div className="unit-reference-two-columns">
      <PersonCard title="Pengelola Unit" Icon={UsersRound} actionLabel="Tambahkan pengelola" draft={managerDraft} setDraft={setManagerDraft} people={managers} setPeople={setManagers} saving={saving} />
      <PersonCard title="Penaksir Unit" Icon={UserCheck} actionLabel="Tambahkan penaksir" draft={appraiserDraft} setDraft={setAppraiserDraft} people={appraisers} setPeople={setAppraisers} saving={saving} />
    </div>

    <section className="unit-reference-card unit-reference-admin-card">
      <div className="unit-reference-card-head"><div className="unit-reference-title"><BadgeCheck /><h2>Akun Admin Unit</h2></div><Button type="button" variant="outline" className="unit-reference-add" onClick={addAdmin} disabled={saving}><Plus />Tambahkan akun admin unit</Button></div>
      <div className="unit-reference-admin-inputs">
        <Field id="admin-name" label="Nama admin unit" placeholder="Masukkan nama admin unit" value={adminDraft.name} onChange={(event) => setAdminDraft((current) => ({ ...current, name: event.target.value }))} disabled={saving} />
        <Field id="admin-email" label="Email akun" type="email" placeholder="Masukkan email akun" value={adminDraft.email} onChange={(event) => setAdminDraft((current) => ({ ...current, email: event.target.value }))} disabled={saving} />
        <Field id="admin-phone" label="Nomor telepon" placeholder="Masukkan nomor telepon" value={adminDraft.phone} onChange={(event) => setAdminDraft((current) => ({ ...current, phone: event.target.value }))} disabled={saving} />
        <Field id="admin-password" label="Password awal" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={adminDraft.password} onChange={(event) => setAdminDraft((current) => ({ ...current, password: event.target.value }))} disabled={saving}>{<button type="button" className="unit-admin-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>}</Field>
      </div>
      <div className="unit-reference-table-wrap"><table className="unit-reference-table unit-reference-admin-table"><thead><tr><th>Nama admin unit</th><th>Email akun</th><th>Nomor telepon</th><th>Terakhir diperbarui</th><th aria-label="Aksi">Aksi</th></tr></thead><tbody>{admins.length ? admins.map((admin) => <tr key={admin.email}><td>{admin.name}</td><td>{admin.email}</td><td>{admin.phone}</td><td>Belum disimpan</td><td><button type="button" className="unit-reference-more" onClick={() => setAdmins((current) => current.filter((candidate) => candidate !== admin))} aria-label={`Hapus ${admin.name}`} title={`Hapus ${admin.name}`}><MoreVertical /></button></td></tr>) : <EmptyRows colSpan={5} message="Belum ada akun admin unit." />}</tbody></table></div>
    </section>
    <input type="hidden" name="domicile" value={province} /><input type="hidden" name="managers" value={JSON.stringify(managers)} /><input type="hidden" name="appraisers" value={JSON.stringify(appraisers)} /><input type="hidden" name="admins" value={JSON.stringify(admins)} />
    <footer className="unit-reference-footer"><Button type="submit" className="unit-reference-save" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? 'Menyimpan...' : 'Simpan unit'}</Button><Button asChild type="button" variant="outline" className="unit-reference-cancel" aria-disabled={saving}><Link href="/unit-management">Batal</Link></Button></footer>
  </form>;
}

function AdminOnlyForm({ units, saving, submit }: { units: Unit[]; saving: boolean; submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> }) {
  const [unitId, setUnitId] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  return <form onSubmit={submit} className="unit-reference-form"><section className="unit-reference-card"><div className="unit-reference-title"><BadgeCheck /><h2>Tambah akun admin unit</h2></div><div className="unit-reference-admin-inputs mt-5"><div className="unit-reference-field"><Label>Unit terkait <span>*</span></Label><Select name="unitId" value={unitId} onValueChange={setUnitId} required disabled={saving || !units.length}><SelectTrigger className="unit-reference-select"><SelectValue placeholder="Pilih unit terkait" /></SelectTrigger><SelectContent className="unit-admin-select-content">{units.map((unit) => <SelectItem key={unit.id} value={unit.id} className="unit-admin-select-item">{unit.name} — {unit.unitCode || unit.prefix}</SelectItem>)}</SelectContent></Select></div><Field id="admin-only-name" name="name" label="Nama admin unit" placeholder="Masukkan nama admin" disabled={saving} /><Field id="admin-only-email" name="email" label="Email akun" type="email" placeholder="admin@pegadaian.co.id" disabled={saving} /><Field id="admin-only-phone" name="phone" label="Nomor telepon" placeholder="081234567890" disabled={saving} /><Field id="admin-only-password" name="password" label="Password awal" type={showPassword ? 'text' : 'password'} minLength={8} placeholder="Minimal 8 karakter" disabled={saving}>{<button type="button" className="unit-admin-password-toggle" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>}</Field></div></section><footer className="unit-reference-footer"><Button type="submit" className="unit-reference-save" disabled={saving || !unitId}><Save />Simpan akun</Button><Button asChild type="button" variant="outline" className="unit-reference-cancel"><Link href="/unit-management">Batal</Link></Button></footer></form>;
}

export default function UnitCreateClient({ units, mode }: { units: Unit[]; mode: 'unit' | 'admin' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaving(true);
    try { const formData = new FormData(event.currentTarget); if (mode === 'unit') await registerUnitAction(formData); else await registerUnitAdminAction(formData); toast({ title: mode === 'unit' ? 'Unit ditambahkan' : 'Akun admin ditambahkan', description: 'Data siap digunakan oleh dashboard unit.', tone: 'success' }); router.push('/unit-management'); router.refresh(); }
    catch (reason) { const message = reason instanceof Error ? reason.message : 'Periksa data dan coba lagi.'; setError(message); toast({ title: 'Data tidak dapat disimpan', description: message, variant: 'destructive', tone: 'error' }); }
    finally { setSaving(false); }
  }
  return <main className="unit-reference-page"><header className="unit-reference-heading"><div className="unit-reference-breadcrumb"><Link href="/unit-management"><ChevronLeft />Manajemen Unit</Link><span>/</span><strong>{mode === 'unit' ? 'Tambah Unit' : 'Tambah akun'}</strong></div><div className="unit-reference-hero"><span><ShieldPlus /></span><div><h1>{mode === 'unit' ? 'Tambah Unit' : 'Tambah akun admin unit'}</h1><p>{mode === 'unit' ? 'Lengkapi informasi unit baru untuk menambah data ke sistem.' : 'Buat akun admin baru untuk mengelola unit terkait.'}</p></div></div></header>{mode === 'unit' ? <UnitCreateForm saving={saving} error={error} setError={setError} submit={submit} /> : <AdminOnlyForm units={units} saving={saving} submit={submit} />}</main>;
}
