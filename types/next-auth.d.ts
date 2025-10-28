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
      roleId?: string | null;
      roleName?: string | null;
      roleLevel?: number;
      permissions?: string[];
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    username?: string | null;
    bio?: string | null;
    image?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    permissions?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string | null;
    bio?: string | null;
    image?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    roleLevel?: number;
    permissions?: string[];
  }
}
