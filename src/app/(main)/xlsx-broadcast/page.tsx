

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
import { Upload, Loader2, Mic, ClipboardCopy } from 'lucide-react';
import type { InstallmentCustomer, HistoryEntry } from '@/types';
import { Input } from '@/components/ui/input';
import VoicenotePreviewDialog from '@/components/VoicenotePreviewDialog';
import { generateCustomerVoicenote } from '@/app/(main)/broadcast/tts-actions';
import { buildInstallmentSpeechScript } from '@/lib/tts-text';
import { parseInstallmentImage, parseXlsx } from './actions';
import { useLocalSession } from '@/components/main-shell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollReveal, MotionCard } from '@/components/motion';


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
type ActionStatus = 'Pesan Disalin';

export default function XlsxBroadcastPage() {
  const adminUser = useLocalSession();
  const { toast } = useToast();
  const [importedData, setImportedData] = React.useState<InstallmentCustomer[]>([]);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);

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

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isXlsx && !isImage) {
      toast({ title: 'Jenis File Tidak Valid', description: 'Pilih XLSX, JPG, PNG, atau WEBP.', variant: 'destructive', tone: 'error' });
      return;
    }

    setIsLoading(true);
    setImportedData([]);
    toast({ title: 'Membaca file...', description: isXlsx ? 'Menyiapkan data.' : 'Membaca foto tabel angsuran.', tone: 'processing' });

    try {
      const formData = new FormData();
      formData.append(isXlsx ? 'xlsx-file' : 'angsuran-image', file);
      const customers = isXlsx ? await parseXlsx(formData) : await parseInstallmentImage(formData);
      setImportedData(customers);
      toast({
        title: 'Impor Selesai',
        description: `${customers.length} data telah berhasil dimuat.`,
        tone: 'success',
      });
    } catch (error) {
      console.error('File parsing error:', error);
      toast({
        title: 'Gagal Memproses File',
        description: 'Periksa file lalu coba lagi. Pastikan formatnya benar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      if (importFileInputRef.current) importFileInputRef.current.value = '';
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
        tone: 'copy',
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

  const handleGenerateVoicenote = async (customer: InstallmentCustomer, template: NotificationTemplate) => {
    setIsGeneratingVoicenote(true);
    toast({
        title: 'Membuat Pesan Suara...',
        description: `Sedang menyiapkan pesan suara untuk ${customer.nasabah.split('\n')[0]}.`,
        tone: 'processing',
    });
    try {
        const speechText = buildInstallmentSpeechScript({
          template,
          unitName: customer.pencairan,
          customerName: customer.nasabah,
          productName: customer.produk,
          installmentAmount: customer.angsuran,
          obligationAmount: customer.kewajiban,
          overdueDays: customer.hr_tung,
        });
        const { audioDataUri } = await generateCustomerVoicenote({ text: speechText });

        setActiveVoicenote({
            audioDataUri,
            customerName: customer.nasabah.split('\n')[0],
        });
        toast({ title: 'Pesan suara siap', description: `Pratinjau untuk ${customer.nasabah.split('\n')[0]} telah dibuat.`, tone: 'success' });
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

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:gap-5 md:p-4">
        {activeVoicenote && (
          <VoicenotePreviewDialog
            isOpen={!!activeVoicenote}
            onClose={() => setActiveVoicenote(null)}
            audioDataUri={activeVoicenote.audioDataUri}
            customerName={activeVoicenote.customerName}
          />
        )}
      <ScrollReveal direction="up">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight font-headline">Angsuran Broadcast</h1>
        </div>
      </ScrollReveal>
      <MotionCard delay={0.06}>
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2 px-5 pb-4 pt-5 md:px-6">
            <CardTitle className="text-xl">Panel Angsuran Broadcast</CardTitle>
            <CardDescription>
              Impor data nasabah dari file .xlsx atau foto tabel untuk menyalin template pengingat dan membuat pesan suara. Data otomatis difilter berdasarkan UPC Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col items-stretch gap-3 border-y border-border/70 px-5 py-3.5 md:flex-row md:items-center md:px-6">
              <Button onClick={() => importFileInputRef.current?.click()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isLoading ? 'Memproses...' : 'Import File'}
              </Button>
              <Input
                  type="file"
                  ref={importFileInputRef}
                  onChange={handleImportFileChange}
                  className="hidden"
                  accept=".xlsx,image/jpeg,image/png,image/webp"
                  aria-label="Pilih file angsuran"
              />
              <span className="text-xs text-muted-foreground">XLSX, JPG, PNG, WEBP · maks. 10 MB</span>
            </div>
            <div className="px-4 pb-4 pt-3 md:px-4">
             {importedData.length > 0 && (
                <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                 <strong>Perhatian:</strong> Data Excel angsuran tidak memuat nomor WhatsApp. Fitur yang tersedia adalah salin template dan pembuatan pesan suara.
                </div>
              )}
              <div className="rounded-lg border border-border/80 bg-card">
              <Table className="w-full table-fixed text-[11px] leading-4 [&_td]:align-top [&_td]:break-words [&_td]:px-2.5 [&_td]:py-2 [&_th]:h-10 [&_th]:bg-muted/70 [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:[line-height:0.875rem] [&_th]:text-foreground/70 [&_th]:whitespace-normal">
                <TableHeader className="bg-muted/95 shadow-[0_1px_0_rgba(15,23,42,.08)]">
                  <TableRow>
                    <TableHead className="w-[28%]">Nasabah &amp; Produk</TableHead>
                    <TableHead className="w-[31%]">Nilai &amp; Status</TableHead>
                    <TableHead className="w-[26%]">Informasi</TableHead>
                    <TableHead className="w-[4.5rem]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                      <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                              <p className="mt-2 text-muted-foreground">Sedang membaca isi file...</p>
                          </TableCell>
                      </TableRow>
                  ) : importedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Tidak ada data. Klik "Import File" untuk memulai.
                        </TableCell>
                      </TableRow>
                  ) : (
                    importedData.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="min-w-0">
                          <div className="font-medium whitespace-pre-line">{customer.nasabah}</div>
                          <div className="mt-1 whitespace-pre-line text-muted-foreground"><span className="font-medium text-foreground/70">Produk: </span>{customer.produk}</div>
                        </TableCell>
                        <TableCell className="[font-variant-numeric:tabular-nums]">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div><span className="text-muted-foreground">Pinjaman</span><div className="whitespace-nowrap">{formatCurrency(customer.pinjaman)}</div></div>
                            <div><span className="text-muted-foreground">OSL</span><div className="whitespace-nowrap">{formatCurrency(customer.osl)}</div></div>
                            <div><span className="text-muted-foreground">Angsuran</span><div className="whitespace-nowrap">{formatCurrency(customer.angsuran)}</div></div>
                            <div><span className="text-muted-foreground">Kewajiban</span><div className="whitespace-nowrap">{formatCurrency(customer.kewajiban)}</div></div>
                          </div>
                          <div className="mt-1 text-muted-foreground">Kol {customer.kol} · Tunggakan {customer.hr_tung} hari · Tenor {customer.tenor}</div>
                        </TableCell>
                        <TableCell>
                          <div><span className="text-muted-foreground">Pencairan: </span>{customer.pencairan}</div>
                          <div className="mt-1"><span className="text-muted-foreground">Kunjungan: </span>{formatDate(customer.kunjungan_terakhir)}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                             <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" aria-label={`Salin template untuk ${customer.nasabah.split('\n')[0]}`}><ClipboardCopy className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'jatuh-tempo')}>Copy Pengingat</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'keterlambatan')}>Copy Keterlambatan</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'peringatan-lelang')}>Copy Peringatan Lelang</DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button size="sm" className="h-7 w-7 p-0" disabled={isGeneratingVoicenote} aria-label={`Buat pesan suara untuk ${customer.nasabah.split('\n')[0]}`}>
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
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionCard>
    </main>
  );
}
