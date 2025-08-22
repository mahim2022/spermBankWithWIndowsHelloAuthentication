'use client';

import { Box, Typography, Button } from '@mui/material';

export default function DonorsPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Donors</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Later we’ll add: create donor, list/search, edit donor.
      </Typography>
      <Button variant="contained" disabled>
        New Donor (coming soon)
      </Button>
    </Box>
  );
}
