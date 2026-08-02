'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { LocalSession } from '@/lib/auth-session';
import { authClient } from '@/lib/auth-client';
import styles from './main-shell.module.css';
import { useToast } from '@/hooks/use-toast';

const SessionContext = React.createContext<LocalSession | null>(null);

export function useLocalSession(): LocalSession {
  const session = React.useContext(SessionContext);
  if (!session) throw new Error('Sesi tidak tersedia.');
  return session;
}

export default function MainShell({ children, user }: { children: React.ReactNode; user: LocalSession }) {
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const scrollFrameRef = React.useRef<number | null>(null);
  const isJatuhTempoActive = pathname.startsWith('/pdf-broadcast') || pathname.startsWith('/xlsx-broadcast');
  const isUnitUser = user.role === 'unit';
  const unitName = user.unitName?.trim() || 'NAVIGA Unit';
  const headerTitle = isUnitUser ? `${unitName} Control Center` : 'NAVIGA Control Center';
  const headerDescription = isUnitUser
    ? `Kelola tugas, jatuh tempo broadcast, dan riwayat operasional ${unitName}.`
    : 'Monitoring, tugas, broadcast, riwayat, dan manajemen unit dalam satu platform.';
  const menuButtonClassName = 'naviga-sidebar-menu-button h-14 rounded-[16px] border border-[#edf2f3] bg-white/70 px-4 font-medium text-[#334e68] shadow-[0_7px_18px_rgba(16,42,67,.045)] transition-[transform,background-color,border-color,box-shadow,color] duration-200 focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 active:scale-[.98]';

  React.useEffect(() => {
    const getScrollTop = () => {
      if (typeof document === 'undefined') return 0;

      const root = document.scrollingElement ?? document.documentElement;
      return root?.scrollTop ?? window.scrollY ?? 0;
    };

    const updateScroll = () => {
      if (scrollFrameRef.current !== null) return;

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        const scrollTop = getScrollTop();
        const progress = Math.min(scrollTop / 220, 1);
        const nextScrolled = scrollTop > 12;
        const header = headerRef.current;

        header?.style.setProperty('--naviga-glass-alpha', (0.98 - progress * 0.78).toFixed(3));
        header?.style.setProperty('--naviga-glass-blur', `${(progress * 18).toFixed(1)}px`);
        setIsScrolled((current) => (current === nextScrolled ? current : nextScrolled));
        scrollFrameRef.current = null;
      });
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    document.addEventListener('scroll', updateScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScroll);
      document.removeEventListener('scroll', updateScroll);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

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
    <SessionContext.Provider value={user}>
      <SidebarProvider className={cn('naviga-shell', styles.navigaShell)} style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
        <Sidebar variant="floating" className={cn('naviga-sidebar', styles.navigaSidebar)}>
          <SidebarHeader className="naviga-sidebar-brand relative h-20 shrink-0 overflow-hidden border-b border-[#d5ece9] p-0">
            <svg aria-hidden="true" className="pointer-events-none absolute -right-3 top-0 h-20 w-32 text-white/75" viewBox="0 0 220 170" fill="none">
              {Array.from({ length: 11 }).map((_, index) => (
                <path key={index} d={`M${12 + index * 2} 168C52 ${118 - index * 3} 90 ${148 - index * 2} 124 ${93 - index * 2}C150 ${50 - index} 185 ${58 - index * 2} 224 ${12 + index * 2}`} stroke="currentColor" strokeWidth="1.4" opacity={0.85 - index * 0.045} />
              ))}
            </svg>
            <Link href="/dashboard" className="naviga-sidebar-brand-link relative z-10 flex h-full w-full items-center gap-3 px-4 text-[#003f46] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:ring-inset active:scale-[.98]">
              <Image src="/logo.ico" alt="NAVIGA" width={44} height={44} className="h-11 w-11 shrink-0" priority />
              <span className="font-headline text-[26px] font-medium tracking-[-.04em]">NAV<span className="text-[#0aa99c]">IGA</span></span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="naviga-sidebar-content px-4 py-4">
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={menuButtonClassName} isActive={pathname.startsWith('/dashboard')} tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="!overflow-visible !text-clip !whitespace-normal text-[13px] leading-tight">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={menuButtonClassName} isActive={pathname.startsWith('/tasks')} tooltip="Lacak Tugas">
                  <Link href="/tasks">
                    <ClipboardList className="h-5 w-5" />
                    <span className="!overflow-visible !text-clip !whitespace-normal text-[13px] leading-tight">Lacak Tugas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      isActive={isJatuhTempoActive}
                      tooltip="Jatuh Tempo Broadcast"
                      className={`${menuButtonClassName} w-full justify-between data-[state=open]:border-[#8fd8d0] data-[state=open]:bg-[#f4fbfa] data-[state=open]:text-[#087f76]`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CalendarClock className="h-5 w-5 shrink-0" />
                        <span className="whitespace-normal text-[13px] leading-[1.2]">Jatuh Tempo Broadcast</span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 rounded-xl p-1.5 shadow-lg border-sidebar-border/80" align="start" side="right" sideOffset={8}>
                    <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pilih Jenis Broadcast
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
                        pathname.startsWith('/pdf-broadcast') && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href="/pdf-broadcast">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                          <Scale className="h-4 w-4" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-medium leading-none">Gadaian Broadcast</span>
                          <span className="text-[11px] text-muted-foreground leading-none">Daftar Jatuh Tempo Barang Gadaian</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors mt-0.5",
                        pathname.startsWith('/xlsx-broadcast') && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href="/xlsx-broadcast">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                          <Banknote className="h-4 w-4" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-medium leading-none">Angsuran Broadcast</span>
                          <span className="text-[11px] text-muted-foreground leading-none">Daftar Jatuh Tempo Tagihan Angsuran</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
              {user.role === 'superadmin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className={menuButtonClassName} isActive={pathname.startsWith('/unit-management')} tooltip="Manajemen Unit">
                    <Link href="/unit-management">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="!overflow-visible !text-clip !whitespace-normal text-[13px] leading-tight">Manajemen Unit</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={menuButtonClassName} isActive={pathname.startsWith('/history')} tooltip="Riwayat">
                  <Link href="/history">
                    <History className="h-5 w-5" />
                    <span className="!overflow-visible !text-clip !whitespace-normal text-[13px] leading-tight">Riwayat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="naviga-sidebar-footer p-4 pt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="naviga-sidebar-profile h-[82px] w-full justify-start gap-3 rounded-[18px] border border-[#e4edef] bg-white/90 px-3 py-3 shadow-[0_10px_28px_rgba(16,42,67,.07)] transition-[transform,border-color,box-shadow,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 active:scale-[.98]">
                  <Avatar className="h-11 w-11 shrink-0 border-[3px] border-white shadow-[0_0_0_3px_#bde9e4]">
                    <AvatarImage src={`/api/users/${encodeURIComponent(user.userId)}/photo`} alt={`Foto profil ${user.name}`} />
                    <AvatarFallback className="bg-white text-lg font-semibold text-[#087f76] shadow-[inset_0_1px_1px_rgba(255,255,255,.95)]">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[13px] font-semibold text-[#123b47]">{user.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#718096]">{user.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
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
            ref={headerRef}
            className="naviga-topbar sticky top-0 z-20 flex h-[94px] items-center justify-between gap-4 px-4 md:px-9"
            data-scrolled={isScrolled ? 'true' : 'false'}
          >
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-[26px] font-bold leading-tight tracking-[-0.025em] text-[#003f46]">{headerTitle}</span>
              <span className="mt-1 text-[12px] font-medium leading-tight text-[#0b4950]">{headerDescription}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Image src="/PegadaianLogo.png" alt="Logo Pegadaian" width={97} height={50} className="h-[50px] w-auto shrink-0 object-contain" priority />
            </div>
          </header>
          <PageTransition>
            {children}
          </PageTransition>
        </SidebarInset>
      </SidebarProvider>
    </SessionContext.Provider>
  );
}
