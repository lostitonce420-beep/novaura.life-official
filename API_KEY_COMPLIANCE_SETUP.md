# API Key Compliance Setup

## Overview

This document explains how NovAura Platform complies with company policy requiring **indirect API key references**.

## Problem

Company policy prohibits:
- ❌ Hardcoded API keys in source code
- ❌ Service account keys in repositories
- ❌ Direct API key usage without audit trail

## Solution

We use a **Key Registry** system that:
- ✅ References keys by ID (e.g., `ai.gemini.primary`)
- ✅ Stores actual values in Firebase Functions Config only
- ✅ Provides complete audit logging
- ✅ Supports key rotation without code changes

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────→│  Firebase        │────→│  AI Providers   │
│   (No keys)     │     │  Functions       │     │  (Gemini, etc.) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ↓
                        ┌──────────────────┐
                        │  Key Registry    │
                        │  - ID-based refs │
                        │  - Audit logging │
                        └──────────────────┘
                               │
                               ↓
                        ┌──────────────────┐
                        │  Firebase Config │
                        │  (Secure store)  │
                        └──────────────────┘
```

## Key Registry

Located in: `NovAura-WebOS/platform/functions/src/services/keyRegistry.ts`

### Registered Keys

| Key ID | Path in Config | Purpose | Guest Access |
|--------|----------------|---------|--------------|
| `ai.gemini.primary` | `ai.gemini_api_key` | Gemini AI | ✅ Yes |
| `ai.claude.primary` | `ai.claude_api_key` | Claude AI | ❌ Auth only |
| `ai.openai.primary` | `ai.openai_api_key` | OpenAI GPT | ❌ Auth only |
| `ai.kimi.primary` | `ai.kimi_api_key` | Kimi AI | ✅ Yes |
| `ai.vertex.primary` | `ai.vertex_api_key` | Vertex AI | ✅ Yes |
| `domains.namecom.api_token` | `domains.namecom_api_token` | Domain API | ❌ Auth only |
| `payments.stripe.secret` | `stripe.secret_key` | Payments | ❌ Auth only |

## Usage

### Resolving a Key (Backend Only)

```typescript
import keyRegistry from './services/keyRegistry';

// Resolve by ID - returns key from Firebase Config
const result = await keyRegistry.resolveKey('ai.gemini.primary', {
  userId: 'user123',
  ipAddress: req.ip,
});

// Use the key
const apiKey = result.value;
```

### Frontend Proxy Call

```typescript
// Frontend NEVER sees the API key
const response = await fetch('/api/ai/gemini', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello' })
});
```

## Setting Keys

```bash
cd NovAura-WebOS/platform/functions

# Set a key
firebase functions:config:set ai.gemini_api_key="YOUR_KEY_HERE"

# Verify
firebase functions:config:get

# Deploy
firebase deploy --only functions
```

## Audit Logging

All key access is logged to Firestore:

```typescript
// Automatic logging on every resolve/use
{
  timestamp: Timestamp,
  key_id: 'ai.gemini.primary',
  key_path: 'ai.gemini_api_key',
  action: 'resolve' | 'use',
  user_id: 'user123',
  ip_address: '192.168.1.1',
  success: true,
  request_id: 'unique-id'
}
```

View logs:
- Firebase Console → Firestore → `api_key_audit_logs`
- Or admin API: `GET /admin/audit-logs`

## Compliance Checklist

- [x] No keys in source code
- [x] Indirect references only (key IDs)
- [x] Keys stored in Firebase Config
- [x] Complete audit trail
- [x] Access controls (auth required for sensitive keys)
- [x] Key rotation support
- [x] Cache with TTL (5 minutes)

## Removed Components

The following were removed as part of this compliance update:

| Removed | Reason | Replacement |
|---------|--------|-------------|
| `novaura-api/` (root) | Cloudflare Workers | Firebase Functions |
| `platform/novaura-api/` | Wrangler-based | Firebase Functions |
| Old audit files | Outdated | New JSON audit |
| Hardcoded key refs | Policy violation | Key Registry |

## Files Added/Modified

```
NovAura-WebOS/platform/functions/
├── package.json                    # Firebase Functions deps
├── tsconfig.json                   # TypeScript config
├── .gitignore                      # Excludes .env
├── SETUP_KEYS.md                  # Setup instructions
└── src/
    ├── index.ts                   # Main functions (AI proxy)
    └── services/
        └── keyRegistry.ts         # Key Registry service
```

## Next Steps

1. Set API keys in Firebase Config (see SETUP_KEYS.md)
2. Deploy Firebase Functions
3. Update frontend to use proxy endpoints
4. Remove any VITE_ prefixed API keys from frontend .env
5. Monitor audit logs regularly
