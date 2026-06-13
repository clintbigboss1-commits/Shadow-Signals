'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '../lib/auth';

interface Options {
  requireAnon?: boolean; // true = redirect logged-in users away (login/signup pages)
}

// Drop-in guard replacing ad-hoc getUser() / router.push('/login') patterns.
// requireAnon: true  — if already logged in, redirect to /dashboard
// requireAnon: false (default) — if not logged in, redirect to /login
export default function useAuthGuard({ requireAnon = false }: Options = {}) {
  const router = useRouter();

  useEffect(() => {
    const loggedIn = isLoggedIn();
    if (requireAnon && loggedIn) {
      router.replace('/dashboard');
    } else if (!requireAnon && !loggedIn) {
      router.replace('/login');
    }
  }, [requireAnon, router]);
}
