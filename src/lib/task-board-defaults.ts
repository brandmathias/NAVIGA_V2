import type { TaskBoardData } from '@/types';

export function createDefaultTaskBoardData(): TaskBoardData {
  return {
    tasks: {
      'task-1': { id: 'task-1', title: 'Analisis data penjualan Q2', description: 'Kumpulkan semua data penjualan dari April hingga Juni dan buat ringkasan eksekutif.', createdByUserId: 'admin-1', createdByName: 'Admin 1', createdBy: 'Admin 1', assignee: { name: 'Admin 1', avatar: 'https://placehold.co/40x40?text=A1' }, labels: ['Penting', 'Laporan'], dueDate: new Date().toISOString() },
      'task-2': { id: 'task-2', title: 'Follow up klaim nasabah XYZ', description: 'Hubungi nasabah untuk menginformasikan status klaim terbaru.', createdByUserId: 'admin-1', createdByName: 'Admin 1', createdBy: 'Admin 1' },
      'task-3': { id: 'task-3', title: 'Siapkan materi presentasi untuk rapat mingguan', createdByUserId: 'admin-1', createdByName: 'Admin 1', createdBy: 'Admin 1', labels: ['Rapat'] },
      'task-4': { id: 'task-4', title: 'Review draf kebijakan baru', createdByUserId: 'admin-2', createdByName: 'Admin 2', createdBy: 'Admin 2', assignee: { name: 'Admin 2', avatar: 'https://placehold.co/40x40?text=A2' }, labels: ['Review'] },
    },
    columns: {
      'column-1': { id: 'column-1', title: 'Daftar Tugas (To Do)', taskIds: ['task-1', 'task-2', 'task-3'] },
      'column-2': { id: 'column-2', title: 'Sedang Dikerjakan (In Progress)', taskIds: ['task-4'] },
      'column-3': { id: 'column-3', title: 'Selesai (Done)', taskIds: [] },
    },
    columnOrder: ['column-1', 'column-2', 'column-3'],
  };
}
