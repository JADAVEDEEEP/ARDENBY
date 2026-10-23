'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AdminUser,
  clearAdminToken,
  endAdminSession,
  getAdminToken,
  getCurrentAdmin,
} from '@/components/admin/admin-auth';
import {
  AdminCheckOutcome,
  RequiredAdminRole,
  decideAdminAccess,
} from '@/components/admin/admin-access-decision';
import { adminLoginUrl } from '@/lib/auth-redirect';

export type { RequiredAdminRole } from '@/components/admin/admin-access-decision';

/**
 * checking  - nothing decided yet (first load, refresh, or redirecting)
 * allowed   - signed in with a verified admin (or super admin) role
 * denied    - signed in, but this account may not open the page (HTTP 403 screen)
 * retry     - the server could not be reached; the session is kept and can be retried
 */
export type AdminAccessStatus = 'checking' | 'allowed' | 'denied' | 'retry';

/**
 * Client-side gate for the admin area. The backend re-checks the role on every
 * API call, so this only decides what to show; it never grants anything.
 */
export function useAdminAccess(required: RequiredAdminRole, enabled = true) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<AdminAccessStatus>('checking');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [attempt, setAttempt] = useState(0);
  const allowedOnce = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const goToLogin = () => {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(adminLoginUrl(`${pathname}${search}`));
    };

    async function verify() {
      if (!getAdminToken()) {
        allowedOnce.current = false;
        setUser(null);
        setStatus('checking');
        goToLogin();
        return;
      }

      // Show the spinner on the first check only; later route changes re-verify
      // quietly so the page does not flash or unmount.
      if (!allowedOnce.current) setStatus('checking');

      let outcome: AdminCheckOutcome;

      try {
        const current = await getCurrentAdmin();
        outcome = { kind: 'user', role: current.role };
        if (!cancelled) setUser(current);
      } catch (error) {
        outcome = { kind: 'error', error };
      }

      if (cancelled) return;

      const decision = decideAdminAccess(outcome, required);

      switch (decision.status) {
        case 'allowed':
          allowedOnce.current = true;
          setStatus('allowed');
          return;
        case 'denied':
          allowedOnce.current = false;
          setStatus('denied');
          return;
        case 'retry':
          // Keep an already-open page usable; only block the first load.
          if (!allowedOnce.current) setStatus('retry');
          return;
        case 'admin-home':
          router.replace('/admin');
          return;
        case 'login':
          allowedOnce.current = false;
          if (decision.clearToken) clearAdminToken();
          setUser(null);
          setStatus('checking');
          goToLogin();
          return;
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [enabled, required, pathname, router, attempt]);

  const retry = useCallback(() => {
    allowedOnce.current = false;
    setStatus('checking');
    setAttempt((value) => value + 1);
  }, []);

  const signOut = useCallback(() => {
    allowedOnce.current = false;
    clearAdminToken();
    setUser(null);
    // Drop the server-side cookie too, then leave the (now hidden) admin area.
    void endAdminSession().finally(() => router.replace('/'));
  }, [router]);

  return { status, user, retry, signOut };
}
