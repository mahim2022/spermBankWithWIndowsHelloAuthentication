'use client';
import DashboardShell from '@/components/DashboardShell';
import { useAuthGuard } from '../../lib/useAuthGuard';
import { CircularProgress, Box } from '@mui/material';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  const user = useAuthGuard();

  if (user === undefined) {
    // still checking auth state
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // if user is null, they’ll already be redirected by the hook
  if (!user) return null;

  return <DashboardShell>{children}</DashboardShell>;
}