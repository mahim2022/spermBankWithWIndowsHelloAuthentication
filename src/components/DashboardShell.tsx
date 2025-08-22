'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AppBar, Toolbar, Typography, Box, CssBaseline, Drawer,
  List, ListItemButton, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ScienceIcon from '@mui/icons-material/Science';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 260;

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Donors', href: '/dashboard/donors', icon: <PeopleIcon /> },
  { label: 'Retrieval', href: '/dashboard/retrieval', icon: <ScienceIcon /> },
  { label: 'Audit Logs', href: '/dashboard/logs', icon: <ListAltIcon /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <SettingsIcon /> },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, backgroundImage: 'none' }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            SpermBank Console
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }} >
          <List>
            {NAV.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, py: 1, color: 'text.secondary', fontSize: 12 }}>
            Desktop-only • MFA enforced
          </Box>
        </Box>
      </Drawer>

      <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 3,
    // ❌ remove ml: `${drawerWidth}px`,
    minHeight: '100vh',
    backgroundColor: (t) =>
      t.palette.mode === 'light' ? '#fafafa' : 'background.default',
  }}
>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
