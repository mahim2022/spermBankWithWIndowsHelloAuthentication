// src/lib/audit.ts
import { auth } from '@/lib/firebase';

type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'mfa_passkey_verified'
  | 'donor_update'
  | 'sperm_retrieval_confirmed'
  | 'incident';

export async function logAudit(action: AuditAction, details?: any) {
  const user = auth.currentUser;
  if (!user) {
    // For failed logins (no user yet), you can call with a custom token flow later.
    // For now, silently skip if no user.
    return;
  }
  const idToken = await user.getIdToken(true);

  await fetch('/api/audit/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ action, details }),
  });
}
