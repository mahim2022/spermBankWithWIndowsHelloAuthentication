'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { passkeyStepUpVerify } from '@/lib/usePassKeyStepUp';
import { logAudit } from '@/lib/audit';

interface Donor {
  id: string;
  name: string;
  dob: string;
  bloodType: string;
  status: string;
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [status, setStatus] = useState('available');

  // Fetch donors
  const fetchDonors = async () => {
    const snap = await getDocs(collection(db, 'donors'));
    const data: Donor[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Donor));
    setDonors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  // Handle new donor save
  const handleSave = async () => {
    await passkeyStepUpVerify(); // step-up auth
    if (!name || !dob || !bloodType) return alert('Please fill all required fields');
    const docRef=await addDoc(collection(db, 'donors'), {
      name,
      dob,
      bloodType,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

       // 🔹 Log audit
    await logAudit('donor_update', {
      donorId: docRef.id,
      action: 'created',
      name,
    });

    setOpen(false);
    setName('');
    setDob('');
    setBloodType('');
    setStatus('available');
    fetchDonors(); // refresh list
  };

  // Handle delete donor
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this donor?')) {
      await passkeyStepUpVerify(); // step-up auth
      await deleteDoc(doc(db, 'donors', id));

      // 🔹 Log audit
      await logAudit('donor_update', {
        donorId: id,
        action: 'deleted',
      });

      fetchDonors(); // refresh after delete
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'dob', headerName: 'Date of Birth', width: 150 },
    { field: 'bloodType', headerName: 'Blood Type', width: 120 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Donor Records</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Add New Donor</Button>
      </Box>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={donors}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10]}
        />
      </div>

      {/* Add Donor Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Donor</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Date of Birth"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            select
            label="Blood Type"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            required
          >
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bt) => (
              <MenuItem key={bt} value={bt}>{bt}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {['available', 'used', 'quarantined'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
