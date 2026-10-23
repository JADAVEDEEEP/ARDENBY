import {
  AdminApiError,
  isAdminRole,
  isSessionRejected,
} from '@/components/admin/admin-auth';

export type RequiredAdminRole = 'admin' | 'superadmin';

export type AdminCheckOutcome =
  | { kind: 'user'; role?: string }
  | { kind: 'error'; error: unknown };

export type AdminDecision =
  | { status: 'allowed' }
  | { status: 'denied' }
  | { status: 'retry' }
  | { status: 'login'; clearToken: boolean }
  | { status: 'admin-home' };

/**
 * Pure access decision for the admin area, kept apart from React so it can be
 * tested. Only a rejected session (HTTP 401) signs the user out: a network
 * blip, a rate-limit or a server error never locks out a legitimate admin.
 */
export function decideAdminAccess(
  outcome: AdminCheckOutcome,
  required: RequiredAdminRole
): AdminDecision {
  if (outcome.kind === 'error') {
    if (isSessionRejected(outcome.error)) {
      return { status: 'login', clearToken: true };
    }

    if (outcome.error instanceof AdminApiError && outcome.error.status === 403) {
      return { status: 'denied' };
    }

    return { status: 'retry' };
  }

  if (!isAdminRole(outcome.role)) {
    return { status: 'denied' };
  }

  if (required === 'superadmin' && outcome.role !== 'superadmin') {
    return { status: 'admin-home' };
  }

  return { status: 'allowed' };
}
