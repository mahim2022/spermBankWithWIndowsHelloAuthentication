// // src/components/PasskeyLinkButton.tsx
// 'use client';
// import React, { useState } from 'react';
// import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
// import { linkWithPasskey } from '@firebase-web-authn/browser';
// import { auth, functions } from '@/lib/firebase';
// import * as SimpleWebAuthnBrowser from '@simplewebauthn/browser';

// export default function PasskeyLinkButton() {
//   const [loading, setLoading] = useState(false);
//   const [msg, setMsg] = useState<string | null>(null);
//   const [err, setErr] = useState<string | null>(null);

//   async function handleLink() {
//     setErr(null); setMsg(null);
//     setLoading(true);
//     try {
//       // name is a small label (can be user's name or 'Work laptop')
//       await linkWithPasskey(auth, functions, 'Workstation passkey');
//       setMsg('Passkey registered and linked to your account.');
//     } catch (e: any) {
//       setErr(e?.message || String(e));
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <>
//       <Button variant="contained" onClick={handleLink} disabled={loading}>
//         {loading ? <CircularProgress size={18} /> : 'Register fingerprint (passkey)'}
//       </Button>

//       <Snackbar open={!!msg} onClose={() => setMsg(null)} autoHideDuration={4000}>
//         <Alert severity="success">{msg}</Alert>
//       </Snackbar>
//       <Snackbar open={!!err} onClose={() => setErr(null)} autoHideDuration={6000}>
//         <Alert severity="error">{err}</Alert>
//       </Snackbar>
//     </>
//   );
// }



'use client';
import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import * as SimpleWebAuthnBrowser from '@simplewebauthn/browser';
import { auth } from '@/lib/firebase';

export default function PasskeyLinkButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleLink() {
    setErr(null); setMsg(null);
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not signed in');
      // console.log('Current User:', currentUser);
      const idToken = await currentUser.getIdToken(true);
      // console.log('ID Token:', idToken);

      // 1) Get options from server
      const optRes = await fetch('/api/webauthn/generate-registration', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!optRes.ok) throw new Error(`Failed to get options: ${optRes.status}`);
      const options = await optRes.json();
      
      // 2) Start registration in browser
      const attResp = await SimpleWebAuthnBrowser.startRegistration(options);
      // console.log('Attestation Response:', attResp);
      // 3) Verify on server
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

      setMsg('Passkey registered to your account.');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="contained" onClick={handleLink} disabled={loading}>
        {loading ? <CircularProgress size={18} /> : 'Register fingerprint (passkey)'}
      </Button>
      <Snackbar open={!!msg} onClose={() => setMsg(null)} autoHideDuration={4000}>
        <Alert severity="success">{msg}</Alert>
      </Snackbar>
      <Snackbar open={!!err} onClose={() => setErr(null)} autoHideDuration={6000}>
        <Alert severity="error">{err}</Alert>
      </Snackbar>
    </>
  );
}
