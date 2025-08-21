// src/app/api/webauthn/authenticate-passkey/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  // 1) Identify the signed-in user (this route is for step-up; passkey sign-in is a separate flow)
  const idToken = getBearer(req);

  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const uid = decoded.uid;
  // 2) Load this user's registered passkeys (stored during registration)
  const credsSnap = await adminDb
    .collection('webauthnCredentials')
    .doc(uid)
    .collection('creds')
    .get();

  if (credsSnap.empty) {
    return NextResponse.json({ error: 'User not found or not registered' }, { status: 400 });
  }
  // IMPORTANT: pass base64url strings (NOT Buffers) here
  const allowCredentials = credsSnap.docs.map((d) => ({
    id: d.data().credentialID as string, // already base64url string in Firestore
    type: 'public-key' as const,
  }));

  // 3) Create challenge
  const options = await generateAuthenticationOptions({
  rpID: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID!, // e.g. "localhost" in dev
  userVerification: 'preferred', // or 'required' if you want to enforce it
  // allowCredentials,
  
});



  // 4) Persist challenge for later verification
  await adminDb.collection('webauthnChallenges').doc(uid).set(
    {
      authenticationChallenge: options.challenge,
      createdAt: Date.now(),
    },
    { merge: true }, // safe if other fields exist
  );

  // 5) Return options for the browser to call navigator.credentials.get()
  return NextResponse.json(options);
}
