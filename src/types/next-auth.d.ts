import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      workerId: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
    workerId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
    workerId: string;
    uid: string;
  }
}
