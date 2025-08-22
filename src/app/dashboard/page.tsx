'use client';

import * as React from 'react';
import { Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import Link from 'next/link';

const tiles = [
  { title: 'Register Donor', desc: 'Add new donor record', href: '/dashboard/donors' },
  { title: 'Start Retrieval', desc: 'Confirm a sperm retrieval', href: '/dashboard/retrieval' },
  { title: 'View Audit Logs', desc: 'Review sensitive activities', href: '/dashboard/logs' },
  { title: 'Settings', desc: 'Profile, security, passkeys', href: '/dashboard/settings' },
];

export default function DashboardHome() {
  return (
    <Grid container spacing={2}>
      {tiles.map((t) => (
        <Grid item xs={12} md={6} lg={4} key={t.href}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardActionArea component={Link} href={t.href} sx={{ p: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t.title}</Typography>
                <Typography variant="body2" color="text.secondary">{t.desc}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
