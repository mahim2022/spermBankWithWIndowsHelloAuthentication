// src/hooks/usePasskeyStepUp.ts
'use client';

import { startAuthentication } from '@simplewebauthn/browser';
import { auth } from '@/lib/firebase';

/**
 * Perform WebAuthn (passkey) step-up verification
 * @returns {Promise<void>} Resolves if successful, rejects with an error otherwise
 */
export async function passkeyStepUpVerify(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const idToken = await user.getIdToken(true);

  // 1) Request auth options from server
  const optRes = await fetch('/api/webauthn/authenticate-passkey', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!optRes.ok) throw new Error('Failed to get auth options');
  const options = await optRes.json();

  // 2) Perform WebAuthn
  const assertion = await startAuthentication(options);

  // 3) Verify on backend
  const verifyRes = await fetch('/api/webauthn/verify-authentication', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(assertion),
  });

  const result = await verifyRes.json();
  if (!verifyRes.ok || !result.verified) {
    throw new Error(result?.error || 'Verification failed');
  }
}
