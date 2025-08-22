1. Project Overview

Name of project: Sperm Bank with Windows Hello Authentication

Short description (what it does, why it’s useful).

Example:

This project demonstrates secure step-up authentication using Windows Hello with WebAuthn. It is designed as a prototype for a sperm bank management system, where sensitive actions require biometric authentication.

2. Features

🔐 Windows Hello login (biometric or PIN)

🔑 WebAuthn (FIDO2) USB security key fallback

👨‍💻 User registration & step-up authentication demo

🗂️ Secure storage simulation

🛠 Plan for Audit Trail

    Firestore Collection:

    auditLogs/{logId}
    Each log contains:

        {
        "uid": "user123",
        "action": "login" | "logout" | "donor_update" | "sperm_retrieval" | "incident",
        "timestamp": 1700000000000,
        "details": "Extra context if needed"
        }


        When to log:

            After a successful email/password login

            After a successful WebAuthn biometric login

            After any donor data changes

            After sperm retrieval confirmation

            On suspicious/failed login attempts

            Implementation approach:

            Create a helper function in your Next.js app, e.g. logAuditAction(uid, action, details?)

            This function calls a Next.js API route (so logs are written server-side, ensuring tamper-proofing).

            The API route writes into Firestore.

            Audit Trail Logging

3. Prerequisites

Node.js version (e.g., >=18)

A browser that supports WebAuthn (latest Edge/Chrome/Firefox)

Windows Hello enabled on the device

Git installed

4. Installation (for developers)
# Clone the repo
git clone https://github.com/mahim2022/spermBankWithWIndowsHelloAuthentication.git

cd spermBankWithWIndowsHelloAuthentication

# Install dependencies
npm install

# Start development server
npm run dev

5. Usage

Open the app in your browser (http://localhost:3000)

Register a new account (Windows Hello prompt will appear)

Perform step-up authentication when required

Try USB security key if Windows Hello is unavailable

6. Project Structure
/src
  /pages
    index.tsx     # main page
    auth.tsx      # authentication logic
  /components     # reusable UI components
  /utils          # helper functions

7. Demo (Optional)

Add screenshots of the login/Windows Hello prompt

Add a GIF of the step-up auth flow

8. Contributing

Pull request workflow

Branch naming conventions (if needed)

9. License

Choose one (MIT, Apache 2.0, etc.). If academic, just say for educational purposes only.