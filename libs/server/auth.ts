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
import { generateAccessToken } from './utils';

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
        token2FA: { label: '2FA Token', type: 'text' },
        backupCode: { label: 'Backup Code', type: 'text' },
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
              backupCodes: {
                where: { used: false },
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

          // ============================================
          // 2FA VERIFICATION
          // ============================================
          if (user.twoFactorEnabled && user.twoFactorSecret) {
            const token2FA = credentials.token2FA as string | undefined;
            const backupCode = credentials.backupCode as string | undefined;

            // Must provide either 2FA token or backup code
            if (
              (!token2FA || token2FA === 'undefined' || token2FA === '') &&
              (!backupCode || backupCode === 'undefined' || backupCode === '')
            ) {
              console.error('[Auth] 2FA required but not provided');
              throw new Error('2FA_REQUIRED');
            }

            let is2FAValid = false;

            // Try backup code first (if provided)
            if (backupCode && user.backupCodes.length > 0) {
              for (const storedCode of user.backupCodes) {
                const isValidBackup = await bcrypt.compare(
                  backupCode,
                  storedCode.code,
                );

                if (isValidBackup) {
                  // Mark backup code as used
                  await prisma.backupCode.update({
                    where: { id: storedCode.id },
                    data: {
                      used: true,
                      usedAt: new Date(),
                    },
                  });

                  is2FAValid = true;

                  // Log backup code usage
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 180);

                  await prisma.activityLog
                    .create({
                      data: {
                        userId: user.id,
                        action: 'BACKUP_CODE_USED',
                        entity: 'auth',
                        metadata: {
                          backupCodeId: storedCode.id,
                        },
                        importance: 'WARNING',
                        retentionDays: 180,
                        expiresAt,
                      },
                    })
                    .catch(() => {});

                  break;
                }
              }
            }

            // Try TOTP token (if backup code failed or not provided)
            if (!is2FAValid && token2FA) {
              try {
                // Dynamic import to avoid loading if not needed
                const { decryptSecret, verify2FAToken } = await import('./2fa');

                const encryptionKey = process.env.ENCRYPTION_KEY;
                if (!encryptionKey) {
                  console.error('[Auth] ENCRYPTION_KEY not configured');
                  throw new Error('2FA_CONFIG_ERROR');
                }

                const secret = decryptSecret(
                  user.twoFactorSecret,
                  encryptionKey,
                );
                is2FAValid = verify2FAToken(token2FA, secret);

                if (is2FAValid) {
                  console.log('[Auth] 2FA token verified successfully');
                }
              } catch (error) {
                console.error('[Auth] 2FA verification error:', error);
                throw new Error('2FA_VERIFICATION_ERROR');
              }
            }

            // If both failed, reject login
            if (!is2FAValid) {
              console.error('[Auth] Invalid 2FA code');
              throw new Error('INVALID_2FA');
            }
          }

          // Update last login
          await prisma.user
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => {});

          // Return user object with all necessary fields
          return {
            id: user.id,
            email: user.email!,
            name: user.name || '',
            username: user.username || '',
            bio: user.bio || undefined,
            location: user.location || undefined,
            website: user.website || undefined,
            twitter: user.twitter || undefined,
            github: user.github || undefined,
            linkedin: user.linkedin || undefined,
            image: user.image || undefined,
            roleId: user.roleId,
            roleName: user.role?.name,
            permissions:
              user.role?.permissions.map(rp => rp.permission.name) || [],
            securityStamp: user.securityStamp,
            twoFactorEnabled: user.twoFactorEnabled,
            hasPassword: true, // Credentials login always has password
            rememberMe: credentials.rememberMe === 'true',
          } as any;
        } catch (error: any) {
          // Re-throw specific errors for handling in signIn callback
          if (
            [
              'BANNED',
              'SUSPENDED',
              'UNVERIFIED',
              '2FA_REQUIRED',
              'INVALID_2FA',
              '2FA_CONFIG_ERROR',
              '2FA_VERIFICATION_ERROR',
            ].includes(error.message)
          ) {
            throw error;
          }
          console.error('[Auth] Authorize error:', error);
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
                  twoFactorUsed: (user as any).twoFactorEnabled || false,
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
        if (error.message === '2FA_REQUIRED') {
          return '/login?error=2fa_required';
        }
        if (error.message === 'INVALID_2FA') {
          return '/login?error=invalid_2fa';
        }
        if (
          error.message === '2FA_CONFIG_ERROR' ||
          error.message === '2FA_VERIFICATION_ERROR'
        ) {
          return '/login?error=2fa_error';
        }
        console.error('SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session, account }) {
      console.log('[JWT Callback] Trigger:', trigger);
      // Initial sign in
      if (user) {
        token.id = user.id!;
        token.securityStamp = (user as any).securityStamp;
        token.username = (user as any).username || '';
        token.bio = (user as any).bio || null;
        token.location = (user as any).location || null;
        token.website = (user as any).website || null;
        token.twitter = (user as any).twitter || null;
        token.github = (user as any).github || null;
        token.linkedin = (user as any).linkedin || null;
        token.image = user.image || null;
        token.roleId = (user as any).roleId || null;
        token.rememberMe = (user as any).rememberMe || false;
        token.twoFactorEnabled = (user as any).twoFactorEnabled || false;

        // Set hasPassword based on login method
        if (account?.provider === 'credentials') {
          // Credentials login always has password
          token.hasPassword = true;
        } else if (account?.provider && account.provider !== 'credentials') {
          // OAuth login - check if user has password in database
          const userWithPassword = await prisma.user.findUnique({
            where: { id: user.id! },
            select: { password: true },
          });
          token.hasPassword = !!userWithPassword?.password;
        } else {
          // Fallback - check user object
          token.hasPassword = (user as any).hasPassword || false;
        }

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

      // ============================================
      // SECURITY VALIDATION - Check on every request
      // ============================================
      if (token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            securityStamp: true,
            status: true,
            twoFactorEnabled: true,
            password: true, // Check password status
          },
        });

        // User not found - invalidate session
        if (!currentUser) {
          console.error('[Auth] User not found during JWT validation');
          throw new Error('SESSION_INVALIDATED');
        }

        // Security stamp changed - force re-login
        if (currentUser.securityStamp !== token.securityStamp) {
          console.error('[Auth] Security stamp mismatch - session invalidated');
          throw new Error('SESSION_INVALIDATED');
        }

        // User banned or suspended - force re-login
        if (
          currentUser.status === 'BANNED' ||
          currentUser.status === 'SUSPENDED'
        ) {
          console.error(
            '[Auth] User status changed to',
            currentUser.status,
            '- session invalidated',
          );
          throw new Error('SESSION_INVALIDATED');
        }

        // Update 2FA status in token if changed
        if (currentUser.twoFactorEnabled !== token.twoFactorEnabled) {
          token.twoFactorEnabled = currentUser.twoFactorEnabled;
        }

        // Update hasPassword status if changed (e.g., user added/removed password)
        const hasPassword = !!currentUser.password;
        if (hasPassword !== token.hasPassword) {
          token.hasPassword = hasPassword;
        }
      }

      // Session update from client
      if (trigger === 'update' && session) {
        console.log('[JWT Callback] Update triggered with session:', session);
        if (session.username !== undefined) token.username = session.username;
        if (session.bio !== undefined) token.bio = session.bio || null;
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.image = session.image || null;
        if (session.location !== undefined)
          token.location = session.location || null;
        if (session.website !== undefined)
          token.website = session.website || null;
        if (session.twitter !== undefined)
          token.twitter = session.twitter || null;
        if (session.github !== undefined) token.github = session.github || null;
        if (session.linkedin !== undefined)
          token.linkedin = session.linkedin || null;

        // If role changed, refresh permissions
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
            // Update security stamp to reflect latest state
            token.securityStamp = userWithRole.securityStamp;
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
        session.user.twoFactorEnabled =
          (token.twoFactorEnabled as boolean) || false;
        session.user.hasPassword = (token.hasPassword as boolean) || false;
        session.user.location = (token.location as string) || undefined;
        session.user.website = (token.website as string) || undefined;
        session.user.twitter = (token.twitter as string) || undefined;
        session.user.github = (token.github as string) || undefined;
        session.user.linkedin = (token.linkedin as string) || undefined;
        session.user.accessToken = generateAccessToken(token.id as string);
      }

      // Don't override session.expires - let NextAuth handle it
      // The token.exp we set in jwt() callback will automatically be used

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle error redirects
      if (url.includes('error=')) {
        return url;
      }

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

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await auth();
  return session?.user?.permissions?.includes(permission) || false;
}

/**
 * Check if user has minimum role level
 */
export async function hasMinimumRoleLevel(level: number): Promise<boolean> {
  const session = await auth();
  return (session?.user?.roleLevel || 0) >= level;
}

/**
 * Require specific permission or throw error
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (!session.user.permissions?.includes(permission)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
