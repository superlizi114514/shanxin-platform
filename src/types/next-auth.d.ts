import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      avatar?: string | null;
      role: string;
      studentId?: string | null;
      school?: string | null;
      major?: string | null;
      class?: string | null;
      phone?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    role: string;
    studentId?: string | null;
    school?: string | null;
    major?: string | null;
    class?: string | null;
    phone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    studentId?: string | null;
    school?: string | null;
    major?: string | null;
    class?: string | null;
    phone?: string | null;
  }
}
