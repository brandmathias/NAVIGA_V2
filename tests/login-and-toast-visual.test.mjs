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
  assert.match(styles, /\.login-field:hover[^}]*transform: translateY\(-1px\)/);
  assert.match(styles, /\.login-field:has\(input:active\) \.login-field-icon/);
  assert.match(styles, /\.login-submit:active/);
  assert.doesNotMatch(styles, /transform: scale\(\.995\)/);
  assert.match(styles, /\.login-brand/);
  assert.match(styles, /\.login-brand-image \{ width: 7\.75rem/);
});

test('all toast variants use consistent entrance and exit motion', async () => {
  const [toast, toaster, styles] = await Promise.all([
    readFile('src/components/ui/toast.tsx', 'utf8'),
    readFile('src/components/ui/toaster.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
  ]);

  assert.match(toast, /toast-shell/);
  assert.match(toaster, /ToastCircleCheck|CircleCheck/);
  assert.match(toaster, /CircleAlert/);
  assert.match(styles, /@keyframes toast-enter/);
  assert.match(styles, /@keyframes toast-exit/);
  assert.match(styles, /\.toast-shell\[data-state="open"\]/);
  assert.match(styles, /\.toast-shell\.destructive/);
  assert.match(styles, /\.toast-shell\.destructive \{[^}]*color: #9b2020/);
  assert.match(toast, /destructive group border-destructive bg-destructive text-\[#9b2020\]/);
});
