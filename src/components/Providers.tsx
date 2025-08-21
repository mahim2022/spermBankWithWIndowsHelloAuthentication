// src/components/Providers.tsx
'use client';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/context/AuthContext';
import theme from '../theme';

// const theme = createTheme({
//   palette: {
//     mode: 'light',
//     primary: { main: '#0e5aa7' },
//     secondary: { main: '#6b9a3c' },
//   },
//   shape: { borderRadius: 8 },
// });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
     </ThemeProvider>
  );
}
