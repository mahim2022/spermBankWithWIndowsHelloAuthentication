// lib/webauthn.ts
import { startAuthentication } from '@simplewebauthn/browser'

export async function authenticatePasskey(username: string) {
  // Step 1: Ask backend for authentication options
  const optionsRes = await fetch('/api/webauthn/authenticate-passkey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  const options = await optionsRes.json()

  // Step 2: Run WebAuthn authentication in browser
  const assertionResponse = await startAuthentication(options)

  // Step 3: Send result back to backend for verification
  const verificationRes = await fetch('/api/authenticate-passkey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, response: assertionResponse }),
  })

  const verificationJSON = await verificationRes.json()
  return verificationJSON
}
