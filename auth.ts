import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import prisma from '@/app/lib/prisma';

async function getUser(email: string): Promise<User | null> {
  try {
    // const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    const user = await prisma.users.findUnique({
      where: { email },
    });
    console.log('User:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      // @ts-ignore
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        console.log('Parsed credentials:', parsedCredentials.success);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = password === user.password; // await bcrypt.compare(password, user.password);
          console.log(password, user.password);
          console.log('Passwords match:', passwordsMatch);

          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
