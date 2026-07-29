
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
import type { BroadcastCustomer, HistoryEntry, Customer } from '@/types';
import { Input } from '@/components/ui/input';
import { parsePdf } from './actions';
import { queueGadaiBroadcast } from '@/app/(main)/broadcast/fonnte-actions';
import { generateCustomerVoicenote } from '@/app/(main)/broadcast/tts-actions';
import VoicenotePreviewDialog from '@/components/VoicenotePreviewDialog';
import { normalizeIndonesianWhatsAppNumber } from '@/lib/whatsapp-recipient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalSession } from '@/components/main-shell';


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
type ActionStatus = 'Antrean Fonnte Diterima' | 'WhatsApp Dibuka' | 'Pesan Disalin';

export default function PdfBroadcastPage() {
  const adminUser = useLocalSession();
  const { toast } = useToast();
  const [extractedData, setExtractedData] = React.useState<BroadcastCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = React.useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isQueueing, setIsQueueing] = React.useState(false);
  const [isGeneratingVoicenote, setIsGeneratingVoicenote] = React.useState(false);
  const [activeVoicenote, setActiveVoicenote] = React.useState<{
    audioDataUri: string;
    whatsappUrl: string;
    customerName: string;
    customer: BroadcastCustomer;
    template: NotificationTemplate;
  } | null>(null);

  const logHistory = (customer: BroadcastCustomer, status: ActionStatus, template: NotificationTemplate) => {
    try {
      const storageKey = adminUser.role === 'superadmin'
        ? 'broadcastHistory_all'
        : `broadcastHistory_${adminUser.unitPrefix ?? 'unit'}`;

      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}-${customer.sbg_number}`,
        timestamp: new Date().toISOString(),
        type: 'Gadaian Broadcast',
        customerName: customer.name,
        customerIdentifier: customer.sbg_number,
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

    if (file.type !== 'application/pdf') {
        toast({
            title: 'Invalid File Type',
            description: 'Please upload a PDF file.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setExtractedData([]);
    setSelectedCustomers(new Set());
    toast({
        title: 'Memproses PDF lokal...',
        description: 'Data sedang diekstraksi di komputer ini.',
    });

    const formData = new FormData();
    formData.append('pdf-file', file);

    try {
        const results = await parsePdf(formData);
        
        if (results.length === 0) {
            toast({
                title: 'No Data Extracted',
                description: adminUser.role === 'superadmin'
                    ? 'The AI could not find any customer data in the PDF.'
                    : `Tidak ada data untuk prefix unit ${adminUser.unitPrefix ?? '-'} pada PDF ini.`,
                variant: 'destructive',
            });
        } else {
            setExtractedData(results);
            toast({
                title: 'Extraction Complete',
                description: `${results.length} records have been loaded from the PDF.`,
            });
        }
    } catch (error: any) {
        toast({
            title: 'Error Processing PDF',
            description: error.message || 'An unknown error occurred.',
            variant: 'destructive',
        });
        console.error("PDF processing error:", error);
    } finally {
        setIsLoading(false);
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = '';
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
      const allSbgNumbers = new Set(extractedData
        .filter((customer) => normalizeIndonesianWhatsAppNumber(customer.phone_number))
        .map((customer) => customer.sbg_number));
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
        description: `Pesan untuk ${customer.name} telah disalin ke clipboard.`,
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

  const handleQueueNotification = async (customers: BroadcastCustomer[], template: NotificationTemplate) => {
    if (customers.some((customer) => !normalizeIndonesianWhatsAppNumber(customer.phone_number))) {
      toast({
        title: 'Nomor WhatsApp Tidak Valid',
        description: 'Periksa nomor HP hasil OCR sebelum mengantrekan Fonnte.',
        variant: 'destructive',
      });
      return;
    }

    const customerCount = customers.length;
    if (!window.confirm(
      `Antrekan notifikasi untuk ${customerCount} nasabah terpilih dengan interval 60 detik? Penerimaan antrean bukan bukti pesan terkirim.`,
    )) return;

    setIsQueueing(true);
    try {
      const result = await queueGadaiBroadcast({ customers, template });
      if (result.unavailable) {
        toast({
          title: 'Fonnte Belum Aktif',
          description: 'Fonnte belum dikonfigurasi di server. Tambahkan FONNTE_ENABLED=true dan FONNTE_TOKEN sebelum mengantrekan pesan.',
          variant: 'destructive',
        });
        return;
      }
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

   const handleGenerateVoicenote = async (customer: BroadcastCustomer, template: NotificationTemplate) => {
    const formattedPhoneNumber = normalizeIndonesianWhatsAppNumber(customer.phone_number);
    if (!formattedPhoneNumber) {
      toast({
        title: 'Nomor WhatsApp Tidak Valid',
        description: 'Periksa nomor HP hasil OCR sebelum membuat pesan suara.',
        variant: 'destructive',
      });
      return;
    }
    setIsGeneratingVoicenote(true);
    toast({
        title: 'Membuat Pesan Suara...',
        description: `Piper sedang membuat pesan suara untuk ${customer.name}.`,
    });
    try {
        const whatsappUrl = `https://wa.me/${formattedPhoneNumber}`;

        const message = getNotificationMessage(customer, template);
        const { audioDataUri } = await generateCustomerVoicenote({ text: message });

        setActiveVoicenote({
            audioDataUri,
            whatsappUrl,
            customerName: customer.name,
            customer,
            template,
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
    if (selectedCustomers.size === 0) {
      toast({
        title: 'No Customers Selected',
        description: 'Please select at least one customer to notify.',
        variant: 'destructive',
      });
      return;
    }

    const customersToNotify = extractedData.filter((c) => selectedCustomers.has(c.sbg_number));
    await handleQueueNotification(customersToNotify, 'jatuh-tempo');
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       {activeVoicenote && (
          <VoicenotePreviewDialog
            isOpen={!!activeVoicenote}
            onClose={() => setActiveVoicenote(null)}
            audioDataUri={activeVoicenote.audioDataUri}
            customerName={activeVoicenote.customerName}
            onConfirm={() => {
                window.open(activeVoicenote.whatsappUrl, '_blank');
                logHistory(activeVoicenote.customer, 'WhatsApp Dibuka', activeVoicenote.template);
            }}
          />
        )}
      <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight font-headline">Gadaian Broadcast</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Panel Gadaian Broadcast</CardTitle>
          <CardDescription>
            Impor data nasabah langsung dari file PDF untuk mengirim notifikasi massal. Data akan otomatis difilter berdasarkan UPC Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isLoading ? 'Processing...' : 'Import PDF'}
            </Button>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
            />
            <div className="flex-grow"></div>
            <Button onClick={handleNotifySelected} disabled={selectedCustomers.size === 0 || isLoading || isQueueing}>
              <Send className="mr-2 h-4 w-4" />
              Antrekan Terpilih ({selectedCustomers.size})
            </Button>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedCustomers.size > 0 && selectedCustomers.size === extractedData.filter((customer) => normalizeIndonesianWhatsAppNumber(customer.phone_number)).length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                      disabled={extractedData.length === 0 || isQueueing}
                    />
                  </TableHead>
                  <TableHead>No. SBG</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Rubrik</TableHead>
                  <TableHead>Tgl. Kredit &amp; Jth Tempo</TableHead>
                  <TableHead>Barang Jaminan</TableHead>
                  <TableHead>Taksiran</TableHead>
                  <TableHead>UP (Uang Pinjaman)</TableHead>
                  <TableHead>SM (Sewa Modal)</TableHead>
                  <TableHead>Telp/HP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                     <TableRow>
                        <TableCell colSpan={12} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Data sedang diekstraksi secara lokal...</p>
                        </TableCell>
                    </TableRow>
                ) : extractedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-24 text-center">
                          No data extracted. Click "Import PDF" to begin.
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
                            disabled={!canContact || isQueueing}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{customer.sbg_number}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.rubrik}</TableCell>
                      <TableCell>
                        <div>{formatDate(displayCreditDate)}</div>
                        <div className='font-bold'>{formatDate(displayDueDate)}</div>
                      </TableCell>
                      <TableCell>{customer.barang_jaminan}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.taksiran)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.loan_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.sewa_modal)}</TableCell>
                      <TableCell>{customer.phone_number}</TableCell>
                      <TableCell>{customer.alamat}</TableCell>
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
                                    <Button size="sm" disabled={isGeneratingVoicenote || !canContact}>
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
            {selectedCustomers.size > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                    Nasabah akan diantrekan melalui Fonnte dengan interval 60 detik. Penerimaan antrean bukan bukti pesan terkirim.
                </div>
            )}
        </CardContent>
      </Card>
    </main>
  );
}

    
