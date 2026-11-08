import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// A feature index that re-exports its Server Actions (e.g. `features/orders`)
// reaches `@/auth` (NextAuth, which Node cannot load here) and `server-only`
// from any UI test that imports the index. A test that checks auth still
// declares its own `vi.mock('@/auth', ...)`, which replaces this one.
vi.mock('@/auth', () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
  signInWithGrant: vi.fn(),
  updateSessionProfile: vi.fn(),
}));
vi.mock('server-only', () => ({}));

afterEach(() => {
  cleanup();
});
