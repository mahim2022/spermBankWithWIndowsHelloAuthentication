import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { base64UrlToBuffer, bufferToBase64Url } from '@/lib/webAuthCodec';

function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  // 1) Verify Firebase ID token (we’re doing step-up for a signed-in user)
  const idToken = getBearer(req);
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const uid = decoded.uid;


  // 2) Read the browser's WebAuthn assertion
  const assertion = await req.json();
  const assertionID: string | undefined = bufferToBase64Url(assertion?.id);
  if (!assertionID) {
    return NextResponse.json({ error: 'Missing assertion id' }, { status: 402 });
  }

  const chRef = adminDb.collection('webauthnChallenges').doc(uid);
  const chSnap = await chRef.get();
  const expectedChallenge: string | undefined = chSnap.data()?.authenticationChallenge;
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'No challenge for user' }, { status: 403 });
  }

  // 4) Find the matching credential for this assertion
  const credRef = adminDb
    .collection('webauthnCredentials')
    .doc(uid)
    .collection('creds')
    .doc(assertionID); // we saved doc id === credentialID (base64url)
  const credSnap = await credRef.get();



  if (!credSnap.exists) {
    return NextResponse.json({ error: 'Credential not found for user' }, { status: 404 });
  }

  const cred = credSnap.data()!;

  const authenticator = {
    // verifyAuthenticationResponse expects Buffers here
    credentialID: base64UrlToBuffer(cred.credentialID),
    credentialPublicKey: base64UrlToBuffer(cred.credentialPublicKey),
    counter: typeof cred.counter === 'number' ? cred.counter : 0,
    // transports: cred.transports ?? undefined, // optional
  };

  // 5) Verify the assertion
  const verification = await verifyAuthenticationResponse({
    response: assertion,
    expectedChallenge,
    expectedOrigin: process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN!, // e.g. 'http://localhost:3000'
    expectedRPID: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID!,     // e.g. 'localhost'
    credential: {
      id: cred.credentialID,
      publicKey: authenticator.credentialPublicKey,
      counter: cred.counter,
      transports: cred.transports,
    },
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.authenticationInfo) {
    return NextResponse.json({ verified: false }, { status: 405 });
  }

  // 6) Update the credential counter and clear the challenge
  const { newCounter } = verification.authenticationInfo;
  await credRef.set({ ...cred, counter: newCounter }, { merge: true });
  await chRef.delete();

  // 7) Done
  return NextResponse.json({ verified: true });
}
