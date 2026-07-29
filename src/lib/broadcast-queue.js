const { queueFonnteMessages } = require('./fonnte-client');
const { listUnits } = require('./unit-registry');
const { normalizeIndonesianWhatsAppNumber } = require('./whatsapp-recipient');

if (process.env.NEXT_RUNTIME !== undefined) require('server-only');

const SUPPORTED_TEMPLATES = new Set(['jatuh-tempo', 'keterlambatan', 'peringatan-lelang']);

function isPrefix(value) {
  return /^\d{5}$/.test(String(value ?? ''));
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatGadaiDueDate(value) {
  const input = String(value ?? '');
  const parts = input.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  const date = parts
    ? new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
    : new Date(input);
  return Number.isNaN(date.getTime())
    ? 'TANGGAL TIDAK VALID'
    : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toLocaleUpperCase();
}

function getPrefix(customer, field, label) {
  const prefix = String(customer?.[field] ?? '').replace(/\D/g, '').slice(0, 5);
  if (!isPrefix(prefix)) throw new Error(`${label} harus diawali lima angka prefix unit.`);
  return prefix;
}

function validateTemplate(template) {
  if (!SUPPORTED_TEMPLATES.has(template)) throw new Error('Template pesan tidak didukung.');
}

function validateCustomers(customers) {
  if (!Array.isArray(customers) || customers.length === 0) throw new Error('Pilih minimal satu nasabah untuk masuk antrean.');
}

async function getAllowedPrefixes(session, { listUnitsImpl = listUnits } = {}) {
  if (typeof listUnitsImpl !== 'function') throw new Error('Daftar unit aktif tidak tersedia.');

  const activePrefixes = [...new Set((await listUnitsImpl())
    .filter((unit) => unit?.active && isPrefix(unit.prefix))
    .map((unit) => unit.prefix))];

  if (session?.role === 'superadmin' && (session.unitPrefix === null || session.unitPrefix === undefined)) {
    return activePrefixes;
  }
  if (session?.role === 'unit' && isPrefix(session.unitPrefix) && activePrefixes.includes(session.unitPrefix)) {
    return [session.unitPrefix];
  }
  throw new Error('Sesi unit tidak aktif atau belum memiliki prefix SBG yang sah.');
}

function gadaiMessage(customer, template) {
  const prefix = getPrefix(customer, 'sbg_number', 'Nomor SBG');
  const header = prefix === '11787'
    ? 'Nasabah PEGADAIAN WANEA / TANJUNG BATU'
    : prefix === '11793'
      ? 'Nasabah PEGADAIAN RANOTANA / RANOTANA'
      : 'Nasabah PEGADAIAN';
  const sbgNumber = String(customer?.sbg_number ?? '');
  const collateral = String(customer?.barang_jaminan ?? '');
  const dueDate = formatGadaiDueDate(customer?.due_date);
  let messageBody;

  switch (template) {
    case 'peringatan-lelang':
      messageBody = `*PERINGATAN LELANG (TERAKHIR)*\n\nGadaian Anda No. ${sbgNumber} (${collateral}) telah melewati batas jatuh tempo (${dueDate}) lebih dari 14 hari.\n\nUntuk menghindari proses lelang, segera lakukan pelunasan atau perpanjangan di cabang terdekat dalam waktu 2x24 jam. Abaikan pesan ini jika sudah melakukan pembayaran.`;
      break;
    case 'keterlambatan':
      messageBody = `*Gadaian Anda Sudah Jatuh Tempo*\n\nGadaian No. ${sbgNumber} (${collateral}) telah melewati tanggal jatuh tempo pada ${dueDate}.\n\nAkan dikenakan denda keterlambatan. Mohon segera lakukan pembayaran untuk menghindari denda yang lebih besar atau risiko lelang.`;
      break;
    default:
      messageBody = `*Gadaian Anda akan segera Jatuh Tempo*\n\nGadaian No. ${sbgNumber} (${collateral}) akan jatuh tempo pada tanggal *${dueDate}*.\n\nSegera lakukan pembayaran bunga/perpanjangan/cek TAMBAH PINJAMAN. Pembayaran bisa dilakukan secara online melalui aplikasi PEGADAIAN DIGITAL atau e-channel lainnya.`;
  }

  return `${header}\n*Yth. Bpk/Ibu ${String(customer?.name ?? '').trim().toLocaleUpperCase()}*\n\n${messageBody}\n\nTerima Kasih`;
}

function installmentMessage(customer, template) {
  const customerName = String(customer?.nasabah ?? '').replace(/\s+/g, ' ').trim();
  const productName = (String(customer?.produk ?? '').split('\n')[0] || '').replace(/\s+-\s+-/, '').trim();
  const disbursement = String(customer?.pencairan ?? '');
  const disbursementLower = disbursement.toLowerCase();
  const header = disbursementLower.includes('wan')
    ? 'Nasabah PEGADAIAN WANEA / TANJUNG BATU'
    : disbursementLower.includes('ranotana')
      ? 'Nasabah PEGADAIAN RANOTANA / RANOTANA'
      : `Nasabah ${disbursement.toUpperCase()}`;
  let messageBody;

  switch (template) {
    case 'peringatan-lelang':
      messageBody = `*PERINGATAN PEMUTUSAN KONTRAK (TERAKHIR)*\n\nAngsuran produk ${productName} Anda telah melewati jatuh tempo secara signifikan (${customer?.hr_tung ?? ''} hari).\n\nUntuk menghindari pemutusan kontrak dan tindakan lebih lanjut, segera lakukan pembayaran seluruh kewajiban Anda (${formatCurrency(customer?.kewajiban)}) dalam waktu 2x24 jam. Abaikan pesan ini jika sudah melakukan pembayaran.`;
      break;
    case 'keterlambatan':
      messageBody = `*Angsuran Anda Sudah Jatuh Tempo*\n\nAngsuran produk ${productName} Anda telah melewati tanggal jatuh tempo (${customer?.hr_tung ?? ''} hari).\n\nAkan dikenakan denda keterlambatan. Mohon segera lakukan pembayaran untuk menghindari denda yang lebih besar.`;
      break;
    default:
      messageBody = `*Angsuran Anda akan segera Jatuh Tempo*\n\nAngsuran produk ${productName} Anda sebesar *${formatCurrency(customer?.angsuran)}* akan segera jatuh tempo.\n\nSegera lakukan pembayaran. Pembayaran bisa dilakukan secara online melalui aplikasi PEGADAIAN DIGITAL atau e-channel lainnya.`;
  }

  return `${header}\n*Yth. Bpk/Ibu ${customerName.toLocaleUpperCase()}*\n\n${messageBody}\n\nTerima Kasih`;
}

async function prepareRecipients({ session, customers, template, listUnitsImpl, field, label, message }) {
  validateCustomers(customers);
  validateTemplate(template);
  const allowedPrefixes = await getAllowedPrefixes(session, { listUnitsImpl });

  return customers.map((customer) => {
    const prefix = getPrefix(customer, field, label);
    if (!allowedPrefixes.includes(prefix)) throw new Error(`${label} tidak sesuai dengan unit aktif akun ini.`);

    const target = normalizeIndonesianWhatsAppNumber(customer?.phone_number);
    if (!target) throw new Error(`Nomor WhatsApp tidak valid untuk ${label}.`);
    return { target, message: message(customer, template) };
  });
}

function prepareGadaiRecipients({ session, customers, template, listUnitsImpl }) {
  return prepareRecipients({
    session,
    customers,
    template,
    listUnitsImpl,
    field: 'sbg_number',
    label: 'Nomor SBG',
    message: gadaiMessage,
  });
}

function prepareInstallmentRecipients({ session, customers, template, listUnitsImpl }) {
  return prepareRecipients({
    session,
    customers,
    template,
    listUnitsImpl,
    field: 'account_number',
    label: 'Nomor rekening',
    message: installmentMessage,
  });
}

async function queueGadaiCustomers({ session, customers, template, listUnitsImpl, queueImpl = queueFonnteMessages }) {
  return queueImpl({ recipients: await prepareGadaiRecipients({ session, customers, template, listUnitsImpl }) });
}

async function queueInstallmentCustomers({ session, customers, template, listUnitsImpl, queueImpl = queueFonnteMessages }) {
  return queueImpl({ recipients: await prepareInstallmentRecipients({ session, customers, template, listUnitsImpl }) });
}

module.exports = {
  getAllowedPrefixes,
  prepareGadaiRecipients,
  prepareInstallmentRecipients,
  queueGadaiCustomers,
  queueInstallmentCustomers,
};
