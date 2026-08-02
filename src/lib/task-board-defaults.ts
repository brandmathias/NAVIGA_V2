import type { TaskBoardData } from '@/types';

export function createDefaultTaskBoardData(creator = { userId: 'demo-account', name: 'Akun saat ini' }): TaskBoardData {
  return {
    tasks: {
      'task-1': { id: 'task-1', title: 'Analisis data penjualan Q2', description: 'Kumpulkan semua data penjualan dari April hingga Juni. Bandingkan hasilnya dengan target unit. Susun ringkasan eksekutif untuk rapat evaluasi.', priority: 'tinggi', createdAt: '2026-07-20T08:00:00.000Z', createdByUserId: creator.userId, createdByName: creator.name, createdBy: creator.name, isFlagged: true, dueDate: '2026-08-10T00:00:00.000Z' },
      'task-2': { id: 'task-2', title: 'Follow up klaim nasabah XYZ', description: 'Hubungi nasabah untuk menginformasikan status klaim terbaru. Catat tanggapan pada riwayat layanan. Pastikan dokumen pendukung sudah lengkap.', priority: 'sedang', createdAt: '2026-07-22T08:00:00.000Z', createdByUserId: creator.userId, createdByName: creator.name, createdBy: creator.name, dueDate: '2026-08-12T00:00:00.000Z' },
      'task-3': { id: 'task-3', title: 'Siapkan materi presentasi untuk rapat mingguan', description: 'Rangkum perkembangan pekerjaan setiap unit. Tambahkan catatan risiko dan tindak lanjut. Kirim materi sebelum rapat dimulai.', priority: 'rendah', createdAt: '2026-07-25T08:00:00.000Z', createdByUserId: creator.userId, createdByName: creator.name, createdBy: creator.name, dueDate: '2026-08-15T00:00:00.000Z' },
      'task-4': { id: 'task-4', title: 'Review draf kebijakan baru', description: 'Baca draf kebijakan dan tandai bagian yang perlu diperjelas. Bandingkan dengan prosedur unit yang berlaku. Sampaikan catatan revisi kepada pemilik dokumen.', priority: 'sedang', createdAt: '2026-07-28T08:00:00.000Z', createdByUserId: creator.userId, createdByName: creator.name, createdBy: creator.name, dueDate: '2026-08-08T00:00:00.000Z' },
    },
    columns: {
      'column-1': { id: 'column-1', title: 'Daftar Tugas (To Do)', taskIds: ['task-1', 'task-2', 'task-3'] },
      'column-2': { id: 'column-2', title: 'Sedang Dikerjakan (In Progress)', taskIds: ['task-4'] },
      'column-3': { id: 'column-3', title: 'Selesai (Done)', taskIds: [] },
    },
    columnOrder: ['column-1', 'column-2', 'column-3'],
  };
}
