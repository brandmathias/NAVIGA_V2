import type { TaskPriority } from '@/types';

export type TaskPriorityOption = {
  value: TaskPriority;
  label: string;
  tone: string;
  selected: string;
};

export const TASK_PRIORITY_OPTIONS: TaskPriorityOption[] = [
  {
    value: 'tinggi',
    label: 'Prioritas tinggi',
    tone: 'border-[#ffb4b0] bg-[#fff4f4] text-[#ff4f44]',
    selected: 'border-[#ff7a72] bg-[#ffe8e7] text-[#ff4038] shadow-[0_10px_22px_rgba(255,82,74,0.14)]',
  },
  {
    value: 'sedang',
    label: 'Prioritas sedang',
    tone: 'border-[#ffd39b] bg-[#fff8ef] text-[#f08b00]',
    selected: 'border-[#ffb34f] bg-[#fff1d9] text-[#f08b00] shadow-[0_10px_22px_rgba(240,139,0,0.12)]',
  },
  {
    value: 'rendah',
    label: 'Prioritas rendah',
    tone: 'border-[#f5e0a6] bg-[#fffdf0] text-[#d79e00]',
    selected: 'border-[#f0c65a] bg-[#fff5d8] text-[#d79e00] shadow-[0_10px_22px_rgba(215,158,0,0.12)]',
  },
];
