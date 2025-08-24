// src/lib/passkeyLink.ts
'use client';

import { startRegistration } from '@simplewebauthn/browser';
import { auth } from '@/lib/firebase';

/**
 * Perform WebAuthn (passkey) registration and link it to the current user
 * @returns {Promise<void>} Resolves if successful, rejects with error otherwise
 */
export async function passkeyLink(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not signed in');

  const idToken = await currentUser.getIdToken(true);

  // 1) Get registration options from backend
  const optRes = await fetch('/api/webauthn/generate-registration', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!optRes.ok) throw new Error(`Failed to get options: ${optRes.status}`);
  const options = await optRes.json();

  // 2) Start WebAuthn registration in browser
  const attResp = await startRegistration(options);

  // 3) Verify registration on backend
  const verifyRes = await fetch('/api/webauthn/verify-registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(attResp),
  });

  const result = await verifyRes.json();
  if (!verifyRes.ok || !result.verified) {
    throw new Error(result?.error || 'Registration verification failed');
  }

  // success → nothing returned, just resolves
}
