# lif.os

Private, offline-first health tracker. Blood tests and medical notes are encrypted with AES-256 on-device; nothing is sent to the cloud.

## Repo layout

```
lif.os/
├── mobile/          ← React Native + Expo app (phone)
├── docs/            ← Design/spec reference documents
└── .gitignore
```

The web/desktop app, cloud sync (Supabase), local AI (Gemma/Ollama) and reports are planned for later phases. See `docs/INDEX.md`.

## Run the phone app

Requirements: Node 18+, the **Expo Go** app on your phone, and your phone on the same Wi-Fi as this computer.

```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go. On first launch you'll create a passcode — it derives the AES-256 key that encrypts your medical data.

Useful commands:

```bash
npm run lint       # eslint
npx tsc --noEmit   # typecheck
npx expo start     # dev server (same as npm start)
```

## What's implemented (MVP)

- Passcode setup / unlock / lock / change passcode (PBKDF2 key derivation, AES-256 encryption)
- Blood test logging with photo capture — values + notes encrypted at rest
- Daily metrics (steps, sleep, resting HR, weight, stress, recovery score)
- Meal logging with macros and photo
- Workout logging with intensity
- Dashboard with recovery card, alerts (reference ranges), and trends (recovery / weight / steps)
- JSON export (decrypted) via the system share sheet
- Light/dark/system theme

## Architecture notes

- `mobile/services/encryption.ts` — key derivation and AES-256 (crypto-js + expo-crypto)
- `mobile/services/database.ts` — SQLite schema + migrations (expo-sqlite)
- `mobile/services/*-service.ts` — data access per domain
- `mobile/stores/` — zustand stores for auth, data, and settings
- `mobile/app/` — expo-router screens (`(auth)` gating + `(tabs)`)

## Security

- Blood test values and notes are AES-256 encrypted before reaching SQLite.
- The passcode and derived key never leave the device.
- Forgetting the passcode makes encrypted data unrecoverable by design.
