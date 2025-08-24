'use client';

import * as React from 'react';
import {
  Box, Stack, Typography, TextField, MenuItem, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Tooltip, Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, orderBy, limit
} from 'firebase/firestore';
import { passkeyStepUpVerify } from '@/lib/usePassKeyStepUp';

type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'mfa_passkey_verified'
  | 'donor_update'
  | 'sperm_retrieval_confirmed'
  | 'incident';

const ACTIONS: AuditAction[] = [
  'login',
  'login_failed',
  'logout',
  'mfa_passkey_verified',
  'donor_update',
  'sperm_retrieval_confirmed',
  'incident',
];

type AuditRow = {
  id: string;
  time: string;
  timeMs: number;
  action: AuditAction | string;
  email?: string | null;
  uid?: string;
  detailsShort?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  env?: string;
};

function formatTimeFromMillis(ms?: number): { time: string; timeMs: number } {
  const t = typeof ms === 'number' ? ms : Date.now();
  const d = new Date(t);
  return { time: d.toLocaleString(), timeMs: t };
}

function briefDetails(details: any): string {
  if (!details) return '';
  try {
    const interesting = ['donorId', 'action', 'donorName', 'message', 'reason'];
    const picked: Record<string, any> = {};
    interesting.forEach((k) => {
      if (details[k] !== undefined) picked[k] = details[k];
    });
    const base = Object.keys(picked).length ? picked : details;
    const s = JSON.stringify(base);
    return s.length > 80 ? s.slice(0, 77) + '…' : s;
  } catch {
    return String(details);
  }
}

export default function AuditLogsPage() {
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // filters
  const [actionFilter, setActionFilter] = React.useState<string>('all');
  const [q, setQ] = React.useState('');

  // dialog
  const [open, setOpen] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState<AuditRow | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError('');

    // 🔧 tailored to your writer: order by tsMillis desc, limit 100
    const qRef = query(
      collection(db, 'auditLogs'),
      orderBy('tsMillis', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const next: AuditRow[] = snap.docs.map((doc) => {
          const d: any = doc.data();
          const { time, timeMs } = formatTimeFromMillis(d.tsMillis ?? d.ts);

          return {
            id: doc.id,
            time,
            timeMs,
            action: d.action ?? 'unknown',
            email: d.email ?? null,
            uid: d.uid,
            details: d.details ?? null,
            detailsShort: briefDetails(d.details),
            ip: d.ip,
            userAgent: d.userAgent,
            env: d.env,
          };
        });
        setRows(next);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message || 'Failed to load logs.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const actionOk = actionFilter === 'all' || r.action === actionFilter;
      if (!needle) return actionOk;
      const hay = `${r.id} ${r.action} ${r.email ?? ''} ${r.uid ?? ''} ${r.detailsShort ?? ''} ${r.ip ?? ''} ${r.env ?? ''}`
        .toLowerCase();
      return actionOk && hay.includes(needle);
    });
  }, [rows, actionFilter, q]);

  const columns: GridColDef[] = [
    { field: 'time', headerName: 'Time', width: 190 },
    { field: 'action', headerName: 'Action', width: 220 },
    { field: 'email', headerName: 'User Email', width: 220 },
    { field: 'uid', headerName: 'UID', width: 230 },
    {
      field: 'detailsShort',
      headerName: 'Details',
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <Tooltip title={params.value}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.value}
            </span>
          </Tooltip>
        ) : (
          ''
        ),
    },
    {
      field: 'view',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          aria-label="view details"
          onClick={() => {
            setActiveRow(params.row as AuditRow);
            setOpen(true);
          }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ color: "black" }}>
        Audit Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          sx={{
      minWidth: 320,
      '& .MuiOutlinedInput-root': {
        color: 'black',
        '& fieldset': {
          borderColor: 'black',
        },
        '&:hover fieldset': {
          borderColor: 'black',
        },
        '&.Mui-focused fieldset': {
          borderColor: 'black',
        },
      },
      '& .MuiInputLabel-root': {
        color: 'black',
      },
    }}

        >
          <MenuItem value="all">All actions</MenuItem>
          {ACTIONS.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Search (email, uid, details, ip)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{
    minWidth: 320,
    '& .MuiOutlinedInput-root': {
      color: 'black', // text color
      '& fieldset': {
        borderColor: 'black', // default border
      },
      '&:hover fieldset': {
        borderColor: 'black', // hover border
      },
      '&.Mui-focused fieldset': {
        borderColor: 'black', // focus border
      },
    },
    '& .MuiInputLabel-root': {
      color: 'black', // label color
    },
  }}
        />
      </Stack>

      <div style={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
        />
      </div>

      <Dialog  open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {JSON.stringify(
              {
                id: activeRow?.id,
                time: activeRow?.time,
                action: activeRow?.action,
                email: activeRow?.email,
                uid: activeRow?.uid,
                ip: activeRow?.ip,
                userAgent: activeRow?.userAgent,
                env: activeRow?.env,
                details: activeRow?.details ?? null,
                tsMillis: activeRow?.timeMs,
              },
              null,
              2
            )}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => {
            setOpen(false)}}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
