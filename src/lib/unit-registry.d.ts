export type LocalRole = 'superadmin' | 'unit';

export interface RegisteredUnit {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  email: string;
}

export interface UnitRegistrationInput {
  name: unknown;
  prefix: unknown;
  email: unknown;
  password: unknown;
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
  registerUnit(input: UnitRegistrationInput): Promise<RegisteredUnit>;
}

export declare function createUnitRegistry(options: {
  filePath: string;
  bootstrap: unknown;
}): UnitRegistry;
export declare function authenticateAccount(email: string, password: string): Promise<AuthenticatedRegistryUser | null>;
export declare function getActiveUnitByPrefix(prefix: string): Promise<RegisteredUnit | null>;
export declare function listUnits(): Promise<RegisteredUnit[]>;
export declare function registerUnit(input: UnitRegistrationInput): Promise<RegisteredUnit>;
