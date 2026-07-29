'use client';

import * as React from 'react';
import { Building2, KeyRound, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { registerUnitAction } from './actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Unit = {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  email: string;
};

export default function UnitManagementClient({ units: initialUnits }: { units: Unit[] }) {
  const { toast } = useToast();
  const [units, setUnits] = React.useState(initialUnits);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(null);
    setIsSaving(true);

    try {
      const unit = await registerUnitAction(new FormData(form)) as Unit;
      setUnits((current) => [...current, unit].sort((left, right) => left.name.localeCompare(right.name)));
      form.reset();
      toast({ title: 'Unit ditambahkan', description: `${unit.name} siap menggunakan filter SBG ${unit.prefix}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Periksa data akun dan coba lagi.';
      setFormError(message);
      toast({
        title: 'Unit tidak dapat ditambahkan',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:gap-8 md:p-8">
      <section className="rounded-2xl border bg-background p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">Area Superadmin</span>
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">Manajemen Unit</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Setiap akun unit dibatasi oleh lima digit awal SBG atau nomor angsuran. Tambahkan unit baru saat kode UPC sudah tersedia.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit px-3 py-1">{units.length} unit aktif</Badge>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl"><Building2 className="h-5 w-5 text-primary" /> Unit terdaftar</CardTitle>
            <CardDescription>Akun unit hanya membaca dokumen dengan awalan nomor yang sesuai.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {units.map((unit) => (
                <div key={unit.id} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{unit.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{unit.email}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Badge variant="outline">SBG {unit.prefix}</Badge>
                    <Badge variant={unit.active ? 'secondary' : 'destructive'}>{unit.active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </div>
                </div>
              ))}
              {!units.length && <p className="p-8 text-center text-sm text-muted-foreground">Belum ada unit yang terdaftar.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Plus className="h-5 w-5 text-primary" /> Tambah unit</CardTitle>
            <CardDescription>Buat unit dan satu akun admin unit secara bersamaan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <p aria-live="polite" className="min-h-5 text-sm text-destructive">
                {formError}
              </p>
              <div className="space-y-2">
                <Label htmlFor="unit-name">Nama unit</Label>
                <Input id="unit-name" name="name" placeholder="Pegadaian Garuda" required disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-prefix">Prefix SBG / angsuran</Label>
                <Input id="unit-prefix" name="prefix" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="5 angka, mis. 11787" required disabled={isSaving} />
                <p className="min-h-5 text-xs text-muted-foreground">Gunakan lima digit pertama dari nomor SBG atau angsuran.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-email">Email akun unit</Label>
                <Input id="unit-email" name="email" type="email" placeholder="upc.garuda@pegadaian.co.id" required disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-password">Password awal</Label>
                <Input id="unit-password" name="password" type="password" minLength={8} placeholder="Minimal 8 karakter" required disabled={isSaving} />
              </div>
              <Button type="submit" className="w-full whitespace-nowrap transition-transform duration-150 [transition-timing-function:cubic-bezier(0.2,0,0,1)] active:scale-[0.98]" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {isSaving ? 'Menyimpan...' : 'Buat unit dan akun'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
