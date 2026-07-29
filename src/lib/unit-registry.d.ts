export type LocalRole = 'superadmin' | 'unit';

export interface RegisteredUnit {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  domicile: string;
  phone: string;
  address: string;
  email: string;
  adminName: string;
  adminPhone: string;
}

export interface UnitRegistrationInput {
  name: unknown;
  prefix: unknown;
  domicile?: unknown;
  phone?: unknown;
  address?: unknown;
  adminName?: unknown;
  adminPhone?: unknown;
  email: unknown;
  password: unknown;
}

export interface RegisteredUnitAdmin {
  id: string;
  name: string;
  email: string;
  active: boolean;
  unitId: string;
  unitName: string;
  unitPrefix: string;
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

export interface AuthenticatedRegistryUser {
  name: string;
  email: string;
  role: LocalRole;
  unitId: string | null;
  unitName: string | null;
  unitPrefix: string | null;
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
