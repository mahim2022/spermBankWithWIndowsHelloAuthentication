// src/components/PasskeyStepUpButton.tsx
'use client';
import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { startAuthentication } from '@simplewebauthn/browser';
import { auth } from '@/lib/firebase';

export default function PasskeyStepUpButton({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleVerify() {
    setErr(null);
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const idToken = await user.getIdToken(true);

      // 1) get options
      const optRes = await fetch('/api/webauthn/authenticate-passkey', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!optRes.ok) throw new Error('Failed to get auth options');
      const options = await optRes.json();

      // 2) webauthn
      const assertion = await startAuthentication(options);
      
      // 3) verify (we’ll implement this endpoint next)
      const verifyRes = await fetch('/api/webauthn/verify-authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(assertion),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok || !result.verified) throw new Error(result?.error || 'Verification failed');

      onSuccess();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="contained" onClick={handleVerify} disabled={loading}>
        {loading ? <CircularProgress size={18} /> : 'Confirm with fingerprint'}
      </Button>
      <Snackbar open={!!err} onClose={() => setErr(null)} autoHideDuration={6000}>
        <Alert severity="error">{err}</Alert>
      </Snackbar>
    </>
  );
}
