# Chronicle — Architecture Audit & Development Roadmap

> **Produced by:** Principal Software Architect review  
> **Source of truth:** Actual repository contents, read in full  
> **Date:** 2026-06-23  
> **Scope:** Local evidence platform completion before blockchain integration

---

# 1. Current State Audit

## Root Monorepo

**Purpose:** Workspace orchestration via Turborepo + Yarn Workspaces.

**Current contents:**

| File | Status |
|---|---|
| `package.json` | Defines workspaces `apps/*`, `packages/*`. Scripts delegate to Turbo. Yarn 4.14.1. |
| `turbo.json` | Defines `dev`, `build`, `lint`, `test` tasks. Build correctly depends on `^build`. Test task defined but no test runner installed. |
| `.yarnrc.yml` | Single line: `nodeLinker: node-modules`. Classic resolution strategy — intentional choice. |
| `.editorconfig` | LF line endings, 2-space indent. **Conflicts with actual files** — shared package files use CRLF (`\r\n`), web package uses LF. Mixed line endings already present. |
| `.gitignore` | **Empty file.** This is a critical omission. `node_modules`, `.next`, `.env.local` are all unprotected. |
| `README.md` | **Empty file.** No project documentation exists at the root. |
| `package-lock.json` | Present alongside `yarn.lock` — this is a conflict. Two lock files from two different package managers should not coexist. |

**Quality assessment:** Functional but critically under-configured. The monorepo skeleton is sound. Turborepo is correctly set up. The major issues are housekeeping: empty gitignore, empty README, mixed lock files, mixed line endings.

**Technical debt:**
- Empty `.gitignore` — secrets and build artifacts will be committed
- `package-lock.json` alongside `yarn.lock` — inconsistency; pick one manager
- `.editorconfig` declares LF but CRLF is used in `packages/shared`

**Missing pieces:**
- A root `.gitignore` that covers `.next/`, `node_modules/`, `.env.local`, `.turbo/`, `dist/`
- Root `README.md` explaining the project
- Consistent line endings enforced via `.gitattributes` (file exists but contents were not confirmed non-default)

---

## packages/shared

**Purpose:** Framework-agnostic business logic. The "brain" of Chronicle — cryptography, hashing, storage, verification, and domain types.

**Current modules:**

### `src/evidence/types.ts` (8 lines)
```ts
export type EvidenceRecord = {
  id: string;
  fileName: string;
  hash: string;
  createdAt: number;
  encrypted: boolean;
  iv?: number[];
};
```
**Analysis:** This type is the core domain model. It is minimal but directionally correct. However:
- `iv` is typed as `number[]` — this is what comes out of `Array.from(new Uint8Array(12))`. Semantically it should be `Uint8Array` or `number[]` with a clear comment. The current choice works but will cause confusion when deserializing from IndexedDB.
- No `fileSize` field
- No `mimeType` field
- No `description`/`label` field for user-provided context
- No `status` field (`'pending' | 'verified' | 'tampered'`)
- `encrypted: boolean` is too coarse — if `true`, there is no associated `encryptionKeyId` or key export hint stored
- No versioning field to support future schema migrations
- `createdAt` as `number` (Unix ms) is fine, but no `updatedAt` or `verifiedAt`

### `src/evidence/hash.ts` (8 lines)
```ts
export async function hashFile(file: File): Promise<string>
```
**Analysis:** Correct and clean implementation. Uses `crypto.subtle.digest("SHA-256")` via the Web Crypto API. Returns a lowercase hex string. This is the right approach for a browser environment.

Problems:
- No error handling — if `file.arrayBuffer()` throws, the error propagates uncaught to callers
- The function name `hashFile` is accurate but the module doesn't export a `hashBuffer` variant, which will be needed when verifying encrypted blobs
- No way to hash a `Blob`, `ArrayBuffer`, or `string` — only `File`

### `src/evidence/crypto.ts` (35 lines)
```ts
export async function generateKey(): Promise<CryptoKey>
export async function encryptFile(file: File, key: CryptoKey): Promise<{ iv: number[], encrypted: Blob }>
export async function decryptFile(encrypted: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer>
```
**Analysis:** The AES-GCM implementation is technically correct. The comment `// ✅ use ArrayBuffer directly (BEST FIX)` indicates a past debugging session — suggests the implementation was arrived at iteratively.

Problems:
- `generateKey` generates a key but there is **no mechanism to export, store, or retrieve it**. Keys are ephemeral in memory only. If the page reloads, the key is permanently lost and the encrypted file is unrecoverable.
- `encryptFile` takes the full file in memory. For large files this will cause OOM crashes. Acceptable for a learning project now, but worth noting.
- `decryptFile` accepts `Uint8Array` for iv but `encryptFile` stores it as `number[]`. The caller must convert `number[]` → `Uint8Array` manually — this asymmetry is a bug surface.
- No key export/import functions (`exportKey`, `importKey`)
- No key derivation (PBKDF2) for password-based key generation
- Return type of `generateKey` is implicit — should be explicitly typed

### `src/evidence/store.ts` (46 lines)
```ts
function openDB(): Promise<IDBDatabase>   // private
export async function saveEvidence(data: any): Promise<boolean>
export async function getAllEvidence(): Promise<unknown>
```
**Analysis:** A functional IndexedDB wrapper. Correctly creates an object store with `keyPath: "id"`. Uses transactions properly.

Problems:
- `saveEvidence(data: any)` — the `any` type defeats the purpose of TypeScript. Should accept `EvidenceRecord`.
- `getAllEvidence()` returns `unknown` (implicit) — callers cannot use the return value without casting. Should return `Promise<EvidenceRecord[]>`.
- No `getEvidence(id: string)` — can only fetch all records
- No `deleteEvidence(id: string)` — records cannot be removed
- No `updateEvidence(record: EvidenceRecord)` — records cannot be updated (e.g., to set `verified` status)
- IndexedDB version is hardcoded to `1` — migration strategy not defined
- `openDB()` creates a new connection on every call — connection is not shared/cached. This will cause performance issues and could hit browser connection limits under load.
- DB name `"chronicle-db"` and store name `"evidence"` are magic strings — should be constants (already done for `DB_NAME` and `STORE` but within function scope rather than module-level exports)
- No error normalization — raw IDB errors bubble up

### `src/evidence/verify.ts` (6 lines)
```ts
export async function verifyFile(file: File, expectedHash: string): Promise<boolean>
```
**Analysis:** Correct and minimal. The verification logic is sound.

Problems:
- Returns only `boolean` — no detail on *why* verification failed
- No `VerificationResult` type (mentioned in project goals but not implemented)
- No timestamp recording of when verification occurred
- Cannot verify against an `ArrayBuffer` or hash string directly — only against a live `File`

### `src/index.ts` (5 lines)
Barrel export of all evidence modules. Flat re-exports with `export * from`.

**Problems:**
- All functions are exported from a single flat namespace. This means `saveEvidence`, `getAllEvidence`, `hashFile`, `encryptFile`, `decryptFile`, `verifyFile`, `generateKey` are all mixed together. As the package grows this becomes hard to navigate.
- No namespace grouping (`evidence`, `crypto`, `storage`)

### `package.json`
```json
{
  "name": "@chronicle/shared",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```
**Analysis:** The package points directly to TypeScript source files, not compiled output. This works because Next.js transpiles it via webpack/SWC and the `moduleResolution: "Bundler"` config. It is a legitimate approach for an internal monorepo package, but it means:
- The package cannot be published or consumed outside of this bundler setup
- There is no `tsup` / `tsc` build step — changes are always live

### `tsconfig.json`
**Problem:** The `paths` alias `"@chronicle/shared": ["packages/shared/src"]` is defined relative to `"baseUrl": "."` — this is inside `packages/shared/`, not the repo root. This path alias does not match how the package is actually referenced from `apps/web` (via the workspace name `@chronicle/shared`). This is a misconfiguration but it works because the workspace resolution takes precedence.

**Quality summary: Functional skeleton, critically incomplete.**  
The core cryptographic primitives exist and work. The storage layer has the right shape. The domain model is defined. Everything else — key management, typed returns, CRUD completeness, error handling — is missing.

---

## apps/web

**Purpose:** Next.js 16 frontend. User interface, workflows, hooks, and page composition.

### `src/app/layout.tsx`
- Imports `Providers` from `@/lib/web3/providers` — wraps the entire app in WagmiProvider + QueryClientProvider + RainbowKitProvider
- Uses Geist and Geist Mono fonts from Google
- Metadata title is `"Create Next App"` — **placeholder never updated**
- Description is `"Generated by create next app"` — **placeholder never updated**

### `src/app/page.tsx`
- Renders `<ConnectWalletButton />` and `<WalletInfo />` side by side in a centered flex container
- Imports `WalletConnect` (default export) but **never uses it** — dead import
- This page has zero evidence management functionality despite `useEvidence.ts` existing

**The homepage is a wallet connection debug screen. It is not a product page.**

### `src/app/globals.css`
- Tailwind v4 via `@import "tailwindcss"`
- Imports RainbowKit styles
- Minimal color tokens for light/dark mode
- Body font is `Arial, Helvetica, sans-serif` — **overrides the Geist font loaded in layout.tsx** — the fonts are loaded but never actually applied to body text

### `src/hooks/useEvidence.ts`
```ts
export function useEvidence(): { addFile: (file: File) => Promise<EvidenceRecord>, loading: boolean }
```
**Analysis:** The only evidence-related hook. It correctly calls `hashFile` then `saveEvidence`, constructs an `EvidenceRecord`, and manages loading state.

**Problems:**
- No `error` state — if `hashFile` or `saveEvidence` throws, the error is swallowed silently (there is no catch block — it will propagate but the UI has no way to display it)
- No `records` state — no way to display stored evidence through this hook
- No `loadRecords()` function to fetch from IndexedDB
- No `verifyRecord()` function
- The hook creates a record inline with `crypto.randomUUID()` and `Date.now()` — this ID generation should be in `packages/shared` as a factory function `createEvidenceRecord()`
- `encrypted: false` is hardcoded — encryption flow is not connected

### `src/components/WalletConnect.tsx`
A thin wrapper around `<ConnectButton />`. Functionally identical to `connectWallet_Button.tsx`. **This is a duplicate.** Two files do the exact same thing.

### `src/components/wallet/connectWallet_Button.tsx`
Renders `<ConnectButton />`. Named export `ConnectWalletButton`.

**Naming problem:** `connectWallet_Button.tsx` uses snake_case mixed with PascalCase — inconsistent with React conventions. Should be `ConnectWalletButton.tsx`.

### `src/components/wallet/walletInfo.tsx`
Displays connected wallet address and chain ID. Uses wagmi's `useAccount` and `useChainId`.

**Naming problem:** `walletInfo.tsx` should be `WalletInfo.tsx` (PascalCase for React components).

### `src/lib/web3/config.ts`
Configures Wagmi with RainbowKit defaults. Targets Sepolia testnet. Uses `process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` with a non-null assertion `!`.

**Problem:** The `!` non-null assertion means if the env var is missing, a runtime error occurs that is difficult to diagnose. Should validate at startup.

### `src/lib/web3/chains.ts`
Exports `supportedChains = [sepolia]` and `defaultChain = sepolia`.

**Problem:** `supportedChains` is imported by nothing. `config.ts` imports `sepolia` directly from wagmi/chains instead of using this abstraction. **This file is dead code.**

### `src/lib/web3/providers.tsx`
Correct implementation of the provider stack. `QueryClient` is instantiated at module level — this means a single shared query client for the lifetime of the module. This is fine for SSR but could cause test isolation issues.

### `src/lib/web3/hooks/` (directory)
**Empty directory.** Exists but contains no files.

**Quality summary: Extremely early-stage. The frontend is a wallet connection playground, not an evidence management application.**

---

## contracts/

**Purpose:** Smart contracts (Hardhat).

**Current contents:** Empty directory.

**Assessment:** Placeholder only. No Hardhat config, no Solidity files, no deployment scripts.

---

## docs/

**Purpose:** Project documentation.

| File | Status |
|---|---|
| `architecture.md` | Empty |
| `decisions.md` | Empty |
| `roadmap.md` | Contains **decisions**, not a roadmap — mislabeled file. Content includes: Hybrid Ownership Model, Wallet Auth Only, Yarn as package manager, Hardhat 3 for contracts. |

**Assessment:** The `roadmap.md` is actually `decisions.md` content. Both doc files meant to hold content are empty. Documentation does not exist.

---

# 2. Architecture Evaluation

## What's Working

1. **Monorepo separation is correct.** The decision to put cryptographic logic in `packages/shared` and UI in `apps/web` is architecturally sound and should be preserved.
2. **Web Crypto API usage is correct.** AES-GCM, SHA-256 via `crypto.subtle` is the right choice for browser-based cryptography.
3. **IndexedDB for persistence is correct.** Browser-local persistence without a backend server is appropriate for Phase 1 of a learning project.
4. **Wagmi + RainbowKit is a mature stack.** The web3 provider setup is boilerplate-correct.
5. **Turborepo task graph is correct.** Build depends on `^build` (dependencies first), dev is persistent and uncached.

## Architecture Mistakes

### 1. Zero architectural connection between evidence and UI
`useEvidence.ts` exists and imports from `@chronicle/shared`, but **no UI component consumes `useEvidence`**. The hook is orphaned. The page only shows wallet UI. This means the entire evidence capability exists in code but is unreachable by the user.

### 2. Duplicate wallet components
`WalletConnect.tsx` and `connectWallet_Button.tsx` are functionally identical. One of them must be deleted.

### 3. `any` types defeat TypeScript's purpose
`saveEvidence(data: any)` in `store.ts` means the store accepts garbage. The TypeScript investment is wasted here.

### 4. No key persistence strategy
`generateKey()` creates an AES-GCM key but there is no `exportKey()`, no storage, and no retrieval mechanism. Every encrypted file would become permanently unrecoverable on page reload. This is not a minor omission — it makes the encryption feature architecturally broken at the system level even though the cryptographic primitive itself is correct.

### 5. Dead code
- `src/lib/web3/chains.ts` — exported but imported by nothing
- `WalletConnect.tsx` default export — imported in `page.tsx` but not rendered
- `src/lib/web3/hooks/` — empty directory

### 6. Naming inconsistencies
- `connectWallet_Button.tsx` (snake_case + PascalCase)
- `walletInfo.tsx` (lowercase component file)
- React component files should always be PascalCase

### 7. `@chronicle/shared` is missing the `@chronicle/shared` path alias in `apps/web`
`apps/web/tsconfig.json` only has `"@/*": ["./src/*"]` path alias. There is no `"@chronicle/shared"` path alias defined. The import `import { hashFile } from "@chronicle/shared"` works at runtime **only** because yarn workspace resolution handles it, but the TypeScript language server may not resolve it correctly for IDE intellisense. This should be explicit.

### 8. No test infrastructure
`turbo.json` defines a `test` task but no testing framework is installed anywhere — no Vitest, no Jest, no Testing Library. This should be established early.

### 9. `globals.css` font conflict
Body font is set to `Arial` overriding the Geist variables loaded in layout.

---

# 3. Desired Final Architecture

This is the target folder structure for a **complete local evidence platform**, ready for blockchain integration in Phase 6.

```
Chronicle/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx                    # Root layout, font setup, providers
│       │   │   ├── globals.css                   # Design tokens, Tailwind base
│       │   │   ├── page.tsx                      # Landing / redirect to /evidence
│       │   │   ├── evidence/
│       │   │   │   ├── page.tsx                  # Evidence dashboard (list of records)
│       │   │   │   ├── upload/
│       │   │   │   │   └── page.tsx              # Upload workflow
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx              # Single record detail view
│       │   │   │       └── verify/
│       │   │   │           └── page.tsx          # Verification workflow for this record
│       │   │   └── settings/
│       │   │       └── page.tsx                  # App settings (theme, storage info)
│       │   │
│       │   ├── components/
│       │   │   ├── evidence/
│       │   │   │   ├── EvidenceCard.tsx          # Single record card (summary)
│       │   │   │   ├── EvidenceList.tsx          # Grid/list of EvidenceCards
│       │   │   │   ├── EvidenceDetail.tsx        # Full record detail view
│       │   │   │   ├── EvidenceStatus.tsx        # Status badge (verified/tampered/pending)
│       │   │   │   ├── UploadZone.tsx            # Drag-and-drop file upload area
│       │   │   │   └── VerifyPanel.tsx           # Side-by-side hash comparison UI
│       │   │   ├── wallet/
│       │   │   │   ├── ConnectWalletButton.tsx   # RainbowKit connect button wrapper
│       │   │   │   └── WalletInfo.tsx            # Address + chain display
│       │   │   └── ui/
│       │   │       ├── Button.tsx                # Base button component
│       │   │       ├── Card.tsx                  # Base card component
│       │   │       ├── Badge.tsx                 # Status/label badge
│       │   │       ├── EmptyState.tsx            # "No records yet" placeholder
│       │   │       ├── FileIcon.tsx              # File type icon
│       │   │       └── LoadingSpinner.tsx        # Loading indicator
│       │   │
│       │   ├── hooks/
│       │   │   ├── useEvidence.ts                # Evidence CRUD orchestration hook
│       │   │   ├── useUpload.ts                  # File upload + hashing workflow
│       │   │   ├── useVerify.ts                  # Verification workflow
│       │   │   └── useEvidenceStore.ts           # Direct store access hook (load/delete)
│       │   │
│       │   └── lib/
│       │       └── web3/
│       │           ├── config.ts                 # Wagmi config
│       │           ├── chains.ts                 # Supported chains list
│       │           └── providers.tsx             # Provider tree
│       │
│       ├── public/                               # Static assets (logo, icons)
│       ├── package.json
│       ├── next.config.ts
│       └── tsconfig.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── evidence/
│       │   │   ├── types.ts                      # EvidenceRecord, VerificationResult, EncryptionMetadata
│       │   │   ├── factory.ts                    # createEvidenceRecord() — ID + timestamp generation
│       │   │   ├── hash.ts                       # hashFile(), hashBuffer(), hashString()
│       │   │   ├── crypto.ts                     # generateKey(), encryptFile(), decryptFile(), exportKey(), importKey()
│       │   │   ├── store.ts                      # saveEvidence(), getAllEvidence(), getEvidence(), deleteEvidence(), updateEvidence()
│       │   │   └── verify.ts                     # verifyFile(), verifyHash() → VerificationResult
│       │   └── index.ts                          # Barrel exports (namespaced)
│       ├── package.json
│       └── tsconfig.json
│
├── contracts/                                    # (Phase 6) Hardhat project
│   ├── hardhat.config.ts
│   ├── contracts/
│   │   └── EvidenceAnchor.sol
│   ├── scripts/
│   │   └── deploy.ts
│   └── test/
│       └── EvidenceAnchor.test.ts
│
└── docs/
    ├── architecture.md                           # System design overview
    ├── decisions.md                              # ADR log
    └── roadmap.md                               # Phase roadmap (this document)
```

---

# 4. Development Roadmap

---

## Phase 1 — Evidence Record System

### Objective
Establish a complete, type-safe, fully functional evidence record system in `packages/shared`. This is the foundation everything else is built on. No UI. No blockchain. Just reliable, tested business logic.

### Features
- Complete `EvidenceRecord` type with all necessary fields
- `VerificationResult` type
- `EncryptionMetadata` type
- Factory function for creating records
- Multiple hash input types (`File`, `ArrayBuffer`, `string`)
- Full CRUD in IndexedDB store with typed returns
- Key export/import for encryption
- Typed, detailed verification results

### Files — Create or Modify

#### MODIFY `packages/shared/src/evidence/types.ts`
Expand from 8 lines to the full domain model. See Section 5 for exact types.

#### CREATE `packages/shared/src/evidence/factory.ts`
```
Exports: createEvidenceRecord(file: File, hash: string): EvidenceRecord
Purpose: Centralizes ID generation and timestamp assignment
```

#### MODIFY `packages/shared/src/evidence/hash.ts`
Add:
- `hashBuffer(buffer: ArrayBuffer): Promise<string>`
- `hashBlob(blob: Blob): Promise<string>`
- Wrap existing `hashFile` to use `hashBuffer` internally (DRY)
- Add basic error handling

#### MODIFY `packages/shared/src/evidence/crypto.ts`
Add:
- `exportKey(key: CryptoKey): Promise<JsonWebKey>` — serialize key to JWK
- `importKey(jwk: JsonWebKey): Promise<CryptoKey>` — deserialize key from JWK
- Fix IV asymmetry: `encryptFile` should return `iv: Uint8Array`, not `iv: number[]`
- Fix `decryptFile` signature to accept `number[]` | `Uint8Array` for iv
- Add explicit return types to all functions

#### MODIFY `packages/shared/src/evidence/store.ts`
- Remove `any` — type `saveEvidence(record: EvidenceRecord): Promise<void>`
- Type `getAllEvidence(): Promise<EvidenceRecord[]>`
- Add `getEvidence(id: string): Promise<EvidenceRecord | null>`
- Add `deleteEvidence(id: string): Promise<void>`
- Add `updateEvidence(record: EvidenceRecord): Promise<void>`
- Cache the DB connection (open once, reuse)
- Move `DB_NAME` and `STORE` to module-level constants

#### MODIFY `packages/shared/src/evidence/verify.ts`
- Change return type from `boolean` to `VerificationResult`
- Add `verifyHash(hash1: string, hash2: string): VerificationResult`
- Add `verifiedAt` timestamp to result

#### MODIFY `packages/shared/src/index.ts`
Group exports by namespace:
```ts
// Evidence types
export * from "./evidence/types";
export * from "./evidence/factory";
// Hashing
export * from "./evidence/hash";
// Encryption
export * from "./evidence/crypto";
// Storage
export * from "./evidence/store";
// Verification
export * from "./evidence/verify";
```

### Dependencies
- None. This phase is entirely self-contained within `packages/shared`.

### Deliverables
- All 6 modules in `packages/shared/src/evidence/` are complete with correct TypeScript types
- Every exported function has explicit return types
- No `any` types remain
- `EvidenceRecord`, `VerificationResult`, and `EncryptionMetadata` are fully defined

### Acceptance Criteria
- TypeScript compiles with `strict: true` and zero errors in the shared package
- `createEvidenceRecord(file, hash)` returns a properly shaped object
- `saveEvidence(record)` and `getAllEvidence()` round-trip correctly in a browser console test
- `encryptFile` + `exportKey` → page reload → `importKey` + `decryptFile` produces the original bytes

---

## Phase 2 — Evidence Dashboard

### Objective
Build the Evidence Dashboard page — the central hub where users can see all stored evidence records. This is the first real product screen, replacing the current wallet debug page as the application entry point.

### Features
- Evidence list page at `/evidence`
- Evidence card component showing: filename, hash (truncated), date, status badge
- Empty state when no records exist
- Loading state while fetching from IndexedDB
- Navigation structure (basic header with app name)
- Fix homepage to redirect or link to the dashboard

### Files — Create or Modify

#### MODIFY `apps/web/src/app/layout.tsx`
- Update `metadata.title` to `"Chronicle"`
- Update `metadata.description` to something accurate
- Fix the Geist font CSS variable application in `globals.css`

#### MODIFY `apps/web/src/app/globals.css`
- Fix body font to use `var(--font-geist-sans)`
- Establish base design tokens (colors, spacing scale)

#### MODIFY `apps/web/src/app/page.tsx`
- Remove the dead `WalletConnect` import
- Add a `<Link>` to `/evidence` or redirect there
- Give the landing page a purpose

#### CREATE `apps/web/src/app/evidence/page.tsx`
- Server component outer shell
- Contains client component `EvidenceList`

#### MODIFY `apps/web/src/hooks/useEvidence.ts`
- Add `error: Error | null` state
- Add `records: EvidenceRecord[]` state
- Add `loadRecords(): Promise<void>` function
- Add `deleteRecord(id: string): Promise<void>` function
- Wrap `addFile` in proper try/catch with error state update

#### CREATE `apps/web/src/hooks/useEvidenceStore.ts`
- Hook that loads evidence on mount
- Exposes `{ records, loading, error, refresh }`
- Used by list-only views that don't need the upload workflow

#### CREATE `apps/web/src/components/evidence/EvidenceCard.tsx`
- Props: `record: EvidenceRecord`
- Displays: filename, truncated hash, formatted date, status badge
- Links to `/evidence/[id]`

#### CREATE `apps/web/src/components/evidence/EvidenceList.tsx`
- Props: `records: EvidenceRecord[]`
- Renders grid of `EvidenceCard` components
- Handles empty state

#### CREATE `apps/web/src/components/evidence/EvidenceStatus.tsx`
- Props: `status: 'verified' | 'pending' | 'tampered'`
- Renders a colored badge

#### CREATE `apps/web/src/components/ui/EmptyState.tsx`
- Generic empty state with icon, title, description, and optional CTA button

#### CREATE `apps/web/src/components/ui/LoadingSpinner.tsx`
- Accessible loading indicator

#### DELETE `apps/web/src/components/WalletConnect.tsx`
- Duplicate of `ConnectWalletButton`. Remove it.

#### RENAME `apps/web/src/components/wallet/connectWallet_Button.tsx` → `ConnectWalletButton.tsx`
#### RENAME `apps/web/src/components/wallet/walletInfo.tsx` → `WalletInfo.tsx`

### Dependencies
- Phase 1 must be complete (typed `EvidenceRecord`, working `getAllEvidence()`)

### Deliverables
- `/evidence` route renders a list of all stored evidence records
- Empty state displays correctly when no records exist
- Records load from IndexedDB asynchronously with loading indicator
- Page title says "Chronicle" not "Create Next App"

### Acceptance Criteria
- Open browser, navigate to `/evidence`, no console errors
- IndexedDB shows `chronicle-db` with `evidence` store in DevTools
- At least the empty state renders correctly
- Wallet connection UI is still accessible from the header

---

## Phase 3 — Upload Workflow (Core Evidence Creation)

### Objective
Build the complete upload workflow — the feature that makes Chronicle actually useful. A user can select a file, watch it get hashed, optionally provide metadata, and submit it to create a permanent local evidence record.

### Features
- Upload page at `/evidence/upload`
- Drag-and-drop file zone with visual feedback
- Real-time SHA-256 hash display as file is selected
- Form fields: optional description, optional tags
- Submit button creates the evidence record
- Success state showing the created record
- Error handling with user-visible error messages

### Files — Create or Modify

#### CREATE `apps/web/src/app/evidence/upload/page.tsx`
- Client component
- Uses `useUpload` hook
- Hosts `UploadZone` and a confirmation form

#### CREATE `apps/web/src/hooks/useUpload.ts`
```ts
// State machine for the upload workflow:
// idle → selecting → hashing → confirming → saving → success | error
export function useUpload() {
  // file: File | null
  // hash: string | null
  // status: UploadStatus
  // error: Error | null
  // selectFile(file: File): void
  // confirmUpload(metadata?: Partial<EvidenceRecord>): Promise<void>
  // reset(): void
}
```

#### CREATE `apps/web/src/components/evidence/UploadZone.tsx`
- Drag-and-drop area
- Click-to-browse fallback
- Shows selected file name and size
- Shows computed SHA-256 hash once computed
- Props: `onFile: (file: File) => void`, `loading: boolean`

#### MODIFY `apps/web/src/components/evidence/EvidenceList.tsx`
- Add "Upload Evidence" CTA button linking to `/evidence/upload`

#### MODIFY `apps/web/src/hooks/useEvidence.ts`
- Connect the encryption flow (encrypt if user opts in)
- After successful `addFile`, add the new record to local `records` state without requiring a full reload

### Dependencies
- Phase 1 (complete shared package with factory + store)
- Phase 2 (dashboard page exists for post-upload redirect)

### Deliverables
- User can drag a file onto the upload zone
- SHA-256 hash appears within 1 second for typical files
- Clicking "Create Evidence Record" stores the record in IndexedDB
- User is redirected to the dashboard and can see the new record in the list

### Acceptance Criteria
- Upload a file, note the hash displayed
- Refresh the page, navigate to `/evidence`
- The record is still there with the correct hash
- IndexedDB in DevTools shows the record with all expected fields

---

## Phase 4 — Verification Workflow

### Objective
Implement the core value proposition of Chronicle: the ability to prove a file has not been tampered with since it was timestamped. A user selects an existing evidence record, uploads a comparison file, and receives a clear pass/fail verification result.

### Features
- Verification page at `/evidence/[id]/verify`
- Record detail page at `/evidence/[id]`
- File selection for comparison
- Real-time hash comparison
- Clear pass/fail result with hash comparison displayed
- Update the evidence record's status field after verification
- Verification history (show `verifiedAt` timestamp)

### Files — Create or Modify

#### CREATE `apps/web/src/app/evidence/[id]/page.tsx`
- Detail view for a single evidence record
- Shows all metadata: filename, full hash, creation date, encryption status, verification status
- "Verify this file" button linking to `/evidence/[id]/verify`

#### CREATE `apps/web/src/app/evidence/[id]/verify/page.tsx`
- Verification workflow page
- Uses `useVerify` hook
- Shows original record details alongside comparison results

#### CREATE `apps/web/src/hooks/useVerify.ts`
```ts
export function useVerify(recordId: string) {
  // record: EvidenceRecord | null
  // result: VerificationResult | null
  // loading: boolean
  // error: Error | null
  // verifyAgainst(file: File): Promise<void>
}
```

#### CREATE `apps/web/src/components/evidence/VerifyPanel.tsx`
- Two-column layout: original record hash vs computed hash of uploaded file
- Visual diff highlighting for hash comparison
- Clear VERIFIED / TAMPERED result banner

#### CREATE `apps/web/src/components/evidence/EvidenceDetail.tsx`
- Full-detail view of a single record
- Props: `record: EvidenceRecord`

#### MODIFY `packages/shared/src/evidence/verify.ts`
- Ensure `verifyFile()` returns `VerificationResult` with `verifiedAt` timestamp
- Ensure `updateEvidence()` in store is called to persist verification status

### Dependencies
- Phase 1, Phase 2, Phase 3
- The `getEvidence(id)`, `updateEvidence()`, and `VerificationResult` type from Phase 1

### Deliverables
- User can navigate to any evidence record and click "Verify"
- Upload a comparison file → see hash computation → see VERIFIED or TAMPERED
- After verification, the dashboard badge on that record updates

### Acceptance Criteria
- Upload the same file that was timestamped → result is VERIFIED
- Upload a modified version → result is TAMPERED
- The `verifiedAt` timestamp appears on the detail page after verification

---

## Phase 5 — Encryption Metadata & Key Management

### Objective
Complete the encryption feature by adding key persistence. Currently `generateKey()` creates an ephemeral key that is lost on page reload, making encryption useless. This phase solves that by implementing key export/import and persisting encryption metadata alongside evidence records.

### Features
- Export key as JWK and store it in a separate IndexedDB store (or prompt user to download)
- Import key from stored JWK or user-uploaded key file
- `EncryptionMetadata` stored in the evidence record
- UI for opting in to encryption during upload
- UI for providing key during verification of encrypted files
- Clear UX for what encryption means and its limitations

### Files — Create or Modify

#### MODIFY `packages/shared/src/evidence/crypto.ts`
- `exportKey(key: CryptoKey): Promise<JsonWebKey>`
- `importKey(jwk: JsonWebKey): Promise<CryptoKey>`
- Ensure iv is consistently `Uint8Array`

#### CREATE `packages/shared/src/evidence/keystore.ts`
- `saveKey(id: string, jwk: JsonWebKey): Promise<void>`
- `getKey(id: string): Promise<JsonWebKey | null>`
- `deleteKey(id: string): Promise<void>`
- Uses a separate `keys` object store in IndexedDB

#### MODIFY `packages/shared/src/evidence/types.ts`
- Add `EncryptionMetadata` type (see Section 5)
- Add `encryptionMetadata?: EncryptionMetadata` to `EvidenceRecord`

#### MODIFY `apps/web/src/hooks/useUpload.ts`
- Add `encrypt: boolean` option to upload workflow
- If `encrypt`, call `generateKey()` → `encryptFile()` → `exportKey()` → `saveKey()`
- Store `EncryptionMetadata` in the record

#### MODIFY `apps/web/src/components/evidence/UploadZone.tsx`
- Add encryption toggle checkbox
- Show warning about key management implications

#### MODIFY `apps/web/src/hooks/useVerify.ts`
- If record is encrypted, prompt for key before hashing
- Call `getKey(recordId)` first, then fall back to asking user to upload key file

### Dependencies
- Phase 1 through Phase 4 complete
- Phase 3 upload workflow established

### Deliverables
- Encrypted upload stores the AES-GCM key in a separate IndexedDB store
- Page reload → key is retrieved → decryption works
- Evidence record shows encryption status

### Acceptance Criteria
- Upload an encrypted file, reload the page
- Navigate to the record, click "Verify"
- Verification succeeds using the persisted key
- A user without the key cannot verify (graceful error shown)

---

## Phase 6 — Blockchain Preparation (Architecture Hardening)

### Objective
Prepare the codebase for Sepolia testnet integration without actually connecting yet. Establish the abstractions, types, and contracts structure so that blockchain anchoring can be dropped in as an enhancement rather than a retrofit.

### Features
- `BlockchainAnchor` type in `packages/shared`
- Ethereum address field in `EvidenceRecord`
- Hardhat project skeleton in `contracts/`
- `EvidenceAnchor.sol` stub smart contract
- `useWallet` hook in `apps/web` for wallet state
- `useAnchor` hook stub (not yet functional)
- Architecture documentation written
- ADR decisions documented

### Files — Create or Modify

#### MODIFY `packages/shared/src/evidence/types.ts`
Add:
```ts
export type BlockchainAnchor = {
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  chainId: number;
  anchoredAt: number;
};
```
Add `anchor?: BlockchainAnchor` to `EvidenceRecord`.

#### CREATE `contracts/hardhat.config.ts`
Basic Hardhat 3 configuration targeting Sepolia.

#### CREATE `contracts/contracts/EvidenceAnchor.sol`
Stub contract with a single `anchor(bytes32 hash)` function and event.

#### CREATE `apps/web/src/hooks/useWallet.ts`
- Wraps wagmi's `useAccount`, `useChainId`, `useConnect`, `useDisconnect`
- Single interface for wallet state throughout the app

#### CREATE `apps/web/src/hooks/useAnchor.ts`
- Stub hook: `anchorEvidence(recordId: string): Promise<void>`
- Will call the smart contract in a future phase
- Returns `{ anchoring: boolean, error: Error | null }`

#### MODIFY `docs/architecture.md`
Write the actual architecture documentation.

#### MODIFY `docs/decisions.md`
Write the ADR log with all decisions made.

#### MODIFY `docs/roadmap.md`
Rename/replace with correct roadmap content.

### Dependencies
- Phases 1–5 complete

### Deliverables
- `contracts/` is a valid Hardhat project
- `EvidenceAnchor.sol` compiles
- `BlockchainAnchor` type is defined
- All documentation files have real content

### Acceptance Criteria
- `cd contracts && npx hardhat compile` succeeds
- `EvidenceRecord` type includes optional `anchor` field without breaking anything
- `useWallet` hook is used in the header component
- `docs/` contains real documentation

---

# 5. Evidence Domain Design

## Final Types

```ts
// packages/shared/src/evidence/types.ts

/**
 * The core domain model. Represents a single piece of timestamped evidence.
 * Designed to be serializable to/from IndexedDB and eventually JSON.
 */
export type EvidenceRecord = {
  // === Identity ===
  id: string;                         // UUID v4, generated at creation time
  version: number;                    // Schema version for future migrations (starts at 1)

  // === File Metadata ===
  fileName: string;                   // Original file name (e.g. "contract.pdf")
  fileSize: number;                   // Original file size in bytes
  mimeType: string;                   // MIME type (e.g. "application/pdf")
  description?: string;               // User-provided label or context

  // === Evidence Core ===
  hash: string;                       // SHA-256 hex digest of the ORIGINAL (pre-encryption) file
  algorithm: "SHA-256";               // Hash algorithm used — explicit for future extensibility

  // === Timestamps ===
  createdAt: number;                  // Unix timestamp (ms) of record creation
  updatedAt?: number;                 // Unix timestamp (ms) of last modification
  verifiedAt?: number;               // Unix timestamp (ms) of last successful verification

  // === Verification State ===
  status: EvidenceStatus;            // Current state of the record

  // === Encryption ===
  encrypted: boolean;
  encryptionMetadata?: EncryptionMetadata;

  // === Blockchain (Phase 6+) ===
  anchor?: BlockchainAnchor;

  // === Ownership (Phase 6+) ===
  ownerAddress?: string;             // Ethereum address of the submitter (optional)
};

export type EvidenceStatus = "pending" | "verified" | "tampered" | "unknown";

/**
 * Stores cryptographic metadata required to decrypt an encrypted evidence file.
 * The actual key is stored separately in the keystore, referenced by the record ID.
 */
export type EncryptionMetadata = {
  algorithm: "AES-GCM";              // Encryption algorithm
  keyLength: 256;                     // Key length in bits
  iv: number[];                       // Initialization vector (12 bytes as number array for IndexedDB serialization)
  keyId: string;                      // Reference to the key in the separate keystore (= record id for simplicity)
};

/**
 * The result of a verification operation.
 */
export type VerificationResult = {
  recordId: string;                   // Which record was verified
  originalHash: string;               // The stored reference hash
  computedHash: string;               // The hash of the file presented for verification
  matched: boolean;                   // True if hashes are equal
  verifiedAt: number;                 // Unix timestamp (ms)
  status: "verified" | "tampered";
};

/**
 * Blockchain anchoring metadata.
 * Added to a record after a blockchain transaction is confirmed.
 * IPFS-compatible: the same hash anchored on-chain can reference an IPFS CID.
 */
export type BlockchainAnchor = {
  transactionHash: string;            // Ethereum tx hash
  blockNumber: number;                // Block number for confirmation depth
  contractAddress: string;            // Address of EvidenceAnchor.sol
  chainId: number;                    // Chain ID (e.g. 11155111 for Sepolia)
  anchoredAt: number;                 // Unix timestamp (ms) when tx was confirmed
};
```

## Responsibilities

| Type | Owner | Purpose |
|---|---|---|
| `EvidenceRecord` | `packages/shared` | Core domain model. Serialized to IndexedDB. |
| `EncryptionMetadata` | `packages/shared` | Crypto parameters needed to decrypt. Key itself is in keystore. |
| `VerificationResult` | `packages/shared` | Return value of `verifyFile()`. Not persisted directly; updates the record's status. |
| `BlockchainAnchor` | `packages/shared` | Transaction receipt after on-chain anchoring. |

## Future Compatibility

### IPFS
The `hash` field (SHA-256 hex) maps cleanly to IPFS CID v1 (multihash format). When IPFS integration is added, the same hash can be used to pin a file and generate a CID. The `EvidenceRecord` would gain a `cid?: string` field in a future version. No current fields need to change.

### Blockchain Anchoring
The `anchor?: BlockchainAnchor` field is optional and already typed. The smart contract will store `bytes32` hashes, which map directly to the 32-byte SHA-256 digest. The flow will be:
1. Hash the file → get `hash: string` (hex)
2. Convert to `bytes32` → call `EvidenceAnchor.anchor(bytes32)`
3. Wait for transaction confirmation → store `BlockchainAnchor` in the record

No changes to existing types required.

### Smart Contracts
`EvidenceAnchor.sol` will emit an `EvidenceAnchored(bytes32 hash, address submitter, uint256 timestamp)` event. This is queryable on-chain, making evidence anchoring publicly verifiable without needing the Chronicle app itself. The `ownerAddress` field on `EvidenceRecord` will match the `submitter` in the event.

---

# 6. Frontend Architecture

## Component Hierarchy

```
<RootLayout>
  <Providers>                          # Wagmi + QueryClient + RainbowKit
    <Header>                           # App name, nav links, ConnectWalletButton
    <main>
      <EvidenceDashboardPage>          # /evidence
        <EvidenceList>
          <EvidenceCard />             # × N
          <EmptyState />               # when records.length === 0
      <UploadPage>                     # /evidence/upload
        <UploadZone />
        <UploadForm />
      <EvidenceDetailPage>             # /evidence/[id]
        <EvidenceDetail />
        <EvidenceStatus />
      <VerifyPage>                     # /evidence/[id]/verify
        <VerifyPanel />
          <UploadZone />               # reused for comparison file
```

## State Flow

```
IndexedDB (source of truth)
    ↑ write           ↓ read
useEvidence / useEvidenceStore (hooks)
    ↑ dispatch        ↓ state
React components (render)
    ↑ user action     ↓ re-render trigger
```

State is **not** global (no Redux, no Context needed at this scale). Each page's hook owns its local state. `useEvidenceStore` is the closest thing to a shared store — it fetches from IndexedDB and returns `records[]`.

## Responsibilities by Layer

### `apps/web/src/app/` — Pages (Route Handlers)
- Define routes
- Compose hooks with components
- Handle route-level concerns (page titles, metadata, redirects)
- Should be thin — minimal logic lives here

### `apps/web/src/hooks/` — Workflow Hooks
- Orchestrate sequences of operations across `@chronicle/shared` functions
- Manage async state (`loading`, `error`)
- Are the only place that imports from `@chronicle/shared`
- **Never** contain cryptographic logic — always delegate to shared package

### `apps/web/src/components/` — UI Components
- Receive props, render UI
- Call callbacks passed in as props
- Do not import from `@chronicle/shared` directly
- `components/ui/` — purely presentational, no domain knowledge
- `components/evidence/` — domain-aware but logic-free

### `apps/web/src/lib/web3/` — Web3 Infrastructure
- Wagmi config, provider tree, chain definitions
- Isolated from evidence logic completely

## Where Logic Belongs

| Question | Answer |
|---|---|
| Where does upload logic live? | `useUpload.ts` (hook) calls `hashFile()`, `encryptFile()`, `createEvidenceRecord()`, `saveEvidence()` from shared package |
| Where does verification logic live? | `useVerify.ts` (hook) calls `getEvidence()`, `hashFile()`, `verifyFile()` from shared package |
| Where does persistence logic live? | `packages/shared/src/evidence/store.ts` (IndexedDB) called by hooks |
| Where does hash computation live? | `packages/shared/src/evidence/hash.ts` only |
| Where does encryption live? | `packages/shared/src/evidence/crypto.ts` only |

---

# 7. Data Flow Diagrams

## Upload Evidence Flow

```
User drags file onto UploadZone
         │
         ▼
UploadZone calls onFile(file: File)
         │
         ▼
useUpload.selectFile(file)
    └── [state: status = 'hashing']
         │
         ▼
packages/shared: hashFile(file) → hash: string
    └── [state: hash = hash, status = 'confirming']
         │
         ▼
User reviews hash, fills optional description, clicks "Create Record"
         │
         ▼
useUpload.confirmUpload(metadata)
    └── [state: status = 'saving']
         │
         ├── [if encrypt=true]
         │       generateKey() → CryptoKey
         │       encryptFile(file, key) → { iv, encrypted: Blob }
         │       exportKey(key) → JsonWebKey
         │       saveKey(record.id, jwk)
         │       [build EncryptionMetadata]
         │
         ▼
createEvidenceRecord(file, hash, metadata)
         │
         ▼
saveEvidence(record) → IndexedDB
    └── [state: status = 'success', record = record]
         │
         ▼
UI shows success → redirects to /evidence
         │
         ▼
EvidenceDashboard fetches getAllEvidence() → shows new record
```

## Verify Evidence Flow

```
User navigates to /evidence/[id]/verify
         │
         ▼
useVerify(recordId).mount()
    └── getEvidence(recordId) → EvidenceRecord
    └── [state: record = record]
         │
         ▼
User sees original record details (filename, hash, creation date)
User drags comparison file onto UploadZone
         │
         ▼
useVerify.verifyAgainst(comparisonFile)
    └── [state: loading = true]
         │
         ▼
packages/shared: hashFile(comparisonFile) → computedHash: string
         │
         ▼
packages/shared: verifyFile(comparisonFile, record.hash)
    → VerificationResult { matched, originalHash, computedHash, verifiedAt }
         │
         ▼
[if matched] updateEvidence({ ...record, status: 'verified', verifiedAt })
[if !matched] updateEvidence({ ...record, status: 'tampered', verifiedAt })
         │
         ▼
[state: result = VerificationResult, loading = false]
         │
         ▼
VerifyPanel renders:
  - Original hash (from record)
  - Computed hash (from comparison file)
  - VERIFIED (green) or TAMPERED (red) banner
```

## Future Blockchain Anchoring Flow

```
User clicks "Anchor on Blockchain" on a verified record
         │
         ▼
useAnchor.anchorEvidence(recordId)
    └── getEvidence(recordId) → record
    └── Convert record.hash (hex string) to bytes32
         │
         ▼
wagmi: writeContract({
  address: CONTRACT_ADDRESS,
  abi: EvidenceAnchorABI,
  functionName: 'anchor',
  args: [bytes32Hash],
})
         │
         ▼
Wait for transaction confirmation
    └── waitForTransactionReceipt(txHash)
         │
         ▼
Build BlockchainAnchor {
  transactionHash,
  blockNumber,
  contractAddress,
  chainId,
  anchoredAt: Date.now(),
}
         │
         ▼
updateEvidence({ ...record, anchor: blockchainAnchor })
         │
         ▼
UI shows: "Anchored on Sepolia at block #XXXXXX"
    └── Link to Etherscan tx
```

---

# 8. Refactoring Recommendations

## High Priority

### H1 — Fix `.gitignore` immediately
**Risk:** `node_modules`, `.next`, `.env.local`, `.turbo` committed to git. `.env.local` contains the WalletConnect Project ID. This is a security issue.

**Action:** Create a proper root `.gitignore` before the next commit.

### H2 — Remove `any` from `store.ts`
**Risk:** Type safety is completely absent in the storage layer. A wrongly-shaped object persisted to IndexedDB will cause silent data corruption.

**Action:** Type `saveEvidence(record: EvidenceRecord)` and `getAllEvidence(): Promise<EvidenceRecord[]>`.

### H3 — Add key persistence (`exportKey`/`importKey`)
**Risk:** The encryption feature is architecturally broken. If a user encrypts a file and reloads, the key is gone and the file is permanently unrecoverable.

**Action:** Implement `keystore.ts` in Phase 5. Do not expose the encryption toggle in the UI until key persistence is complete.

### H4 — Remove duplicate wallet component
**Action:** Delete `src/components/WalletConnect.tsx`. Update any imports to use `ConnectWalletButton` from the wallet subdirectory.

### H5 — Remove dead import from `page.tsx`
**Action:** Remove the `import WalletConnect from "@/components/WalletConnect"` from `page.tsx` (it's imported but not rendered).

## Medium Priority

### M1 — Rename component files to PascalCase
**Files:**
- `connectWallet_Button.tsx` → `ConnectWalletButton.tsx`
- `walletInfo.tsx` → `WalletInfo.tsx`

**Reason:** React convention. Broken naming causes confusion and may affect some auto-import tools.

### M2 — Fix font override in `globals.css`
**Action:** Change `font-family: Arial, Helvetica, sans-serif` to `font-family: var(--font-geist-sans), sans-serif`.

### M3 — Add `@chronicle/shared` path alias to `apps/web/tsconfig.json`
**Action:** Add `"@chronicle/shared": ["../../packages/shared/src"]` to the paths in `apps/web/tsconfig.json`. This ensures the TypeScript language server resolves the import without relying solely on yarn workspace resolution.

### M4 — Add error state to `useEvidence`
**Action:** Add `error: Error | null` state and a `catch` block so upload errors surface to the user rather than being swallowed.

### M5 — Fix the `roadmap.md` / `decisions.md` filename confusion
**Action:** Move the current content of `docs/roadmap.md` into `docs/decisions.md`. Write actual roadmap content in `docs/roadmap.md`.

### M6 — Cache the IndexedDB connection
**Action:** In `store.ts`, store the resolved `IDBDatabase` in a module-level variable and reuse it instead of calling `indexedDB.open()` on every operation.

### M7 — Add `fileSize` and `mimeType` to `EvidenceRecord`
**Action:** These fields are available from `File` at upload time. Losing them is unnecessary. Add them to the type and factory function.

## Low Priority

### L1 — Delete the empty `src/lib/web3/hooks/` directory
Unused empty directories add confusion. Remove it.

### L2 — Fix line endings consistency
`.editorconfig` declares LF but `packages/shared` uses CRLF. Either update `.gitattributes` to normalize on checkout or fix the files.

### L3 — Remove `package-lock.json` from the repo root
The project uses Yarn. `package-lock.json` is an npm artifact. Having both causes confusion about which lock file is authoritative. Remove it and commit `yarn.lock` only.

### L4 — Update `apps/web/package.json` `name` field
It is set to `"web"`. Should be `"@chronicle/web"` for consistency with the workspace naming convention.

### L5 — Add `description` to `packages/shared/package.json`
Currently has only `name`, `version`, `private`, `main`, `types`. Add `"description": "Chronicle shared business logic — hashing, encryption, storage, and verification"`.

### L6 — Set up Vitest for `packages/shared`
Add Vitest as a dev dependency in `packages/shared`. The business logic is pure and testable. Add at minimum: a test for `hashFile()`, a test for `encryptFile()` + `decryptFile()` round-trip, and a test for `verifyFile()`.

---

# 9. Build Order Checklist

```
Phase 0 — Housekeeping (Do This First, Takes 20 Minutes)
[ ] Create a proper root .gitignore (node_modules, .next, .env*, .turbo, dist, *.key)
[ ] Delete package-lock.json (project uses yarn)
[ ] Fix line endings: update shared package files to LF or configure .gitattributes
[ ] Fix apps/web/src/app/globals.css: body font → var(--font-geist-sans)
[ ] Update layout.tsx metadata: title = "Chronicle", description = accurate
[ ] Remove dead import from page.tsx (WalletConnect)
[ ] Delete src/components/WalletConnect.tsx
[ ] Delete src/lib/web3/hooks/ (empty directory)
[ ] Rename connectWallet_Button.tsx → ConnectWalletButton.tsx (update import in page.tsx)
[ ] Rename walletInfo.tsx → WalletInfo.tsx (update import in page.tsx)
[ ] Fix docs/decisions.md: copy content from roadmap.md into it
[ ] Fix docs/roadmap.md: write the actual phase roadmap here

Phase 1 — Evidence Record System (packages/shared)
[ ] Expand types.ts: EvidenceRecord (full), EvidenceStatus, EncryptionMetadata, VerificationResult, BlockchainAnchor
[ ] Create factory.ts: createEvidenceRecord(file, hash, options?) → EvidenceRecord
[ ] Update hash.ts: add hashBuffer(), add hashBlob(), refactor hashFile() to use hashBuffer()
[ ] Update hash.ts: add try/catch with typed error throws
[ ] Update crypto.ts: add exportKey(key) → Promise<JsonWebKey>
[ ] Update crypto.ts: add importKey(jwk) → Promise<CryptoKey>
[ ] Update crypto.ts: fix iv type to be consistently Uint8Array internally, number[] for serialization
[ ] Update crypto.ts: add explicit return types to all functions
[ ] Update store.ts: replace saveEvidence(data: any) with saveEvidence(record: EvidenceRecord): Promise<void>
[ ] Update store.ts: type getAllEvidence() → Promise<EvidenceRecord[]>
[ ] Update store.ts: add getEvidence(id: string): Promise<EvidenceRecord | null>
[ ] Update store.ts: add deleteEvidence(id: string): Promise<void>
[ ] Update store.ts: add updateEvidence(record: EvidenceRecord): Promise<void>
[ ] Update store.ts: cache the IDBDatabase connection at module level
[ ] Update verify.ts: return VerificationResult instead of boolean
[ ] Update verify.ts: add verifyHash(hash1, hash2) → VerificationResult
[ ] Update index.ts: organize exports with section comments
[ ] Add @chronicle/shared path alias to apps/web/tsconfig.json
[ ] Verify: TypeScript compiles in packages/shared with strict: true, zero errors

Phase 2 — Evidence Dashboard
[ ] Create apps/web/src/app/evidence/page.tsx (dashboard route)
[ ] Create apps/web/src/hooks/useEvidenceStore.ts (loads records on mount)
[ ] Update apps/web/src/hooks/useEvidence.ts: add error state, records state, loadRecords(), deleteRecord()
[ ] Create apps/web/src/components/evidence/EvidenceCard.tsx
[ ] Create apps/web/src/components/evidence/EvidenceList.tsx (includes empty state)
[ ] Create apps/web/src/components/evidence/EvidenceStatus.tsx
[ ] Create apps/web/src/components/ui/EmptyState.tsx
[ ] Create apps/web/src/components/ui/LoadingSpinner.tsx
[ ] Create apps/web/src/components/ui/Button.tsx
[ ] Create apps/web/src/components/ui/Card.tsx
[ ] Update apps/web/src/app/page.tsx: add link/redirect to /evidence
[ ] Add a basic Header component with app name and nav
[ ] Verify: /evidence route renders, shows loading spinner, then empty state

Phase 3 — Upload Workflow
[ ] Create apps/web/src/hooks/useUpload.ts (state machine: idle → hashing → confirming → saving → success)
[ ] Create apps/web/src/app/evidence/upload/page.tsx
[ ] Create apps/web/src/components/evidence/UploadZone.tsx (drag-and-drop)
[ ] Add "Upload Evidence" button to EvidenceList (links to /evidence/upload)
[ ] Connect useUpload to createEvidenceRecord() from shared package
[ ] After successful upload, redirect to /evidence
[ ] Verify: upload a file → hash shown → submit → record appears on dashboard

Phase 4 — Verification Workflow
[ ] Create apps/web/src/app/evidence/[id]/page.tsx (detail page)
[ ] Create apps/web/src/app/evidence/[id]/verify/page.tsx (verify page)
[ ] Create apps/web/src/hooks/useVerify.ts
[ ] Create apps/web/src/components/evidence/VerifyPanel.tsx
[ ] Create apps/web/src/components/evidence/EvidenceDetail.tsx
[ ] Connect verification result to updateEvidence() to persist status
[ ] Verify: upload file → verify same file → VERIFIED
[ ] Verify: upload file → verify different file → TAMPERED
[ ] Verify: status badge on dashboard updates after verification

Phase 5 — Encryption & Key Management
[ ] Create packages/shared/src/evidence/keystore.ts (IDB key store)
[ ] Update packages/shared/src/evidence/types.ts: add EncryptionMetadata to EvidenceRecord
[ ] Update packages/shared/src/index.ts: export keystore functions
[ ] Add encryption toggle to UploadZone component
[ ] Update useUpload.ts: add encryption path (generateKey → encryptFile → exportKey → saveKey)
[ ] Update useVerify.ts: if encrypted, retrieve key from keystore before verifying
[ ] Verify: encrypt a file → reload page → verify same file → VERIFIED (key was persisted)

Phase 6 — Blockchain Preparation
[ ] Create contracts/ as a Hardhat 3 project (npx hardhat init)
[ ] Create contracts/contracts/EvidenceAnchor.sol
[ ] Verify: npx hardhat compile succeeds
[ ] Add BlockchainAnchor to EvidenceRecord in types.ts
[ ] Add ownerAddress to EvidenceRecord
[ ] Create apps/web/src/hooks/useWallet.ts (wraps wagmi hooks)
[ ] Create apps/web/src/hooks/useAnchor.ts (stub)
[ ] Update Header to use useWallet hook
[ ] Fix docs/architecture.md: write system design overview
[ ] Fix docs/decisions.md: write all ADRs
```

---

# 10. Final Verdict

## Current Maturity Level

**2 out of 10.** Chronicle is a monorepo skeleton with isolated primitive implementations, not a working application. The infrastructure decisions are correct (Turborepo, Yarn, Next.js App Router, Web Crypto API, IndexedDB). The cryptographic primitives are implemented correctly. But nothing is connected to anything. A user opening the app today sees a wallet connect button and an address display. They cannot upload a file, cannot see evidence, cannot verify anything.

## Biggest Risks

1. **Key loss.** The encryption feature generates ephemeral keys. If anyone uses it today, their encrypted files are permanently unrecoverable after a page reload. Do not expose encryption in the UI until key persistence is built.

2. **Empty `.gitignore`.** The WalletConnect Project ID is in `.env.local`. If this is committed (which it will be since `.gitignore` is empty), it is exposed. Fix immediately.

3. **No tests.** The business logic in `packages/shared` is pure, async, and completely testable, yet has zero tests. Any refactoring is done blind. Establish Vitest before writing more code.

4. **The hook-to-UI connection is missing.** `useEvidence` exists and works conceptually, but nothing in the UI calls it. The entire product path — upload → hash → store → display — is implemented in scattered pieces that are never assembled.

## Strongest Design Choices

1. **Monorepo separation is correct and should be preserved.** Putting crypto logic in `packages/shared` means it can eventually be tested independently, published separately, or reused in a CLI tool.
2. **Web Crypto API.** No third-party crypto libraries. Browser-native, audited, correct.
3. **IndexedDB for Phase 1.** No backend required. Progressive enhancement path to IPFS is clean.
4. **Wagmi + RainbowKit.** Industry-standard web3 stack. The provider setup is correct.
5. **The `docs/roadmap.md` decision log.** Intentional design decisions are captured (even if in the wrong file). Hybrid ownership model and wallet-only auth are thoughtful choices for a learning blockchain project.

## Recommended Next Action

**Execute Phase 0 immediately.** It takes 20 minutes and eliminates the most embarrassing technical debt (secrets in git, duplicate files, dead imports). Then execute Phase 1 completely before touching any frontend code. The shared package is the foundation — building the dashboard on a shaky foundation means reworking everything twice.

**Do not start Phase 2 until Phase 1 TypeScript compiles cleanly with zero errors.**

The development sequence is non-negotiable: types first, then storage, then upload, then verification, then encryption, then blockchain. Each phase is a precondition for the next.

Chronicle has a solid conceptual foundation and a correct technology selection. The gap between "correct primitives" and "working product" is significant but completely bridgeable with disciplined, sequential execution of this roadmap.
