import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const account = await db.userAccount.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { worker: true }
        });
        if (!account || !account.active) return null;

        const valid = await bcrypt.compare(credentials.password, account.passwordHash);
        if (!valid) return null;

        return {
          id: account.id,
          email: account.email,
          name: account.worker.name,
          role: account.role,
          workerId: account.workerId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.workerId = (user as any).workerId;
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).workerId = token.workerId;
        (session.user as any).id = token.uid;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
