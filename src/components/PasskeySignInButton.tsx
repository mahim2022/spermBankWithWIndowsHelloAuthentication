// src/components/PasskeySignInButton.tsx
'use client';
import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { signInWithPasskey } from '@firebase-web-authn/browser';
import { auth, functions } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { authenticatePasskey } from '../lib/webauthn'
import { getIdToken } from "firebase/auth";
import { getAuth } from 'firebase/auth';




export default function PasskeySignInButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const [username, setUsername] = useState('mdsorif@gmail.com')
  const [message, setMessage] = useState('')


  async function handleClick() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('No user signed in');
    const idToken = await getIdToken(user,true);
    console.log('ID Token:', idToken);
    setErr(null);
    setLoading(true);
    try {
      const result = await authenticatePasskey(idToken)
      if (result.success) {
        setMessage('✅ Authentication successful')
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    }
  }

  return (
    <>
      <Button variant="outlined" onClick={handleClick} disabled={loading}>
        {loading ? <CircularProgress size={18} /> : 'Sign in with passkey'}
      </Button>
      <Snackbar open={!!err} onClose={() => setErr(null)} autoHideDuration={6000}>
        <Alert severity="error">{err}</Alert>
      </Snackbar>
    </>
  );
}
