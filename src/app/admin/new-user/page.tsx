"use client";

import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { passkeyLink } from "@/lib/passkeyLink";

export default function NewUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreateUser() {
    setLoading(true);
    setMessage(null);

    try {
      // Step 1: Create Firebase user
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Optional: force login as that user (some admins may prefer service account creation instead)
      await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Link passkey
      await passkeyLink();

      setMessage(`✅ User ${cred.user.email} created and passkey linked`);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Create New User
      </Typography>

      <TextField
        fullWidth
        label="Email"
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        fullWidth
        label="Password"
        type="password"
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleCreateUser}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Create User + Link Passkey"}
      </Button>

      {message && (
        <Alert severity={message.startsWith("✅") ? "success" : "error"} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}
