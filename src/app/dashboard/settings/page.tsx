'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';

import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { startRegistration } from '@simplewebauthn/browser';
import { passkeyLink } from '@/lib/passkeyLink';

type Passkey = {
  id: string;                 // doc id == credentialID (base64url)
  credentialID: string;
  counter?: number;
  fmt?: string;
  createdAt?: number | { toDate: () => Date }; // could be millis or Firestore Timestamp
};

function formatWhen(v: Passkey['createdAt']) {
  if (!v) return '—';
  try {
    const d = typeof v === 'number' ? new Date(v) : v.toDate?.() ?? new Date();
    return d.toLocaleString();
  } catch {
    return '—';
  }
}

function shortId(id: string) {
  if (!id) return '';
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

export default function SettingsPage() {
  const [user, setUser] = React.useState<User | null | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  const [passkeys, setPasskeys] = React.useState<Passkey[]>([]);
  const [busy, setBusy] = React.useState(false);

  const [snack, setSnack] = React.useState<{ open: boolean; msg: string; sev: 'success'|'error'|'info' }>({
    open: false, msg: '', sev: 'success'
  });

  // delete confirm
  const [delOpen, setDelOpen] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<Passkey | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchPasskeys = React.useCallback(async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, 'webauthnCredentials', user.uid, 'creds'));
    const rows: Passkey[] = snap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        credentialID: data.credentialID ?? d.id,
        counter: data.counter,
        fmt: data.fmt,
        createdAt: data.createdAt,
      };
    });
    setPasskeys(rows);
  }, [user]);

  React.useEffect(() => {
    if (user) fetchPasskeys();
  }, [user, fetchPasskeys]);

  // Add new passkey
  const handleAddPasskey = async () => {
    if (!user) return;
    try {
      setBusy(true);
    //   const idToken = await user.getIdToken(true);

    //   // 1) Ask server for attestation options
    //   // NOTE: adjust paths if your routes are named differently.
    //   const startRes = await fetch('/api/webauthn/register-passkey/options', {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${idToken}` },
    //   });
    //   if (!startRes.ok) throw new Error('Failed to get registration options');
    //   const options = await startRes.json();

    //   // 2) Run WebAuthn ceremony in browser
    //   const attResp = await startRegistration(options);

    //   // 3) Send response back to server for verification + storage
    //   const verifyRes = await fetch('/api/webauthn/register-passkey', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${idToken}`,
    //     },
    //     body: JSON.stringify(attResp),
    //   });
    //   if (!verifyRes.ok) {
    //     const j = await verifyRes.json().catch(() => ({}));
    //     throw new Error(j.error || 'Registration verification failed');
    //   }
        await passkeyLink();
      setSnack({ open: true, msg: 'Passkey added!', sev: 'success' });
      await fetchPasskeys();
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || 'Failed to add passkey', sev: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // Delete passkey
  const confirmDelete = (p: Passkey) => {
    setDelTarget(p);
    setDelOpen(true);
  };

  const handleDelete = async () => {
    if (!user || !delTarget) return;
    try {
      setBusy(true);
      await deleteDoc(doc(db, 'webauthnCredentials', user.uid, 'creds', delTarget.id));
      setSnack({ open: true, msg: 'Passkey deleted', sev: 'success' });
      setDelOpen(false);
      setDelTarget(null);
      await fetchPasskeys();
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || 'Failed to delete passkey', sev: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // Send password reset
  const handlePasswordReset = async () => {
    if (!user?.email) {
      setSnack({ open: true, msg: 'No email on account', sev: 'error' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSnack({ open: true, msg: 'Password reset email sent', sev: 'success' });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || 'Failed to send reset email', sev: 'error' });
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading || user === undefined) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null; // auth guard should redirect already

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Settings</Typography>

      <Stack spacing={2}>
        {/* Account */}
        <Card>
          <CardHeader title="Account" />
          <CardContent>
            <Typography>Email: <strong>{user.email ?? '—'}</strong></Typography>
            <Typography sx={{ mt: 0.5 }}>UID: <code>{user.uid}</code></Typography>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<LockResetIcon />}
                onClick={handlePasswordReset}
              >
                Send password reset
              </Button>
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Passkeys */}
        <Card>
          <CardHeader
            title="Passkeys"
            action={
              <Button
                variant="contained"
                startIcon={<SecurityIcon />}
                onClick={handleAddPasskey}
                disabled={busy}
              >
                Add passkey
              </Button>
            }
          />
          <CardContent>
            {passkeys.length === 0 ? (
              <Typography color="text.secondary">No passkeys yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Credential ID</TableCell>
                    <TableCell>Counter</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {passkeys.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell title={p.credentialID}>{shortId(p.credentialID)}</TableCell>
                      <TableCell>{p.counter ?? 0}</TableCell>
                      <TableCell>{p.fmt ?? '—'}</TableCell>
                      <TableCell>{formatWhen(p.createdAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          onClick={() => confirmDelete(p)}
                          disabled={busy}
                          aria-label="delete passkey"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Delete confirmation */}
      <Dialog open={delOpen} onClose={() => setDelOpen(false)}>
        <DialogTitle>Delete passkey</DialogTitle>
        <DialogContent>
          <Typography>
            Remove this passkey (<code>{shortId(delTarget?.credentialID || '')}</code>)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={busy}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
