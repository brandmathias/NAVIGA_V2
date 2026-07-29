

'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Mic, ClipboardCopy, Bell, Send } from 'lucide-react';
import type { InstallmentCustomer, HistoryEntry } from '@/types';
import { Input } from '@/components/ui/input';
import VoicenotePreviewDialog from '@/components/VoicenotePreviewDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { queueInstallmentBroadcast } from '@/app/(main)/broadcast/fonnte-actions';
import { generateCustomerVoicenote } from '@/app/(main)/broadcast/tts-actions';
import { normalizeIndonesianWhatsAppNumber } from '@/lib/whatsapp-recipient';
import { parseXlsx } from './actions';
import { useLocalSession } from '@/components/main-shell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const formatCurrency = (value: number | string | undefined) => {
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

const formatDate = (value: string | number): string => {
    if (typeof value === 'number') {
        if (value > 0) {
            // Excel dates are stored as the number of days since 1900-01-01.
            // JavaScript's Date is based on milliseconds since 1970-01-01.
            // The formula to convert is to subtract the Excel epoch offset and then convert days to milliseconds.
            const date = new Date((value - (25567 + 1)) * 86400 * 1000);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        }
        return 'N/A';
    }
    return String(value);
};


type NotificationTemplate = 'jatuh-tempo' | 'keterlambatan' | 'peringatan-lelang';
type ActionStatus = 'Antrean Fonnte Diterima' | 'Pesan Disalin';

export default function XlsxBroadcastPage() {
  const adminUser = useLocalSession();
  const { toast } = useToast();
  const [importedData, setImportedData] = React.useState<InstallmentCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = React.useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isQueueing, setIsQueueing] = React.useState(false);

  const [isGeneratingVoicenote, setIsGeneratingVoicenote] = React.useState(false);
  const [activeVoicenote, setActiveVoicenote] = React.useState<{
    audioDataUri: string;
    customerName: string;
  } | null>(null);

  const logHistory = (customer: InstallmentCustomer, status: ActionStatus, template: NotificationTemplate) => {
    try {
        const customerName = customer.nasabah.split('\n')[0].trim();
        const customerIdentifier = customer.nasabah.split('\n')[1]?.trim() || 'N/A';
        
        const storageKey = adminUser.role === 'superadmin'
          ? 'broadcastHistory_all'
          : `broadcastHistory_${adminUser.unitPrefix ?? 'unit'}`;

      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}-${customer.id}`,
        timestamp: new Date().toISOString(),
        type: 'Angsuran Broadcast',
        customerName: customerName,
        customerIdentifier: customerIdentifier,
        status,
        adminUser: adminUser.name,
        template: template,
      };

      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
      history.unshift(newEntry); // Add to the beginning
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to log history:", error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
        toast({
            title: 'Jenis File Tidak Valid',
            description: 'Silakan unggah file .xlsx.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setImportedData([]);
    setSelectedCustomers(new Set());
    toast({
        title: 'Memproses XLSX...',
        description: 'Membaca data dari file. Ini mungkin memakan waktu sejenak.',
    });

    try {
      const formData = new FormData();
      formData.append('xlsx-file', file);
      const customers = await parseXlsx(formData);
      setImportedData(customers);
      toast({
        title: 'Impor Selesai',
        description: `${customers.length} data telah berhasil dimuat.`,
      });
    } catch (error) {
      console.error('XLSX parsing error:', error);
      toast({
        title: 'Gagal Memproses File',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca file XLSX. Pastikan formatnya benar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const nextSelection = new Set(selectedCustomers);
    if (checked) nextSelection.add(customerId);
    else nextSelection.delete(customerId);
    setSelectedCustomers(nextSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(importedData
        .filter((customer) => normalizeIndonesianWhatsAppNumber(customer.phone_number))
        .map((customer) => customer.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

    const getNotificationMessage = (customer: InstallmentCustomer, template: NotificationTemplate): string => {
        // Clean up the nasabah string to extract name and ID.
        const customerNameAndId = customer.nasabah.replace(/\s+/g, ' ').trim();
        
        // Clean up produk string
        const productName = (customer.produk.split('\n')[0] || '').replace(/\s+-\s+-/, '').trim();

        let headerLine = `Nasabah ${customer.pencairan.toUpperCase()}`;
        const pencairanLower = customer.pencairan.toLowerCase();

        if (pencairanLower.includes('wan')) {
            headerLine = 'Nasabah PEGADAIAN WANEA / TANJUNG BATU';
        } else if (pencairanLower.includes('ranotana')) {
            headerLine = 'Nasabah PEGADAIAN RANOTANA / RANOTANA';
        }
        
        let messageBody = '';

        switch (template) {
            case 'peringatan-lelang':
                messageBody = `*PERINGATAN PEMUTUSAN KONTRAK (TERAKHIR)*

Angsuran produk ${productName} Anda telah melewati jatuh tempo secara signifikan (${customer.hr_tung} hari).

Untuk menghindari pemutusan kontrak dan tindakan lebih lanjut, segera lakukan pembayaran seluruh kewajiban Anda (${formatCurrency(customer.kewajiban)}) dalam waktu 2x24 jam. Abaikan pesan ini jika sudah melakukan pembayaran.`;
                break;
            case 'keterlambatan':
                messageBody = `*Angsuran Anda Sudah Jatuh Tempo*

Angsuran produk ${productName} Anda telah melewati tanggal jatuh tempo (${customer.hr_tung} hari).

Akan dikenakan denda keterlambatan. Mohon segera lakukan pembayaran untuk menghindari denda yang lebih besar.`;
                break;
            case 'jatuh-tempo':
            default:
                messageBody = `*Angsuran Anda akan segera Jatuh Tempo*

Angsuran produk ${productName} Anda sebesar *${formatCurrency(customer.angsuran)}* akan segera jatuh tempo.

Segera lakukan pembayaran. Pembayaran bisa dilakukan secara online melalui aplikasi PEGADAIAN DIGITAL atau e-channel lainnya.`;
                break;
        }

        return `${headerLine}
*Yth. Bpk/Ibu ${customerNameAndId.toLocaleUpperCase()}*

${messageBody}

Terima Kasih`;
    };

  const handleCopyMessage = (customer: InstallmentCustomer, template: NotificationTemplate) => {
    const message = getNotificationMessage(customer, template);
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: 'Pesan Disalin',
        description: `Pesan untuk ${customer.nasabah.split('\n')[0]} telah disalin ke clipboard.`,
      });
      logHistory(customer, 'Pesan Disalin', template);
    }).catch(err => {
      console.error('Failed to copy message: ', err);
      toast({
        title: 'Gagal Menyalin',
        description: 'Tidak dapat menyalin pesan. Silakan coba lagi.',
        variant: 'destructive',
      });
    });
  };

  const handleQueueNotification = async (customers: InstallmentCustomer[], template: NotificationTemplate) => {
    if (customers.some((customer) => !normalizeIndonesianWhatsAppNumber(customer.phone_number))) {
      toast({
        title: 'Nomor WhatsApp Tidak Valid',
        description: 'Periksa nomor HP hasil impor sebelum mengantrekan Fonnte.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm(
      `Antrekan notifikasi untuk ${customers.length} nasabah terpilih dengan interval 60 detik? Penerimaan antrean bukan bukti pesan terkirim.`,
    )) return;

    setIsQueueing(true);
    try {
      const result = await queueInstallmentBroadcast({ customers, template });
      customers.forEach((customer) => logHistory(customer, 'Antrean Fonnte Diterima', template));
      toast({
        title: 'Antrean Fonnte Diterima',
        description: `${result.accepted} nasabah diterima ke antrean Fonnte dengan interval 60 detik. Ini bukan konfirmasi pesan terkirim.`,
      });
      setSelectedCustomers(new Set());
    } catch (error) {
      toast({
        title: 'Gagal Mengantrekan Fonnte',
        description: error instanceof Error ? error.message : 'Antrean Fonnte tidak dapat diproses. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsQueueing(false);
    }
  };

  const handleGenerateVoicenote = async (customer: InstallmentCustomer, template: NotificationTemplate) => {
    setIsGeneratingVoicenote(true);
    toast({
        title: 'Membuat Pesan Suara...',
        description: `Piper sedang membuat pesan suara untuk ${customer.nasabah.split('\n')[0]}.`,
    });
    try {
        const message = getNotificationMessage(customer, template);
        const { audioDataUri } = await generateCustomerVoicenote({ text: message });

        setActiveVoicenote({
            audioDataUri,
            customerName: customer.nasabah.split('\n')[0],
        });
    } catch (error) {
        console.error('Voicenote generation failed:', error);
        toast({
            title: 'Gagal Membuat Pesan Suara',
            description: error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat pesan suara. Silakan coba lagi.',
            variant: 'destructive',
        });
    } finally {
        setIsGeneratingVoicenote(false);
    }
  };

  const handleNotifySelected = async () => {
    if (selectedCustomers.size === 0) return;
    await handleQueueNotification(
      importedData.filter((customer) => selectedCustomers.has(customer.id)),
      'jatuh-tempo',
    );
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {activeVoicenote && (
          <VoicenotePreviewDialog
            isOpen={!!activeVoicenote}
            onClose={() => setActiveVoicenote(null)}
            audioDataUri={activeVoicenote.audioDataUri}
            customerName={activeVoicenote.customerName}
          />
        )}
      <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight font-headline">Angsuran Broadcast</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Panel Angsuran Broadcast</CardTitle>
          <CardDescription>
            Impor data nasabah dari file .xlsx untuk menyalin template, membuat pesan suara, atau mengantrekan nomor WhatsApp valid. Data akan otomatis difilter berdasarkan UPC Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isLoading ? 'Memproses...' : 'Impor XLSX'}
            </Button>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx"
            />
            <div className="flex-grow" />
            <Button onClick={handleNotifySelected} disabled={selectedCustomers.size === 0 || isLoading || isQueueing}>
              <Send className="mr-2 h-4 w-4" />
              Antrekan Terpilih ({selectedCustomers.size})
            </Button>
          </div>
           {importedData.length > 0 && (
             <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
               <strong>Perhatian:</strong> Hanya baris dengan nomor WhatsApp Indonesia yang valid yang dapat diantrekan ke Fonnte. Baris lain tetap dapat memakai salin template dan Piper lokal.
             </div>
            )}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedCustomers.size > 0 && selectedCustomers.size === importedData.filter((customer) => normalizeIndonesianWhatsAppNumber(customer.phone_number)).length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Pilih semua nomor WhatsApp valid"
                      disabled={importedData.length === 0 || isQueueing}
                    />
                  </TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Pinjaman</TableHead>
                  <TableHead>Osl</TableHead>
                  <TableHead>Kol</TableHead>
                  <TableHead>Hr tung</TableHead>
                  <TableHead>Tenor</TableHead>
                  <TableHead>Angsuran</TableHead>
                  <TableHead>Kewajiban</TableHead>
                  <TableHead>Pencairan</TableHead>
                  <TableHead>Kunjungan Terakhir</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={13} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Memproses file XLSX...</p>
                        </TableCell>
                    </TableRow>
                ) : importedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="h-24 text-center">
                          Tidak ada data. Klik "Impor XLSX" untuk memulai.
                      </TableCell>
                    </TableRow>
                ) : (
                  importedData.map((customer) => {
                    const canContact = Boolean(normalizeIndonesianWhatsAppNumber(customer.phone_number));
                    return (
                    <TableRow key={customer.id} data-state={selectedCustomers.has(customer.id) ? 'selected' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomers.has(customer.id)}
                          onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                          aria-label={`Pilih ${customer.nasabah.split('\n')[0]}`}
                          disabled={!canContact || isQueueing}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-pre-line">{customer.nasabah}</TableCell>
                      <TableCell className="whitespace-pre-line">{customer.produk}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.pinjaman)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.osl)}</TableCell>
                      <TableCell className="text-center">{customer.kol}</TableCell>
                      <TableCell className="text-center">{customer.hr_tung}</TableCell>
                      <TableCell className="text-center">{customer.tenor}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.angsuran)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.kewajiban)}</TableCell>
                      <TableCell>{customer.pencairan}</TableCell>
                      <TableCell>{formatDate(customer.kunjungan_terakhir)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline"><ClipboardCopy className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'jatuh-tempo')}>Copy Pengingat</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'keterlambatan')}>Copy Keterlambatan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'peringatan-lelang')}>Copy Peringatan Lelang</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" disabled={!canContact || isQueueing}><Bell className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleQueueNotification([customer], 'jatuh-tempo')}>Antrekan Pengingat</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleQueueNotification([customer], 'keterlambatan')}>Antrekan Keterlambatan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleQueueNotification([customer], 'peringatan-lelang')}>Antrekan Peringatan Lelang</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" disabled={isGeneratingVoicenote}>
                                        {isGeneratingVoicenote ? <Loader2 className="h-4 w-4 animate-spin"/> : <Mic className="h-4 w-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleGenerateVoicenote(customer, 'jatuh-tempo')}>Buat VN Pengingat</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGenerateVoicenote(customer, 'keterlambatan')}>Buat VN Keterlambatan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGenerateVoicenote(customer, 'peringatan-lelang')}>Buat VN Peringatan Lelang</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
          {selectedCustomers.size > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Nasabah akan diantrekan melalui Fonnte dengan interval 60 detik. Penerimaan antrean bukan bukti pesan terkirim.
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
