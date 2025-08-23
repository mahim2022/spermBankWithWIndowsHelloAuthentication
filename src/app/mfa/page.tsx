'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import PasskeyStepUpButton from '@/components/PasskeyStepUpButton';

export default function MfaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error'>('idle');
  const [err, setErr] = useState('');

  // async function handleMfa() {
  //   setStatus('verifying');
  //   try {
  //     const user = auth.currentUser;
  //     if (!user) throw new Error('Not logged in');

  //     // Get Firebase token
  //     const token = await user.getIdToken();

  //     // 1) Ask server for auth options
  //     const res = await fetch('/api/webauthn/authenticate-passkey', {
  //       method: 'POST',
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const options = await res.json();

  //     // 2) Run browser WebAuthn
  //     // @ts-ignore
  //     const assertion = await navigator.credentials.get({ publicKey: options });

  //     // 3) Verify with server
  //     const res2 = await fetch('/api/webauthn/verify-authentication', {
  //       method: 'POST',
  //       headers: { Authorization: `Bearer ${token}` },
  //       body: JSON.stringify(assertion),
  //     });
  //     const result = await res2.json();

  //     if (result.verified) {
  //       sessionStorage.setItem('mfaVerified', 'true');
  //       router.replace('/dashboard');
  //     } else {
  //       throw new Error('Verification failed');
  //     }
  //   } catch (e: any) {
  //     setStatus('error');
  //     setErr(e.message);
  //   }
  // }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
      <h2>Multi-Factor Authentication</h2>
      <p>Please verify with your security key or fingerprint.</p>

      {/* <button onClick={handleMfa} disabled={status === 'verifying'}>
        {status === 'verifying' ? 'Verifying…' : 'Verify Passkey'}
      </button> */}
      <PasskeyStepUpButton onSuccess={() => 
        {sessionStorage.setItem('mfaVerified', 'true');
        router.replace('/dashboard')}}  />

      {status === 'error' && <p style={{ color: 'red' }}>{err}</p>}
    </div>
  );
}
