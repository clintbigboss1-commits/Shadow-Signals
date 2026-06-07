export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'elite';
  created_at: string;
}

export function saveAuth(token: string, user: User): void {
  localStorage.setItem('ss_token', token);
  localStorage.setItem('ss_user', JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ss_token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ss_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('ss_token');
  localStorage.removeItem('ss_user');
  window.location.href = '/login';
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 5,
  pro: 999,
  elite: 999,
};
