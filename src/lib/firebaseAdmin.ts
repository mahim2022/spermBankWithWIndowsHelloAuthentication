import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (b64) {
    const raw = Buffer.from(b64, 'base64').toString('utf8').trim();
    const parsed = JSON.parse(raw);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }

  if (json) {
    const trimmed = json.trim();
    // Guard: if someone accidentally pasted two JSON objects back-to-back
    if (trimmed.indexOf('}{') !== -1) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY contains multiple concatenated JSON objects. Keep only one.');
    }
    const parsed = JSON.parse(trimmed);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }

  throw new Error('No service account found. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64.');
}

const serviceAccount = loadServiceAccount();

const adminApp: App = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
