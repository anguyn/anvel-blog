import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      username?: string | null;
      bio?: string | null;
      location?: string | null;
      website?: string | null;
      twitter?: string | null;
      github?: string | null;
      linkedin?: string | null;
      roleId?: string | null;
      roleName?: string | null;
      roleLevel?: number;
      permissions?: string[];
      twoFactorEnabled: boolean;
      hasPassword: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    username?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    twitter?: string | null;
    github?: string | null;
    linkedin?: string | null;
    image?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    permissions?: string[];
    securityStamp?: string;
    twoFactorEnabled?: boolean;
    rememberMe?: boolean;
    hasPassword?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    twitter?: string | null;
    github?: string | null;
    linkedin?: string | null;
    image?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    roleLevel?: number;
    permissions?: string[];
    securityStamp: string;
    twoFactorEnabled: boolean;
    rememberMe: boolean;
    hasPassword: boolean;
  }
}
