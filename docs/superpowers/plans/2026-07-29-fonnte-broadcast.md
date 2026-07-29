# Fonnte Broadcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Queue scoped PDF gadai and phone-equipped XLSX angsuran notifications through Fonnte, one recipient per 60 seconds, without exposing the token or claiming delivery.

**Architecture:** A small server-only Fonnte client owns configuration and the outbound HTTP request. A shared server action verifies the signed session, active unit scope, identifiers, and phone values before it generates recipient-specific messages and queues one Fonnte batch. Both client pages call that action only after an explicit confirmation and record acceptance locally.

**Tech Stack:** Next.js 15 Server Actions, Node.js fetch and FormData, TypeScript/React, existing local authentication, Node test runner, xlsx.

## Global Constraints

- FONNTE_TOKEN exists only in ignored environment configuration and is never imported into a client component.
- FONNTE_ENABLED defaults to disabled; disabled configuration must fail before any network request.
- Every Fonnte recipient uses delay: "60"; acceptance is not delivery.
- Superadmin is limited to active registered prefixes; Admin Unit is limited to its signed five-digit prefix.
- XLSX without a valid phone remains copy-message and Piper TTS only.
- Tests use injected mocked fetch; fixtures never contact Fonnte or WhatsApp.

---

## File Structure

- src/lib/fonnte-client.js: validates configuration and sends one Fonnte batch.
- src/lib/fonnte-client.d.ts: exposes the CommonJS helper to TypeScript server actions.
- src/lib/broadcast-queue.js: derives allowed prefixes, validates records, builds messages, and delegates to the Fonnte client.
- src/lib/broadcast-queue.d.ts: typed payloads and queue result for page actions.
- src/app/(main)/broadcast/fonnte-actions.ts: Server Action wrapper around the shared queue helper.
- src/app/(main)/pdf-broadcast/page.tsx: replaces text wa.me send controls with confirmation and queue actions.
- src/app/(main)/xlsx-broadcast/page.tsx: adds selection plus queue controls only for valid phone rows.
- tests/fonnte-client.test.mjs: mocked request and disabled-state coverage.
- tests/fonnte-queue.test.mjs: server validation/scope coverage.
- tests/contact-safety.test.mjs: assertions for no text-send tabs and truthful acceptance copy.
- tmp/fonnte-fixtures: ignored PDF/XLSX UI-import fixtures for Brando Mathias Zusriadi.

### Task 1: Server-only Fonnte client

**Files:**

- Create: src/lib/fonnte-client.js
- Create: src/lib/fonnte-client.d.ts
- Create: tests/fonnte-client.test.mjs
- Modify: README.md

**Interfaces:**

- Produces: queueFonnteMessages({ recipients, fetchImpl? }) and getFonnteStatus().
- Consumes: recipients as an array of normalized target and message values.

- [ ] **Step 1: Write the failing tests**

~~~js
test('queues one Fonnte data batch with sixty-second recipient delays', async () => {
  const calls = [];
  await queueFonnteMessages({
    recipients: [{ target: '6281234567890', message: 'Satu' }, { target: '6282210002000', message: 'Dua' }],
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ status: true, id: 'queue-1' }), { status: 200 });
    },
  });
  assert.equal(calls[0].url, 'https://api.fonnte.com/send');
  assert.equal(calls[0].init.headers.Authorization, 'test-token');
  assert.deepEqual(JSON.parse(calls[0].init.body.get('data')).map(row => row.delay), ['60', '60']);
});

test('does not call fetch when Fonnte is disabled', async () => {
  await assert.rejects(queueFonnteMessages({
    recipients: [{ target: '6281234567890', message: 'Satu' }],
    fetchImpl: async () => { throw new Error('network'); },
  }), /belum diaktifkan/i);
});
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node --test tests/fonnte-client.test.mjs

Expected: FAIL because fonnte-client.js does not exist.

- [ ] **Step 3: Write minimal implementation**

~~~js
const FONNTE_SEND_URL = 'https://api.fonnte.com/send';
const FONNTE_DELAY_SECONDS = '60';

async function queueFonnteMessages({ recipients, fetchImpl = fetch }) {
  if (process.env.FONNTE_ENABLED !== 'true') throw new Error('Fonnte belum diaktifkan.');
  const body = new FormData();
  body.set('data', JSON.stringify(recipients.map(({ target, message }) => ({
    target, message, delay: FONNTE_DELAY_SECONDS,
  }))));
  const response = await fetchImpl(FONNTE_SEND_URL, {
    method: 'POST',
    headers: { Authorization: process.env.FONNTE_TOKEN },
    body,
  });
  // Parse the result and return only accepted count plus optional reference.
}
~~~

- [ ] **Step 4: Run test to verify it passes**

Run: node --test tests/fonnte-client.test.mjs, then npm test

Expected: PASS, and no existing regression.

- [ ] **Step 5: Commit**

~~~bash
git add src/lib/fonnte-client.js src/lib/fonnte-client.d.ts tests/fonnte-client.test.mjs README.md
git commit -m "feat: add server-only Fonnte queue client"
~~~

### Task 2: Scoped queue preparation and Server Action

**Files:**

- Create: src/lib/broadcast-queue.js
- Create: src/lib/broadcast-queue.d.ts
- Create: src/app/(main)/broadcast/fonnte-actions.ts
- Create: tests/fonnte-queue.test.mjs

**Interfaces:**

- Consumes: queueFonnteMessages, requireSession, listUnits, normalizeIndonesianWhatsAppNumber.
- Produces: queueGadaiBroadcast({ customers, template }) and queueInstallmentBroadcast({ customers, template }) returning queuedCount and optional reference.

- [ ] **Step 1: Write the failing scope tests**

~~~js
test('rejects a Wanea unit request containing a Ranotana SBG before Fonnte fetch', async () => {
  await assert.rejects(
    prepareGadaiRecipients({
      session: { role: 'unit', unitPrefix: '11787' },
      customers: [{ sbg_number: '117930000001', phone_number: '0895803416704' }],
      template: 'jatuh-tempo',
    }),
    /di luar cakupan unit/i,
  );
});

test('rejects an empty phone number instead of sending a placeholder target', async () => {
  await assert.rejects(
    prepareInstallmentRecipients({
      session: { role: 'superadmin' },
      customers: [{ account_number: '117870000001', phone_number: '' }],
      template: 'jatuh-tempo',
    }),
    /nomor WhatsApp/i,
  );
});
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node --test tests/fonnte-queue.test.mjs

Expected: FAIL because scoped queue preparation does not exist.

- [ ] **Step 3: Write minimal implementation**

~~~js
function assertAllowedIdentifier(identifier, allowedPrefixes) {
  const prefix = String(identifier ?? '').replace(/\D/g, '').slice(0, 5);
  if (!allowedPrefixes.includes(prefix)) {
    throw new Error('Data berada di luar cakupan unit akun ini.');
  }
}

async function getAllowedPrefixes(session) {
  const active = (await listUnits()).filter(unit => unit.active).map(unit => unit.prefix);
  if (session.role === 'superadmin') return active;
  if (session.unitPrefix && active.includes(session.unitPrefix)) return [session.unitPrefix];
  throw new Error('Akun unit tidak aktif atau belum memiliki prefix SBG.');
}
~~~

Generate each message in this server module using the existing PDF/XLSX wording, then invoke the Task 1 adapter. The Server Action calls requireSession() and never trusts client role or prefix.

- [ ] **Step 4: Run test to verify it passes**

Run: node --test tests/fonnte-queue.test.mjs, then npm test

Expected: PASS; out-of-scope, invalid phone, and disabled paths never reach mocked fetch.

- [ ] **Step 5: Commit**

~~~bash
git add src/lib/broadcast-queue.js src/lib/broadcast-queue.d.ts src/app/(main)/broadcast/fonnte-actions.ts tests/fonnte-queue.test.mjs
git commit -m "feat: enforce unit scope for Fonnte broadcasts"
~~~

### Task 3: PDF Fonnte controls

**Files:**

- Modify: src/app/(main)/pdf-broadcast/page.tsx
- Modify: tests/contact-safety.test.mjs

**Interfaces:**

- Consumes: queueGadaiBroadcast Server Action result and existing BroadcastCustomer selection.
- Produces: per-row and selected queue confirmation flows plus Antrean Fonnte Diterima history entries.

- [ ] **Step 1: Extend the failing UI safety test**

~~~js
assert.doesNotMatch(pdfSource, /window\.open\(whatsappUrl/);
assert.doesNotMatch(pdfSource, /Opening WhatsApp Tabs/);
assert.match(pdfSource, /Antrean Fonnte Diterima/);
assert.match(pdfSource, /queueGadaiBroadcast/);
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node --test tests/contact-safety.test.mjs

Expected: FAIL because PDF still opens text WhatsApp tabs.

- [ ] **Step 3: Replace only text-send behavior**

~~~tsx
if (!window.confirm('Antrekan pesan melalui Fonnte? Pesan berikutnya berjarak 60 detik dan penerimaan antrean bukan konfirmasi terkirim.')) return;
const result = await queueGadaiBroadcast({ customers, template: 'jatuh-tempo' });
customers.forEach(customer => logHistory(customer, 'Antrean Fonnte Diterima', 'jatuh-tempo'));
toast({
  title: 'Antrean Fonnte Diterima',
  description: 'Pesan diterima untuk diantrikan.',
});
~~~

Keep copy and Piper flows. Voice-note confirmation may keep opening the manual chat because this task is text-only Fonnte integration.

- [ ] **Step 4: Run typecheck and tests**

Run: npm run typecheck, then npm test

Expected: PASS, and UI never calls wa.me for text send.

- [ ] **Step 5: Commit**

~~~bash
git add src/app/(main)/pdf-broadcast/page.tsx tests/contact-safety.test.mjs
git commit -m "feat: queue PDF broadcasts through Fonnte"
~~~

### Task 4: XLSX phone-aware selected broadcasts

**Files:**

- Modify: src/app/(main)/xlsx-broadcast/page.tsx
- Modify: tests/contact-safety.test.mjs

**Interfaces:**

- Consumes: queueInstallmentBroadcast, normalizeIndonesianWhatsAppNumber, and existing imported rows.
- Produces: selected phone-valid XLSX records queued with the same 60-second confirmation.

- [ ] **Step 1: Add failing UI safety assertions**

~~~js
assert.match(xlsxSource, /queueInstallmentBroadcast/);
assert.match(xlsxSource, /normalizeIndonesianWhatsAppNumber/);
assert.match(xlsxSource, /Antrean Fonnte Diterima/);
assert.doesNotMatch(xlsxSource, /wa\.me/);
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node --test tests/contact-safety.test.mjs

Expected: FAIL because XLSX lacks the Fonnte action.

- [ ] **Step 3: Add minimal selection and queue behavior**

~~~tsx
const contactable = importedData.filter(customer => normalizeIndonesianWhatsAppNumber(customer.phone_number));
<Checkbox checked={selectedCustomers.has(customer.id)} onCheckedChange={checked => toggleSelection(customer.id, Boolean(checked))} />
<Button disabled={!selectedCustomers.size || isLoading} onClick={handleQueueSelected}>
  Antrekan Fonnte ({selectedCustomers.size})
</Button>
~~~

Do not hide or reject no-number rows; disable only their Fonnte action. Keep copy and Piper controls unchanged.

- [ ] **Step 4: Run typecheck and tests**

Run: npm run typecheck, then npm test

Expected: PASS, and an XLSX without No HP remains usable for copy/Piper.

- [ ] **Step 5: Commit**

~~~bash
git add src/app/(main)/xlsx-broadcast/page.tsx tests/contact-safety.test.mjs
git commit -m "feat: add phone-aware XLSX Fonnte queue"
~~~

### Task 5: Safe fixtures and end-to-end verification

**Files:**

- Create: tmp/fonnte-fixtures/fonnte-gadai-brando.pdf
- Create: tmp/fonnte-fixtures/fonnte-angsuran-brando.xlsx
- Modify: tests/e2e_pdf_upload.py
- Modify: tests/e2e_xlsx_upload.py

**Interfaces:**

- Consumes: existing local login and import flows.
- Produces: ignored parse/UI fixtures with Brando Mathias Zusriadi and 0895803416704.

- [ ] **Step 1: Write fixture-aware E2E assertions**

~~~python
assert page.get_by_text('Brando Mathias Zusriadi').is_visible()
assert page.get_by_role('button', name=re.compile('Antrekan Fonnte')).is_visible()
assert 'FONNTE_ENABLED=true' not in os.environ
~~~

- [ ] **Step 2: Run E2E tests and verify they fail**

Run: py -3 tests/e2e_pdf_upload.py and py -3 tests/e2e_xlsx_upload.py

Expected: FAIL until the fixtures and controls exist.

- [ ] **Step 3: Create local-only PDF and XLSX fixtures**

Create a Wanea-shaped due-date PDF with standard report columns and one row: 117870000001, Brando Mathias Zusriadi, 0895803416704, a plausible due date, pledge item, values, and address. Create a matching installment workbook with an explicit account-number and No HP column. Do not set the Fonnte enable flag and do not click any queue confirmation in E2E.

- [ ] **Step 4: Run complete verification**

Run: npm run typecheck, npm test, npm run build, then the local PDF and XLSX E2E imports.

Expected: all commands pass; fixture imports expose the Brando row; zero outbound request occurs.

- [ ] **Step 5: Commit code/tests only**

~~~bash
git add tests/e2e_pdf_upload.py tests/e2e_xlsx_upload.py
git commit -m "test: verify local Fonnte broadcast fixtures"
~~~

The tmp/fonnte-fixtures files remain ignored and must not be staged.

## Plan Self-Review

- Spec coverage: Tasks 1-2 cover server-only credentials, feature flag, 60-second delay, response truthfulness, and role/scope checks. Tasks 3-4 cover PDF/XLSX UI behavior and preservation of copy/Piper. Task 5 covers the requested local fixtures and end-to-end verification.
- Placeholder scan: no incomplete tasks or deferred requirements remain.
- Type consistency: both page actions consume customers and a notification template; all server validation is centralized before the Fonnte adapter is called.

