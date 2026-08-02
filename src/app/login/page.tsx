'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email({ message: 'Masukkan alamat email yang valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email(data);
      if (result.error || !result.data?.user) {
        toast({ title: 'Login Gagal', description: result.error?.message ?? 'Email atau sandi tidak valid.', variant: 'destructive', tone: 'error' });
        return;
      }

      toast({ title: 'Login Berhasil', description: `Selamat datang, ${result.data.user.name}.`, tone: 'success' });
      router.replace('/dashboard');
    } catch {
      toast({ title: 'Login Gagal', description: 'Layanan masuk tidak dapat dihubungi.', variant: 'destructive', tone: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-card-header">
          <Image src="/logo.ico" alt="NAVIGA" width={84} height={84} className="login-app-mark" priority />
          <h1 id="login-title" className="login-title">NAV<span>IGA</span></h1>
          <p className="login-description">Masuk dengan akun Superadmin atau akun unit yang telah terdaftar.</p>
          <div className="login-title-rule" aria-hidden="true" />
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="login-form">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="login-label">Email</FormLabel>
                  <div className="login-field">
                    <Mail className="login-field-icon" aria-hidden="true" />
                    <FormControl>
                      <Input className="login-input !border-0 !bg-transparent !shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0" placeholder="user@pegadaian.co.id" autoComplete="email" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="login-label">Password</FormLabel>
                  <div className="login-field">
                    <LockKeyhole className="login-field-icon" aria-hidden="true" />
                    <FormControl>
                      <Input className="login-input pr-12 !border-0 !bg-transparent !shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="login-password-toggle" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="login-submit" disabled={isLoading}>
              <span>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Memproses...' : 'Log in'}
              </span>
            </Button>
          </form>
        </Form>

        <div className="login-trust" aria-label="Aman, terpercaya, profesional">
          <span /> Aman <i /> Terpercaya <i /> Profesional <span />
        </div>
      </section>

      <footer className="login-brand">
        <Image src="/PegadaianLogo.png" alt="Pegadaian" width={168} height={87} className="login-brand-image" priority />
        <p>Mengatasi Masalah Tanpa Masalah</p>
      </footer>

    </main>
  );
}
