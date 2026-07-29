# Multi-Unit Local Authentication Design

## Goal

NAVIGA will support one Superadmin and multiple unit accounts without Firebase.
Each active unit owns one unique five-digit SBG prefix. PDF gadai and XLSX
angsuran are scoped on the server from that prefix.

## Roles

- `superadmin` can register a unit, assign its prefix, create its unit account,
  and view records from every active unit.
- `unit` is bound to exactly one active unit and can only receive records whose
  identifier starts with that unit's prefix.

## Local Persistence

The server stores units and password hashes in `.naviga/unit-registry.json`,
which is ignored by Git. Passwords use Node `scrypt` with a random salt; the
registry never stores plaintext passwords. Bootstrap passwords live only in
the ignored `.env.local` during first initialization.

Initial active units are Pegadaian Wanea (`11787`) and Pegadaian Ranotana
(`11793`). Garuda is intentionally not created until its five-digit code is
known and entered in the Superadmin form.

## Scope Enforcement

PDF customers are matched using the first five digits of `sbg_number`.
XLSX rows must expose a SBG, credit, contract, or installment identifier; the
same first-five-digit rule is applied on the server. Unknown or inactive
prefixes are excluded. Browser-side filtering is removed from the XLSX import
path.

## Administration UI

Only Superadmin sees `/unit-management`. The page lists active units and
offers one form to create a unit plus its account: unit name, five-digit
prefix, email, and initial password. Unit accounts never choose their scope at
login; it is assigned at registration.

## Error Handling

- Duplicate prefix or email is rejected.
- A unit cannot be created without exactly five numeric prefix digits.
- XLSX with no usable identifier returns an actionable error rather than
  applying a name-based unit guess.
- Existing signed sessions include role, unit identifier, and prefix, and are
  rejected when malformed or expired.

## Initial Credentials

The implementation creates the requested Wanea and Ranotana accounts from
the bootstrap environment. It generates the Superadmin bootstrap secret in
the ignored local configuration and reports it once after implementation.
