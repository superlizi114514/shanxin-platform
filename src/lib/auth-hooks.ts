"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status, update } = useSession();

  return {
    session,
    status,
    update,
    isAuthenticated: !!session,
    user: session?.user,
  };
}
