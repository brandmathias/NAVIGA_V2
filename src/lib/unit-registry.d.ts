export type LocalRole = 'superadmin' | 'unit';

export interface RegisteredUnit {
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
  managers: UnitStaffMember[];
  appraisers: UnitStaffMember[];
  email: string;
  adminName: string;
  adminPhone: string;
}

export interface UnitStaffMember {
  name: string;
  nip: string;
  phone: string;
}

export interface UnitAdminDraft {
  name: unknown;
  email: unknown;
  phone?: unknown;
  password: unknown;
}

export interface UnitRegistrationInput {
  name: unknown;
  prefix: unknown;
  domicile?: unknown;
  province?: unknown;
  phone?: unknown;
  address?: unknown;
  mapUrl?: unknown;
  managers?: unknown;
  appraisers?: unknown;
  admins?: unknown;
  adminName?: unknown;
  adminPhone?: unknown;
  email: unknown;
  password: unknown;
}

export interface UnitUpdateInput extends Omit<UnitRegistrationInput, 'email' | 'password'> {
  id: unknown;
}

export interface RegisteredUnitAdmin {
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
}

export interface UnitAdminRegistrationInput {
  unitId: unknown;
  name: unknown;
  email: unknown;
  password: unknown;
  domicile?: unknown;
  phone?: unknown;
  address?: unknown;
}

export interface UnitAdminUpdateInput {
  id: unknown;
  unitId: unknown;
  name: unknown;
  email: unknown;
  phone?: unknown;
  password?: unknown;
}

export interface AuthenticatedRegistryUser {
  name: string;
  email: string;
  role: LocalRole;
  unitId: string | null;
  unitName: string | null;
  unitPrefix: string | null;
  unitCode: string | null;
  unitDomicile: string | null;
  unitProvince: string | null;
  unitPhone: string | null;
  unitAddress: string | null;
  unitMapUrl: string | null;
  unitManagers: UnitStaffMember[];
  unitAppraisers: UnitStaffMember[];
  upc: string;
}

export interface UnitRegistry {
  ensure(): Promise<void>;
  authenticate(email: string, password: string): Promise<AuthenticatedRegistryUser | null>;
  getActiveUnitByPrefix(prefix: string): Promise<RegisteredUnit | null>;
  listUnits(): Promise<RegisteredUnit[]>;
  listUnitAdmins(): Promise<RegisteredUnitAdmin[]>;
  registerUnit(input: UnitRegistrationInput): Promise<RegisteredUnit>;
  registerUnitAdmin(input: UnitAdminRegistrationInput): Promise<RegisteredUnitAdmin>;
  updateUnit(input: UnitUpdateInput): Promise<RegisteredUnit>;
  updateUnitAdmin(input: UnitAdminUpdateInput): Promise<RegisteredUnitAdmin>;
}

export declare function createUnitRegistry(options: {
  filePath: string;
  bootstrap: unknown;
}): UnitRegistry;
export declare function authenticateAccount(email: string, password: string): Promise<AuthenticatedRegistryUser | null>;
export declare function getActiveUnitByPrefix(prefix: string): Promise<RegisteredUnit | null>;
export declare function listUnits(): Promise<RegisteredUnit[]>;
export declare function listUnitAdmins(): Promise<RegisteredUnitAdmin[]>;
export declare function registerUnit(input: UnitRegistrationInput): Promise<RegisteredUnit>;
export declare function registerUnitAdmin(input: UnitAdminRegistrationInput): Promise<RegisteredUnitAdmin>;
export declare function updateUnit(input: UnitUpdateInput): Promise<RegisteredUnit>;
export declare function updateUnitAdmin(input: UnitAdminUpdateInput): Promise<RegisteredUnitAdmin>;
