import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { bufferToBase64Url } from '@/lib/webAuthCodec';

function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  const idToken = getBearer(req);
  // console.log(idToken);
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const uid = decoded.uid;

  const body = await req.json();
  // console.log('Attestation Response:', body);
  const challengeDoc = await adminDb.collection('webauthnChallenges').doc(uid).get();
  if (!challengeDoc.exists) return NextResponse.json({ error: 'No challenge' }, { status: 400 });
  const expectedChallenge = challengeDoc.data()?.registrationChallenge;

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN!,
    expectedRPID: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID!,
    requireUserVerification: true,
  });
  
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const info = verification.registrationInfo;
  const credIdB64u = bufferToBase64Url(info.credential.id);
  const pubKeyB64u = bufferToBase64Url(info.credential.publicKey);
  
  if (!credIdB64u || !pubKeyB64u) {
    return NextResponse.json({ error: 'Invalid credential data' }, { status: 400 });
  }

  // Store credential
  await adminDb.collection('webauthnCredentials').doc(uid).collection('creds').doc(credIdB64u).set({
    credentialID: credIdB64u,
    credentialPublicKey: pubKeyB64u,
    counter: info.credential.counter,
    fmt: info.fmt,
    createdAt: Date.now(),
  });

  // Cleanup challenge
  await adminDb.collection('webauthnChallenges').doc(uid).delete();

  return NextResponse.json({ verified: true });
}
