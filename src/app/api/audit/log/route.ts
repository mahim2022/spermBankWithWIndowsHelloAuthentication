// src/app/api/audit/log/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'mfa_passkey_verified'
  | 'donor_update'
  | 'sperm_retrieval_confirmed'
  | 'incident';

function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  try {
    const idToken = getBearer(req);
    if (!idToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    // Verify Firebase session
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const uid = decoded.uid;
    const email = decoded.email || null;

    // Parse body
    const body = await req.json().catch(() => ({}));
    const action: AuditAction | undefined = body?.action;
    const details: any = body?.details ?? null;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    // Basic request context
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const now = Date.now();

    // Write a single log record
    await adminDb.collection('auditLogs').add({
      uid,
      email,
      action,
      details,
      userAgent,
      ip,
      tsMillis: now,
      ts: now, // keep numeric for easy queries; (serverTimestamp optional)
      env: process.env.VERCEL_ENV || 'local',
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Audit log failed' }, { status: 500 });
  }
}
