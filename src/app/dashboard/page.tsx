// src/app/dashboard/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

import { useRouter } from 'next/navigation';
import { linkWithPasskey } from '@firebase-web-authn/browser';
import { auth, functions } from '@/lib/firebase';
import { Box, Button, Container, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import PasskeyStepUpButton from '@/components/PasskeyStepUpButton';
import PasskeyLinkButton from '@/components/PasskeyLinkButton';

export default  function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
   const [linkLoading, setlinkLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);


  if (loading || !user || linkLoading) return <div style={{ padding: 24 }}>Loading…</div>;

    const currentUser = auth.currentUser;
          if (!currentUser) throw new Error('Not signed in');
          // console.log('Current User:', currentUser);
          const idToken =  currentUser.getIdToken(true).then((token) => {
            console.log('ID Token:', token)})
          // console.log('ID Token:', idToken);
 
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography>Signed in as: {user.email}</Typography>
      {/* <Typography>User Token {user}</Typography> */}


      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="secondary" onClick={() => signOut()}>
          Sign out
        </Button>
      </Box>
     <PasskeyLinkButton />
     <PasskeyStepUpButton onSuccess={() => {
        setMsg('Passkey verified successfully!');}}/>
     {/* <PasskeyStepUpButton onSuccess={() => {
        setMsg('Passkey verified successfully!');> */}
    </Container>
  );
}
