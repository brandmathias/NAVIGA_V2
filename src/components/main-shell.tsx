'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { LogOut, LayoutDashboard, ClipboardList, ChevronDown, CalendarClock, Scale, Banknote, History, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { LocalSession } from '@/lib/local-auth';

const SessionContext = React.createContext<LocalSession | null>(null);

export function useLocalSession(): LocalSession {
  const session = React.useContext(SessionContext);
  if (!session) throw new Error('Sesi tidak tersedia.');
  return session;
}

export default function MainShell({ children, user }: { children: React.ReactNode; user: LocalSession }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const isJatuhTempoActive = pathname.startsWith('/pdf-broadcast') || pathname.startsWith('/xlsx-broadcast');

  React.useEffect(() => {
    const updateScroll = () => {
      const nextScrolled = window.scrollY > 12;
      setIsScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });

    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

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
    <SessionContext.Provider value={user}>
      <SidebarProvider className="naviga-shell bg-[#f7fbfc]" style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
        <Sidebar variant="floating" className="naviga-sidebar">
          <SidebarHeader className="border-b border-[#e4eff1] p-5">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-primary transition-transform duration-200 hover:translate-x-0.5 active:scale-[.98]">
              <Image src="/logo.ico" alt="App Logo" width={40} height={40} />
              <span className="font-headline text-lg">NAVIGA</span>
            </button>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4">
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton className="h-11 rounded-xl px-3.5 transition-[transform,background-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(.2,0,0,1)] hover:-translate-y-px hover:shadow-[0_9px_18px_rgba(10,84,89,.08)] active:translate-y-0 active:scale-[.99]" onClick={() => router.push('/dashboard')} isActive={pathname.startsWith('/dashboard')} tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="h-11 rounded-xl px-3.5 transition-[transform,background-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(.2,0,0,1)] hover:-translate-y-px hover:shadow-[0_9px_18px_rgba(10,84,89,.08)] active:translate-y-0 active:scale-[.99]" onClick={() => router.push('/tasks')} isActive={pathname.startsWith('/tasks')} tooltip="Lacak Tugas">
                  <ClipboardList />
                  <span>Lacak Tugas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      isActive={isJatuhTempoActive}
                      tooltip="Jatuh Tempo Broadcast"
                      className="h-11 w-full justify-between rounded-xl px-3.5 transition-[transform,background-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(.2,0,0,1)] hover:-translate-y-px hover:shadow-[0_9px_18px_rgba(10,84,89,.08)] active:translate-y-0 active:scale-[.99] data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        <CalendarClock className="h-4 w-4 shrink-0" />
                        <span className="truncate">Jatuh Tempo Broadcast</span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 rounded-xl p-1.5 shadow-lg border-sidebar-border/80" align="start" side="right" sideOffset={8}>
                    <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pilih Jenis Broadcast
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={() => router.push('/pdf-broadcast')}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
                        pathname.startsWith('/pdf-broadcast') && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium leading-none">Gadaian Broadcast</span>
                        <span className="text-[11px] text-muted-foreground leading-none">Daftar Jatuh Tempo Barang Gadaian</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push('/xlsx-broadcast')}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors mt-0.5",
                        pathname.startsWith('/xlsx-broadcast') && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium leading-none">Angsuran Broadcast</span>
                        <span className="text-[11px] text-muted-foreground leading-none">Daftar Jatuh Tempo Tagihan Angsuran</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
              {user.role === 'superadmin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton className="h-11 rounded-xl px-3.5 transition-[transform,background-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(.2,0,0,1)] hover:-translate-y-px hover:shadow-[0_9px_18px_rgba(10,84,89,.08)] active:translate-y-0 active:scale-[.99]" onClick={() => router.push('/unit-management')} isActive={pathname.startsWith('/unit-management')} tooltip="Manajemen Unit">
                    <ShieldCheck />
                    <span>Manajemen Unit</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton className="h-11 rounded-xl px-3.5 transition-[transform,background-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(.2,0,0,1)] hover:-translate-y-px hover:shadow-[0_9px_18px_rgba(10,84,89,.08)] active:translate-y-0 active:scale-[.99]" onClick={() => router.push('/history')} isActive={pathname.startsWith('/history')} tooltip="Riwayat">
                  <History />
                  <span>Riwayat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto w-full justify-start gap-3 rounded-2xl bg-white/70 px-3 py-3 shadow-[0_10px_25px_rgba(9,78,88,.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-white hover:shadow-[0_14px_28px_rgba(9,78,88,.10)] active:translate-y-0 active:scale-[.99]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Keluar...' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header
            className="naviga-topbar sticky top-0 z-20 flex h-[94px] items-center justify-between gap-4 px-4 md:px-9"
            data-scrolled={isScrolled ? 'true' : 'false'}
          >
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-[26px] font-bold leading-tight tracking-[-0.025em] text-[#003f46]">NAVIGA Control Center</span>
              <span className="mt-1 text-[12px] font-medium leading-tight text-[#0b4950]">Monitoring, tugas, broadcast, riwayat, dan manajemen unit dalam satu platform.</span>
            </div>
            <Image src="/PegadaianLogo.png" alt="Logo Pegadaian" width={97} height={50} className="h-[50px] w-auto shrink-0 object-contain" priority />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SessionContext.Provider>
  );
}
