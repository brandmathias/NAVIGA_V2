'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building, LogOut, Mail, ShieldCheck, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalSession } from '@/components/main-shell';

export default function ProfilePage() {
  const router = useRouter();
  const user = useLocalSession();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout gagal.');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muted/20 p-4 md:gap-8 md:p-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Avatar className="mb-4 h-24 w-24">
              <AvatarFallback className="text-3xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>Detail akun sesi lokal Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg border bg-background p-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border bg-background p-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Alamat Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border bg-background p-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Unit/Cabang</p>
                <p className="font-medium">{user.upc === 'all' ? 'Semua Cabang (Super Admin)' : user.upc}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border bg-background p-3">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Peran Akses</p>
                <p className="font-medium">{user.role === 'superadmin' ? 'Superadmin' : 'Admin Unit'}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="mt-6 w-full" disabled={isLoggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Keluar...' : 'Keluar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
