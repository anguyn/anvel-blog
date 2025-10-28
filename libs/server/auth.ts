// ============================================
// libs/server/auth.ts - FIXED VERSION (No Type Errors)
// ============================================

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/libs/prisma';
import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  basePath: '/api/auth',
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days maximum
    updateAge: 24 * 60 * 60, // Refresh every 24 hours if active
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing credentials');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          if (!user || !user.password) {
            console.error('[Auth] User not found or no password');
            return null;
          }

          // Check status
          if (user.status === 'BANNED') {
            console.error('[Auth] Account is banned');
            throw new Error('BANNED');
          }

          if (user.status === 'SUSPENDED') {
            console.error('[Auth] Account is suspended');
            throw new Error('SUSPENDED');
          }

          // Check email verification
          if (
            !user.emailVerified &&
            process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
          ) {
            console.error('[Auth] Email not verified');
            throw new Error('UNVERIFIED');
          }

          // Verify password
          const isCorrectPassword = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!isCorrectPassword) {
            console.error('[Auth] Invalid password');
            return null;
          }

          // Update last login
          await prisma.user
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => {});

          // Return user object with rememberMe
          return {
            id: user.id,
            email: user.email!,
            name: user.name || '',
            username: user.username || '',
            bio: user.bio || undefined,
            image: user.image || undefined,
            roleId: user.roleId,
            roleName: user.role?.name,
            permissions:
              user.role?.permissions.map(rp => rp.permission.name) || [],
            rememberMe: credentials.rememberMe === 'true',
          } as any;
        } catch (error: any) {
          // Re-throw specific errors for handling in signIn callback
          if (
            error.message === 'BANNED' ||
            error.message === 'SUSPENDED' ||
            error.message === 'UNVERIFIED'
          ) {
            throw error;
          }
          console.error('[Auth] Authorize error');
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        // OAuth login - Link to existing account
        if (account && account?.provider !== 'credentials') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { role: true },
          });

          if (existingUser) {
            // Check status
            if (existingUser.status === 'BANNED') {
              return '/login?error=banned';
            }
            if (existingUser.status === 'SUSPENDED') {
              return '/login?error=suspended';
            }

            // Link account if not exists
            const existingAccount = await prisma.account.findFirst({
              where: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });

            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state as string | null,
                },
              });
            }

            // Update user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                emailVerified: new Date(),
                status: 'ACTIVE',
                lastLoginAt: new Date(),
              },
            });

            // Set user.id for NextAuth to use existing user
            user.id = existingUser.id;
          } else {
            // New OAuth user
            if (user.id) {
              const defaultRole = await prisma.role.findUnique({
                where: { name: 'USER' },
              });

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  roleId: defaultRole?.id,
                  emailVerified: new Date(),
                  status: 'ACTIVE',
                  lastLoginAt: new Date(),
                },
              });
            }
          }
        }

        // Log activity
        if (user.id) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await prisma.activityLog
            .create({
              data: {
                userId: user.id,
                action: 'LOGIN',
                entity: 'auth',
                metadata: {
                  provider: account?.provider || 'credentials',
                  email: user.email,
                },
                importance: 'INFO',
                retentionDays: 30,
                expiresAt,
              },
            })
            .catch(() => {});
        }

        return true;
      } catch (error: any) {
        // Handle errors from authorize
        if (error.message === 'BANNED') {
          return '/login?error=banned';
        }
        if (error.message === 'SUSPENDED') {
          return '/login?error=suspended';
        }
        if (error.message === 'UNVERIFIED') {
          const email = (user as any).email || '';
          return `/login?error=unverified&email=${encodeURIComponent(email)}`;
        }
        console.error('SignIn callback error');
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id!;
        token.username = (user as any).username || '';
        token.bio = (user as any).bio || null;
        token.image = user.image || null;
        token.roleId = (user as any).roleId || null;
        token.rememberMe = (user as any).rememberMe || false;

        if ((user as any).roleId) {
          const userWithRole = await prisma.user.findUnique({
            where: { id: user.id! },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          if (userWithRole?.role) {
            token.roleName = userWithRole.role.name;
            token.roleLevel = userWithRole.role.level;
            token.permissions = userWithRole.role.permissions.map(
              rp => rp.permission.name,
            );
          }
        } else {
          token.roleName = null;
          token.roleLevel = 0;
          token.permissions = [];
        }
      }

      // Session update
      if (trigger === 'update' && session) {
        if (session.username !== undefined) token.username = session.username;
        if (session.bio !== undefined) token.bio = session.bio || null;
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.image = session.image || null;

        if (session.roleId !== undefined) {
          const userWithRole = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          if (userWithRole?.role) {
            token.roleId = userWithRole.roleId;
            token.roleName = userWithRole.role.name;
            token.roleLevel = userWithRole.role.level;
            token.permissions = userWithRole.role.permissions.map(
              rp => rp.permission.name,
            );
          }
        }
      }

      // Set token expiry based on rememberMe
      const now = Math.floor(Date.now() / 1000);

      if (token.rememberMe) {
        // Remember Me: 7 days
        token.exp = now + 7 * 24 * 60 * 60;
      } else {
        // No Remember Me: 1 day
        token.exp = now + 24 * 60 * 60;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) || '';
        session.user.bio = (token.bio as string) || undefined;
        session.user.image = (token.image as string) || undefined;
        session.user.roleId = (token.roleId as string) || undefined;
        session.user.roleName = (token.roleName as string) || undefined;
        session.user.roleLevel = (token.roleLevel as number) || 0;
        session.user.permissions = (token.permissions as string[]) || [];
      }

      // Don't override session.expires - let NextAuth handle it
      // The token.exp we set in jwt() callback will automatically be used

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);
      }
    },

    async linkAccount({ user, account }) {
      console.log(`Account linked: ${user.email} with ${account.provider}`);
      await prisma.user
        .update({
          where: { id: user.id! },
          data: { emailVerified: new Date() },
        })
        .catch(() => {});
    },

    async signOut(data: { token?: JWT | null; session?: any }) {
      const token = data?.token;
      if (token?.id) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await prisma.activityLog
          .create({
            data: {
              userId: token.id as string,
              action: 'LOGOUT',
              entity: 'auth',
              importance: 'INFO',
              retentionDays: 30,
              expiresAt,
            },
          })
          .catch(() => {});
      }
    },

    async createUser({ user }) {
      console.log(`New user created in database: ${user.email}`);

      const defaultRole = await prisma.role
        .findUnique({
          where: { name: 'USER' },
        })
        .catch(() => null);

      if (defaultRole && user.id) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { roleId: defaultRole.id },
          })
          .catch(() => {});
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function isAuthenticated() {
  const session = await auth();
  return !!session?.user;
}
