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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Send, Loader2, Mic, Bell, ClipboardCopy } from 'lucide-react';
import type { BroadcastCustomer, Customer } from '@/types';
import { Input } from '@/components/ui/input';
import { parseGadaiImage, parsePdf } from './actions';
import { generateCustomerVoicenote } from '@/app/(main)/broadcast/tts-actions';
import { buildGadaiSpeechScript } from '@/lib/tts-text';
import VoicenotePreviewDialog from '@/components/VoicenotePreviewDialog';
import { normalizeIndonesianWhatsAppNumber } from '@/lib/whatsapp-recipient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useLocalSession } from '@/components/main-shell';
import { ScrollReveal, MotionCard } from '@/components/motion';
import { createBroadcastHistoryEntry } from '@/lib/broadcast-history-client.mjs';
import {
  getImportEmptyFeedback,
  getImportErrorFeedback,
  getImportProcessingFeedback,
  getImportScopeLabel,
  getImportSuccessDescription,
} from '@/lib/import-feedback.mjs';
import { getUserFacingMessage } from '@/lib/user-facing-message.mjs';


const parseDateForFormatting = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;

    // Handles DD/MM/YYYY from AI, which is the most likely format
    const parts = dateString.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10);
        const year = parseInt(parts[3], 10);
        // Note: JavaScript months are 0-indexed
        const d = new Date(year, month - 1, day);
        // Basic validation
        if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
            return d;
        }
    }
    
    // Fallback for other JS-parsable formats (like YYYY-MM-DD)
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
        return d;
    }

    return null;
};


const formatDate = (dateString: string) => {
    const date = parseDateForFormatting(dateString);
    if (!date) return 'N/A';
    // Use 'id-ID' locale for full month name formatting in the message
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}


const getUpcFromId = (id: string): Customer['upc'] => {
  const prefix = id.substring(0, 5);
  if (prefix === '11787') {
    return 'Pegadaian Wanea';
  }
  if (prefix === '11793') {
    return 'Pegadaian Ranotana';
  }
  return 'N/A';
};

const getUnitLabel = (id: string) => {
  const knownUnit = getUpcFromId(id);
  return knownUnit === 'N/A' ? 'Pegadaian' : knownUnit;
};

type NotificationTemplate = 'jatuh-tempo' | 'keterlambatan' | 'peringatan-lelang';
type ActionStatus = 'WhatsApp Dibuka' | 'Pesan Disalin';

export default function PdfBroadcastPage() {
  const adminUser = useLocalSession();
  const { toast } = useToast();
  const importScopeLabel = getImportScopeLabel(adminUser);
  const [extractedData, setExtractedData] = React.useState<BroadcastCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = React.useState<Set<string>>(new Set());
  const importFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingVoicenote, setIsGeneratingVoicenote] = React.useState(false);
  const [activeVoicenote, setActiveVoicenote] = React.useState<{
    audioDataUri: string;
    whatsappUrl: string;
    customerName: string;
    customer: BroadcastCustomer;
    template: NotificationTemplate;
  } | null>(null);

  const logHistory = async (customer: BroadcastCustomer, status: ActionStatus, template: NotificationTemplate) => {
    try {
      await createBroadcastHistoryEntry({
        type: 'Gadaian Broadcast',
        customerName: customer.name,
        customerIdentifier: customer.sbg_number,
        status,
        template,
      });
    } catch (error) {
      console.error('Failed to log broadcast history:', error);
      toast({
        variant: 'destructive',
        title: 'Riwayat belum tersimpan',
        description: 'Broadcast tetap berjalan, tetapi riwayat ini belum tersimpan. Coba muat ulang halaman riwayat untuk memeriksanya.',
        tone: 'error',
      });
    }
  };

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isPdf && !isImage) {
      toast({ title: 'Format file tidak didukung', description: 'Pilih file PDF atau foto JPG, PNG, atau WEBP.', variant: 'destructive', tone: 'error' });
      return;
    }

    setIsLoading(true);
    setExtractedData([]);
    setSelectedCustomers(new Set());
    const feedbackContext = { domain: 'gadaian' as const, source: isPdf ? 'pdf' : 'foto', session: adminUser };
    toast({ ...getImportProcessingFeedback(feedbackContext), tone: 'processing' });

    const formData = new FormData();
    formData.append(isPdf ? 'pdf-file' : 'gadai-image', file);

    try {
        const results = isPdf ? await parsePdf(formData) : await parseGadaiImage(formData);
        
        if (results.length === 0) {
            toast({ ...getImportEmptyFeedback(feedbackContext), variant: 'destructive', tone: 'error' });
        } else {
            setExtractedData(results);
            toast({
                title: 'Impor selesai',
                description: getImportSuccessDescription(feedbackContext, results.length),
                tone: 'success',
            });
        }
    } catch (error: unknown) {
        toast({ ...getImportErrorFeedback(error, feedbackContext), variant: 'destructive', tone: 'error' });
        console.error('File processing error:', error);
    } finally {
        setIsLoading(false);
        if (importFileInputRef.current) importFileInputRef.current.value = '';
    }
  };

  const handleSelectCustomer = (sbgNumber: string, checked: boolean) => {
    const newSelection = new Set(selectedCustomers);
    if (checked) {
      newSelection.add(sbgNumber);
    } else {
      newSelection.delete(sbgNumber);
    }
    setSelectedCustomers(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSbgNumbers = new Set(extractedData.map((c) => c.sbg_number));
      setSelectedCustomers(allSbgNumbers);
    } else {
      setSelectedCustomers(new Set());
    }
  };
  
 const getNotificationMessage = (customer: BroadcastCustomer, template: NotificationTemplate): string => {
    const dueDateString = customer.due_date;
    const date = parseDateForFormatting(dueDateString);
    
    // Use 'id-ID' locale for full month name formatting in the message
    const formattedDueDateForMessage = date 
        ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toLocaleUpperCase() 
        : 'TANGGAL TIDAK VALID';

    let messageBody = '';
    const upc = getUnitLabel(customer.sbg_number);
    let headerLine = '';

     if (upc === 'Pegadaian Wanea') {
        headerLine = 'Nasabah PEGADAIAN WANEA / TANJUNG BATU';
    } else if (upc === 'Pegadaian Ranotana') {
        headerLine = 'Nasabah PEGADAIAN RANOTANA / RANOTANA';
    } else {
        headerLine = 'Nasabah PEGADAIAN';
    }

    switch (template) {
        case 'peringatan-lelang':
            messageBody = `*PERINGATAN LELANG (TERAKHIR)*

Gadaian Anda No. ${customer.sbg_number} (${customer.barang_jaminan}) telah melewati batas jatuh tempo (${formattedDueDateForMessage}) lebih dari 14 hari.

Untuk menghindari proses lelang, segera lakukan pelunasan atau perpanjangan di cabang terdekat dalam waktu 2x24 jam. Abaikan pesan ini jika sudah melakukan pembayaran.`;
            break;
        case 'keterlambatan':
            messageBody = `*Gadaian Anda Sudah Jatuh Tempo*

Gadaian No. ${customer.sbg_number} (${customer.barang_jaminan}) telah melewati tanggal jatuh tempo pada ${formattedDueDateForMessage}.

Akan dikenakan denda keterlambatan. Mohon segera lakukan pembayaran untuk menghindari denda yang lebih besar atau risiko lelang.`;
            break;
        case 'jatuh-tempo':
        default:
            messageBody = `*Gadaian Anda akan segera Jatuh Tempo*

Gadaian No. ${customer.sbg_number} (${customer.barang_jaminan}) akan jatuh tempo pada tanggal *${formattedDueDateForMessage}*.

Segera lakukan pembayaran bunga/perpanjangan/cek TAMBAH PINJAMAN. Pembayaran bisa dilakukan secara online melalui aplikasi PEGADAIAN DIGITAL atau e-channel lainnya.`;
            break;
    }

    return `${headerLine}
*Yth. Bpk/Ibu ${customer.name.toLocaleUpperCase()}*

${messageBody}

Terima Kasih`;
};

  const handleCopyMessage = (customer: BroadcastCustomer, template: NotificationTemplate) => {
    const message = getNotificationMessage(customer, template);
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: 'Pesan Disalin',
        description: `Pesan untuk ${customer.name} berhasil disalin.`,
        tone: 'copy',
      });
      void logHistory(customer, 'Pesan Disalin', template);
    }).catch(err => {
      console.error('Failed to copy message: ', err);
      toast({
        title: 'Pesan belum tersalin',
        description: 'Pesan belum dapat disalin. Coba lagi atau salin isi pesan secara manual.',
        variant: 'destructive',
        tone: 'error',
      });
    });
  };

  const handleSendNotification = (customer: BroadcastCustomer, template: NotificationTemplate) => {
    const formattedPhoneNumber = normalizeIndonesianWhatsAppNumber(customer.phone_number);
    if (!formattedPhoneNumber) {
      toast({
        title: 'Nomor WhatsApp belum dapat digunakan',
        description: 'Periksa nomor WhatsApp pada data nasabah sebelum membuka WhatsApp.',
        variant: 'destructive',
        tone: 'error',
      });
      return;
    }
    const message = getNotificationMessage(customer, template);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    void logHistory(customer, 'WhatsApp Dibuka', template);
    toast({ title: 'WhatsApp dibuka', description: `Pesan untuk ${customer.name} siap dikirim.`, tone: 'message' });
  };

   const handleGenerateVoicenote = async (customer: BroadcastCustomer, template: NotificationTemplate) => {
    const formattedPhoneNumber = normalizeIndonesianWhatsAppNumber(customer.phone_number);
    if (!formattedPhoneNumber) {
      toast({
        title: 'Nomor WhatsApp belum dapat digunakan',
        description: 'Periksa nomor WhatsApp pada data nasabah sebelum membuat pesan suara.',
        variant: 'destructive',
        tone: 'error',
      });
      return;
    }
    setIsGeneratingVoicenote(true);
    toast({
        title: 'Membuat Pesan Suara...',
        description: `Sedang menyiapkan pesan suara untuk ${customer.name}.`,
        tone: 'processing',
    });
    try {
        const whatsappUrl = `https://wa.me/${formattedPhoneNumber}`;

        const speechText = buildGadaiSpeechScript({
          template,
          unitName: getUnitLabel(customer.sbg_number),
          customerName: customer.name,
          sbgNumber: customer.sbg_number,
          collateral: customer.barang_jaminan,
          dueDate: customer.due_date,
        });
        const { audioDataUri } = await generateCustomerVoicenote({ text: speechText });

        setActiveVoicenote({
            audioDataUri,
            whatsappUrl,
            customerName: customer.name,
            customer,
            template,
        });
        toast({ title: 'Pesan suara siap', description: `Pratinjau untuk ${customer.name} telah dibuat.`, tone: 'success' });
    } catch (error) {
        console.error('Voicenote generation failed:', error);
        toast({
            title: 'Pesan suara belum siap',
            description: getUserFacingMessage(error, 'Pesan suara belum dapat dibuat. Periksa data nasabah lalu coba lagi.'),
            variant: 'destructive',
            tone: 'error',
        });
    } finally {
        setIsGeneratingVoicenote(false);
    }
  };

  const handleNotifySelected = () => {
    if (selectedCustomers.size === 0) {
      toast({
        title: 'Belum ada nasabah dipilih',
        description: 'Centang minimal satu nasabah pada tabel sebelum mengirim notifikasi.',
        variant: 'destructive',
        tone: 'error',
      });
      return;
    }

    toast({
      title: 'Membuka WhatsApp',
      description: `Menyiapkan ${selectedCustomers.size} notifikasi jatuh tempo. Izinkan pop-up jika browser memintanya.`,
      tone: 'message',
    });

    const customersToNotify = extractedData.filter((c) => selectedCustomers.has(c.sbg_number));
    
    customersToNotify.forEach((customer, index) => {
      // Small delay to prevent browsers from blocking too many pop-ups at once
      setTimeout(() => {
        handleSendNotification(customer, 'jatuh-tempo');
      }, index * 200); 
    });
    
    setSelectedCustomers(new Set());
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:gap-5 md:p-4">
       {activeVoicenote && (
          <VoicenotePreviewDialog
            isOpen={!!activeVoicenote}
            onClose={() => setActiveVoicenote(null)}
            audioDataUri={activeVoicenote.audioDataUri}
            customerName={activeVoicenote.customerName}
            onConfirm={() => {
                window.open(activeVoicenote.whatsappUrl, '_blank');
                void logHistory(activeVoicenote.customer, 'WhatsApp Dibuka', activeVoicenote.template);
            }}
          />
        )}
      <ScrollReveal direction="up">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight font-headline">Gadaian Broadcast</h1>
        </div>
      </ScrollReveal>
      <MotionCard delay={0.06} disableHover>
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2 px-5 pb-4 pt-5 md:px-6">
            <CardTitle className="text-xl">Panel Gadaian Broadcast</CardTitle>
            <CardDescription>
              Impor data nasabah dari PDF atau foto tabel untuk menyiapkan notifikasi. Sistem membaca nomor SBG dan hanya menampilkan data terkait {importScopeLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col items-stretch gap-3 border-y border-border/70 px-5 py-3.5 md:flex-row md:items-center md:px-6">
              <Button onClick={() => importFileInputRef.current?.click()} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Menganalisis...' : 'Import File'}
              </Button>
              <Input
                  type="file"
                  ref={importFileInputRef}
                  onChange={handleImportFileChange}
                  className="hidden"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  aria-label="Pilih file gadaian"
              />
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP · maks. 10 MB</span>
              <div className="flex-grow"></div>
              <Button onClick={handleNotifySelected} disabled={selectedCustomers.size === 0 || isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Kirim Terpilih ({selectedCustomers.size})
              </Button>
            </div>
            <div className="px-4 pb-4 pt-3 md:px-4">
              <div className="rounded-lg border border-border/80 bg-card">
              <Table className="w-full table-fixed text-[11px] leading-4 [&_td]:align-top [&_td]:break-words [&_td]:px-2.5 [&_td]:py-2 [&_th]:h-10 [&_th]:bg-muted/70 [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:[line-height:0.875rem] [&_th]:text-foreground/70 [&_th]:whitespace-normal">
                <TableHeader className="bg-muted/95 shadow-[0_1px_0_rgba(15,23,42,.08)]">
                  <TableRow>
                    <TableHead className="w-9">
                      <Checkbox
                        checked={selectedCustomers.size > 0 && selectedCustomers.size === extractedData.length && extractedData.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                        disabled={extractedData.length === 0}
                      />
                    </TableHead>
                    <TableHead className="w-[16%]">Nasabah &amp; SBG</TableHead>
                    <TableHead className="w-[14%]">Kredit</TableHead>
                    <TableHead className="w-[23%]">Barang Jaminan</TableHead>
                    <TableHead className="w-[15%]">Nilai Gadai</TableHead>
                    <TableHead className="w-[17%]">Kontak &amp; Alamat</TableHead>
                    <TableHead className="w-[6.5rem]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                       <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                              <p className="mt-2 text-muted-foreground">Menganalisis file dan mencocokkan nomor SBG dengan {importScopeLabel}...</p>
                          </TableCell>
                      </TableRow>
                  ) : extractedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                                Belum ada data. Pilih file untuk membaca data gadaian terkait {importScopeLabel}.
                        </TableCell>
                      </TableRow>
                  ) : (
                    extractedData.map((customer, index) => {
                      const canContact = Boolean(normalizeIndonesianWhatsAppNumber(customer.phone_number));
                      // Logic to ensure credit date is always before due date
                      const creditDateObj = parseDateForFormatting(customer.credit_date);
                      const dueDateObj = parseDateForFormatting(customer.due_date);

                      let displayCreditDate = customer.credit_date;
                      let displayDueDate = customer.due_date;

                      if (creditDateObj && dueDateObj && creditDateObj > dueDateObj) {
                          displayCreditDate = customer.due_date;
                          displayDueDate = customer.credit_date;
                      }

                      return (
                      <TableRow key={customer.sbg_number || index} data-state={selectedCustomers.has(customer.sbg_number) ? 'selected' : ''}>
                        <TableCell>
                          <Checkbox
                              checked={selectedCustomers.has(customer.sbg_number)}
                              onCheckedChange={(checked) => handleSelectCustomer(customer.sbg_number, !!checked)}
                              aria-label={`Select ${customer.name}`}
                          />
                        </TableCell>
                        <TableCell className="min-w-0">
                          <div className="font-medium leading-4">{customer.name}</div>
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground [font-variant-numeric:tabular-nums]">{customer.sbg_number}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{customer.rubrik}</div>
                          <div className="mt-1 text-muted-foreground">Kredit: {formatDate(displayCreditDate)}</div>
                          <div className="font-semibold">Jth tempo: {formatDate(displayDueDate)}</div>
                        </TableCell>
                        <TableCell>{customer.barang_jaminan}</TableCell>
                        <TableCell className="[font-variant-numeric:tabular-nums]">
                          <div className="grid gap-1">
                            <div className="flex items-baseline justify-between gap-2"><span className="text-muted-foreground">Taksiran</span><span className="whitespace-nowrap text-right">{formatCurrency(customer.taksiran)}</span></div>
                            <div className="flex items-baseline justify-between gap-2"><span className="text-muted-foreground">UP</span><span className="whitespace-nowrap text-right">{formatCurrency(customer.loan_value)}</span></div>
                            <div className="flex items-baseline justify-between gap-2"><span className="text-muted-foreground">SM</span><span className="whitespace-nowrap text-right">{formatCurrency(customer.sewa_modal)}</span></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="[font-variant-numeric:tabular-nums]">{customer.phone_number}</div>
                          <div className="mt-1 text-muted-foreground">{customer.alamat}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                             <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" aria-label={`Salin template untuk ${customer.name}`}><ClipboardCopy className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'jatuh-tempo')}>Copy Pengingat</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'keterlambatan')}>Copy Keterlambatan</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'peringatan-lelang')}>Copy Peringatan Lelang</DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                             <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={!canContact} aria-label={`Pilih notifikasi untuk ${customer.name}`}><Bell className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleSendNotification(customer, 'jatuh-tempo')}>Kirim Pengingat</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendNotification(customer, 'keterlambatan')}>Kirim Keterlambatan</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendNotification(customer, 'peringatan-lelang')}>Kirim Peringatan Lelang</DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button size="sm" className="h-7 w-7 p-0" disabled={isGeneratingVoicenote || !canContact} aria-label={`Buat pesan suara untuk ${customer.name}`}>
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
                    )
                  })
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
              {selectedCustomers.size > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                  Browser mungkin meminta izin untuk membuka beberapa tab. Izinkan pop-up agar notifikasi dapat dilanjutkan.
                  </div>
              )}
          </CardContent>
        </Card>
      </MotionCard>
    </main>
  );
}
