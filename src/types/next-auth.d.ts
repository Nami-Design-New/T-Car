import type { DefaultSession } from 'next-auth';
import type { AuthUser } from '@/features/auth/model';

declare module 'next-auth' {
  interface User {
    phone: string;
    /** Backend token; copied into the JWT and never into the session. */
    accessToken: string;
  }

  interface Session {
    user: AuthUser & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    user?: AuthUser;
  }
}
