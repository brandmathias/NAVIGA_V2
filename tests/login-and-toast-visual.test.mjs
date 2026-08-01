import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('login presents the supplied backdrop with a compact form, clean brand, and stable focus', async () => {
  const [page, styles] = await Promise.all([
    readFile('src/app/login/page.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
  ]);

  await Promise.all([
    access('public/naviga-login-background.png'),
    access('public/PegadaianLogo.png'),
  ]);

  assert.match(page, /login-screen/);
  assert.match(page, /login-field/);
  assert.match(page, /PegadaianLogo\.png/);
  assert.match(page, /login-brand/);
  assert.match(page, /<h1 id="login-title" className="login-title">NAV<span>IGA<\/span><\/h1>/);
  assert.doesNotMatch(page, /NAVIGA <span>Admin<\/span>/);
  assert.doesNotMatch(page, /pegadaian-logo-horizontal\.webp/);
  assert.match(page, /focus-visible:!ring-0/);
  assert.match(styles, /naviga-login-background\.png/);
  assert.match(styles, /radial-gradient\(115% 84% at 6% 0%, rgba\(255, 255, 255, \.62\)/);
  assert.match(styles, /backdrop-filter: blur\(22px\) saturate\(1\.22\)/);
  assert.match(styles, /\.login-card::before/);
  assert.match(styles, /\.login-input:-webkit-autofill/);
  assert.match(styles, /background: linear-gradient\(135deg, #078f86, #006d68\)/);
  assert.match(styles, /\.login-field:hover/);
  assert.match(styles, /\.login-field:focus-within/);
  assert.match(styles, /\.login-field::before/);
  assert.match(styles, /\.login-field::after/);
  assert.match(styles, /\.login-field:focus-within::after[^}]*transform: scaleX\(1\)/);
  assert.match(styles, /\.login-field:hover[^}]*transform: translateY\(-2px\)/);
  assert.match(styles, /\.login-field:has\(input:active\) \.login-field-icon/);
  assert.match(styles, /\.login-submit:active/);
  assert.match(styles, /\.login-submit::before/);
  assert.match(styles, /\.login-submit:hover[^}]*transform: translateY\(-2px\)/);
  assert.match(styles, /\.login-submit:active[^}]*transform: translateY\(1px\) scale\(\.98\)/);
  assert.doesNotMatch(styles, /transform: scale\(\.995\)/);
  assert.match(styles, /\.login-brand/);
  assert.match(styles, /\.login-brand-image \{ width: 7\.75rem/);
});

test('all toast variants use contextual icons and motion for operational actions', async () => {
  const [toast, toaster, styles, pdfPage, xlsxPage, unitPage, mainShell, profilePage] = await Promise.all([
    readFile('src/components/ui/toast.tsx', 'utf8'),
    readFile('src/components/ui/toaster.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
    readFile('src/app/(main)/pdf-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/unit-management/unit-management-client.tsx', 'utf8'),
    readFile('src/components/main-shell.tsx', 'utf8'),
    readFile('src/app/(main)/profile/page.tsx', 'utf8'),
  ]);

  assert.match(toast, /toast-shell/);
  assert.match(toast, /max-w-\[22rem\] items-start gap-3/);
  assert.match(toaster, /ToastCircleCheck|CircleCheck/);
  assert.match(toaster, /CircleAlert/);
  assert.match(toaster, /resolveToastTone/);
  assert.match(toaster, /ClipboardCheck/);
  assert.match(toaster, /MessageCircle/);
  assert.match(toaster, /LoaderCircle/);
  assert.match(toaster, /<span className="toast-status-icon"/);
  assert.match(toaster, /className="toast-content"/);
  assert.match(styles, /@keyframes toast-enter/);
  assert.match(styles, /@keyframes toast-exit/);
  assert.match(styles, /\.toast-shell\[data-state="open"\]/);
  assert.match(styles, /\.toast-shell\.destructive/);
  assert.match(styles, /\.toast-shell\.destructive \{[^}]*--toast-ink: #8f2020/);
  assert.match(toast, /destructive group border-destructive text-\[#9b2020\]/);
  assert.doesNotMatch(toast, /destructive group border-destructive bg-destructive/);
  assert.match(toaster, /strokeWidth=\{2\.25\}/);
  assert.match(styles, /\.toast-title \{[^}]*font-weight: 750/);
  assert.match(styles, /\.toast-description \{[^}]*font-weight: 600/);
  assert.match(styles, /\.toast-shell::after/);
  assert.match(styles, /@keyframes toast-icon-enter/);
  assert.match(styles, /@keyframes toast-progress/);
  assert.match(styles, /\.toast-shell\[data-tone="copy"\]/);
  assert.match(styles, /\.toast-shell\[data-tone="message"\]/);
  assert.match(styles, /\.toast-shell\[data-tone="processing"\]/);
  assert.match(pdfPage, /tone: 'copy'/);
  assert.match(pdfPage, /tone: 'message'/);
  assert.match(pdfPage, /tone: 'processing'/);
  assert.match(xlsxPage, /tone: 'copy'/);
  assert.match(xlsxPage, /tone: 'processing'/);
  assert.match(unitPage, /tone: 'success'/);
  assert.match(mainShell, /Logout berhasil/);
  assert.match(profilePage, /Logout berhasil/);
});
