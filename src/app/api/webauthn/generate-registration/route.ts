import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { generateRegistrationOptions } from '@simplewebauthn/server';

function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
    
  const idToken = getBearer(req);


  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const uid = decoded.uid;
  const email = decoded.email || uid;

  // Optional: exclude already-registered credential IDs so the browser avoids duplicates
  const credsSnap = await adminDb.collection('webauthnCredentials').doc(uid).collection('creds').get();
  const excludeCredentials = credsSnap.docs.map(d => ({
    id: d.id,
    type: 'public-key' as const,
  }));

  const options = await generateRegistrationOptions({
    rpName: process.env.NEXT_PUBLIC_WEBAUTHN_RP_NAME!,
    rpID: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID!,
    userID: new TextEncoder().encode(uid),
    userName: email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // built-in (fingerprint/Windows Hello/Touch ID)
      requireResidentKey: true,
      userVerification: 'required',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    excludeCredentials,
  });

  // Save challenge for verification step
  await adminDb.collection('webauthnChallenges').doc(uid).set({
    registrationChallenge: options.challenge,
    createdAt: Date.now(),
  });

  return NextResponse.json(options);
}
