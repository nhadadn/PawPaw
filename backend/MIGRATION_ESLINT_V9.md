# ESLint v9 Migration Guide

## Overview
We have upgraded ESLint from v8 to v9.39.2 to address a high-severity security vulnerability (GHSA-p5wg-g6qr-c7cg). This upgrade introduces the new "Flat Config" system.

## Changes Made
1. **Dependencies Upgraded:**
   - `eslint`: ^8.56.0 -> ^9.39.2
   - `typescript-eslint`: ^8.18.0 (replaced old `@typescript-eslint/*` packages)
   - `@eslint/js`: ^9.39.1 (new dependency for recommended JS rules)
   - `globals`: ^15.14.0 (for defining environment globals like `node`, `jest`)

2. **Configuration:**
   - Removed `.eslintrc.json` (legacy config).
   - Created `eslint.config.mjs` (flat config).
   - Updated `package.json` lint script: `eslint .` (removed `--ext` flag which is deprecated).

3. **Code Adjustments:**
   - Updated test files to include `videoUrl: null` in mock data to satisfy strict type checking with updated Prisma models.
   - Updated lint rules in `eslint.config.mjs` to match previous project conventions (e.g., ignoring unused variables starting with `_`).

## Verification
- **Linting:** Run `npm run lint`. Expect exit code 0 (warnings are allowed).
- **Tests:** Run `npm test`. Expect all tests to pass.

## Rollback Procedure
If critical issues arise with the new ESLint setup, follow these steps to revert to v8:

1. **Restore Dependencies:**
   ```bash
   npm uninstall eslint typescript-eslint @eslint/js globals
   npm install eslint@^8.56.0 @typescript-eslint/parser@^6.21.0 @typescript-eslint/eslint-plugin@^6.21.0 --save-dev
   ```

2. **Restore Configuration:**
   - Delete `eslint.config.mjs`.
   - Restore `.eslintrc.json` from backup (`.eslintrc.json.bak`) or git history.
     ```bash
     mv .eslintrc.json.bak .eslintrc.json
     ```

3. **Restore Scripts:**
   - Edit `package.json` and change the lint script back to:
     ```json
     "lint": "eslint . --ext .ts"
     ```

4. **Verify Rollback:**
   - Run `npm run lint` to ensure legacy config works.
