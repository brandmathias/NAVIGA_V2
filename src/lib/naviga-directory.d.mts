export type DirectoryPerson = { name: string; nip: string; phone: string };

export type DirectoryUnit = {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  domicile: string;
  province: string;
  unitCode: string;
  phone: string;
  address: string;
  mapUrl: string;
  managers: DirectoryPerson[];
  appraisers: DirectoryPerson[];
  email: string;
  adminName: string;
  adminPhone: string;
};

export type DirectoryAdmin = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  unitId: string;
  unitName: string;
  unitPrefix: string;
  unitCode: string;
  domicile: string;
  phone: string;
  address: string;
};

export function getUnitById(id: string): Promise<DirectoryUnit | null>;
export function listUnits(): Promise<DirectoryUnit[]>;
export function listUnitAdmins(): Promise<DirectoryAdmin[]>;
export function registerUnit(input: Record<string, unknown>, headers: Headers): Promise<DirectoryUnit>;
export function registerUnitAdmin(input: Record<string, unknown>, headers: Headers): Promise<DirectoryAdmin>;
export function updateUnit(input: Record<string, unknown>, headers: Headers): Promise<DirectoryUnit>;
export function updateUnitAdmin(input: Record<string, unknown>, headers: Headers): Promise<DirectoryAdmin>;
export function deleteUnitAdmin(id: string): Promise<DirectoryAdmin>;
export function bootstrapDirectory(): Promise<{ created: boolean; units: number; users: number }>;
