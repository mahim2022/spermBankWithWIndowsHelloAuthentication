'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert
} from '@mui/material';
import { logAudit } from '@/lib/audit';
import { passkeyStepUpVerify } from '@/lib/usePassKeyStepUp';

interface Donor {
  id: string;
  name: string;
  status: string;
}

export default function RetrievalPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState(false);

  // Fetch only donors that are available
  const fetchDonors = async () => {
    const snap = await getDocs(collection(db, 'donors'));
    const data: Donor[] = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Donor))
      .filter((d) => d.status === 'available');
    setDonors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  // Handle confirm retrieval
  const handleConfirm = async () => {
    if (!selectedDonor) return;

    await passkeyStepUpVerify();
    const donorRef = doc(db, 'donors', selectedDonor.id);

    // Update donor status to "used"
    await updateDoc(donorRef, { status: 'used' });

    // Log audit
    await logAudit('sperm_retrieval_confirmed', {
      donorId: selectedDonor.id,
      donorName: selectedDonor.name,
    });

    setOpen(false);
    setSnackbar(true);
    fetchDonors(); // refresh
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'name', headerName: 'Donor Name', width: 200 },
    { field: 'status', headerName: 'Status', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedDonor(params.row);
            setOpen(true);
          }}
        >
          Retrieve
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sperm Retrieval
      </Typography>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={donors}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10]}
        />
      </div>

      {/* Confirm Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Retrieval</DialogTitle>
        <DialogContent>
          Are you sure you want to retrieve sample from{" "}
          <strong>{selectedDonor?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Retrieval confirmed and logged!
        </Alert>
      </Snackbar>
    </Box>
  );
}
