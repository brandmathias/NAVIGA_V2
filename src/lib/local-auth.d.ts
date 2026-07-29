export type LocalRole = 'superadmin' | 'unit';
export type LocalUpc = string;

export interface LocalUser {
  name: string;
  email: string;
  role: LocalRole;
  unitId: string | null;
  unitName: string | null;
  unitPrefix: string | null;
  upc: LocalUpc;
}

export interface LocalSession extends LocalUser {
  expiresAt: number;
}

export declare const SESSION_COOKIE_NAME: 'naviga_session';
export declare const SESSION_TTL_MS: number;
export declare const sessionCookieOptions: {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
};

export declare class LocalAuthError extends Error {
  status: 401;
}

export declare function authenticateLocalUser(email: string, password: string): Promise<LocalUser | null>;
export declare function createSessionToken(user: LocalUser, now?: number): string;
export declare function verifySessionToken(token: string | null | undefined, now?: number): LocalSession | null;
export declare function getSession(): Promise<LocalSession | null>;
export declare function requireSession(): Promise<LocalSession>;
