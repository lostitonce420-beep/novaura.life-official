# 🚀 PRE-LAUNCH API AUDIT CHECKLIST
## For 192k Member Launch - Tonight!

---

## ⚠️ CRITICAL: Backend API Keys (Cloudflare Workers)

These MUST be set via `wrangler secret put` before launch:

### 🤖 AI Providers (At least ONE required)
| Key | Service | Status | Endpoint Test |
|-----|---------|--------|---------------|
| `GEMINI_API_KEY` | Google Gemini | ⬜ NEEDS CHECK | POST /ai/chat |
| `CLAUDE_API_KEY` | Anthropic Claude | ⬜ NEEDS CHECK | POST /ai/chat |
| `OPENAI_API_KEY` | OpenAI GPT-4o | ⬜ NEEDS CHECK | POST /ai/chat |
| `KIMI_API_KEY` | Moonshot AI | ⬜ NEEDS CHECK | POST /ai/chat |
| `VERTEX_AI_KEY` + `VERTEX_PROJECT_ID` | Google Vertex AI | ⬜ NEEDS CHECK | POST /ai/image |
| `AIML_API_KEY` | Unified AI/ML Gateway | ⬜ NEEDS CHECK | POST /ai/chat |

**Quick Test Command:**
```bash
curl https://novaura-api.polsia.app/health
```

### 🌐 Domain Registration (Name.com)
| Key | Service | Status |
|-----|---------|--------|
| `NAMECOM_USERNAME` | Name.com API Username | ⬜ NEEDS CHECK |
| `NAMECOM_API_TOKEN` | Name.com API Token | ⬜ NEEDS CHECK |

**Quick Test:**
```bash
curl https://novaura-api.polsia.app/domains/status
```

### 🔧 Infrastructure
| Key | Service | Status |
|-----|---------|--------|
| `DATABASE_URL` | Database Connection | ⬜ NEEDS CHECK |
| `JWT_SECRET` | JWT Signing | ⬜ NEEDS CHECK |
| `FRONTEND_URL` | CORS Origin | ⬜ NEEDS CHECK |

---

## ⚠️ FRONTEND ENV Variables (.env file)

### 🔥 Firebase (REQUIRED for Firestore hosting)
```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=novaura-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=novaura-xxx
VITE_FIREBASE_STORAGE_BUCKET=novaura-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
VITE_FCM_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_FCM_SENDER_ID=123456789
VITE_FCM_VAPID_KEY=your_vapid_key
```

### 🔌 Backend Connection
```env
VITE_BACKEND_URL=https://novaura-api.polsia.app
# OR for local:
# VITE_BACKEND_URL=http://localhost:3000
```

### 🛍️ Third-Party Services (Optional but Recommended)
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=your_token  # For Catalyst's Corner store
VITE_GEMINI_API_KEY=optional_for_direct  # Only if using direct Gemini Live
```

---

## 🔍 VERIFICATION COMMANDS

### 1. Health Check (Run This First!)
```bash
curl https://novaura-api.polsia.app/health
curl https://novaura-api.polsia.app/api/health
```
**Expected:** `{"status":"ok","providers":{"gemini":true,...}}`

### 2. Test AI Chat
```bash
curl -X POST https://novaura-api.polsia.app/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello","provider":"gemini"}'
```

### 3. Test Domain Status
```bash
curl https://novaura-api.polsia.app/domains/status
```

### 4. Test Provider Status
```bash
curl https://novaura-api.polsia.app/ai/providers
curl https://novaura-api.polsia.app/ai/limits
```

---

## ✅ PRE-LAUNCH CHECKLIST

### Backend (Cloudflare Workers)
- [ ] `wrangler secret put DATABASE_URL`
- [ ] `wrangler secret put JWT_SECRET`
- [ ] Set `FRONTEND_URL` in wrangler.toml
- [ ] **At least ONE AI key configured:**
  - [ ] `wrangler secret put GEMINI_API_KEY` (Recommended primary)
  - [ ] `wrangler secret put CLAUDE_API_KEY` (Backup)
  - [ ] `wrangler secret put OPENAI_API_KEY` (Backup)
  - [ ] `wrangler secret put KIMI_API_KEY` (Backup)
- [ ] `wrangler secret put VERTEX_AI_KEY` (For image generation)
- [ ] `wrangler secret put VERTEX_PROJECT_ID`
- [ ] `wrangler secret put NAMECOM_USERNAME` (For domains)
- [ ] `wrangler secret put NAMECOM_API_TOKEN`
- [ ] Deploy: `wrangler deploy`

### Frontend (Firebase/Firestore)
- [ ] All VITE_FIREBASE_* variables set
- [ ] VITE_BACKEND_URL points to production API
- [ ] Build succeeds: `npm run build`
- [ ] Deploy to Firebase: `firebase deploy`

### Post-Deploy Verification
- [ ] Health endpoint returns OK
- [ ] AI chat responds (test each provider)
- [ ] Domain check works
- [ ] Firebase Auth works
- [ ] Firestore database accessible

---

## 🚨 KNOWN ISSUES / WATCH OUT FOR

1. **Stripe Integration** - NOT fully implemented (mock only)
2. **PixAI** - Requires user-provided API key (frontend only)
3. **AIML_API** - Alternative gateway, may replace individual AI keys
4. **Vertex AI Image Gen** - Requires BOTH key AND project ID

---

## 📊 CURRENT API COVERAGE

| Feature | Backend Route | Status |
|---------|--------------|--------|
| Chat (Gemini) | POST /ai/chat | ✅ Wired |
| Chat (Claude) | POST /ai/chat | ✅ Wired |
| Chat (OpenAI) | POST /ai/chat | ✅ Wired |
| Chat (Kimi) | POST /ai/chat | ✅ Wired |
| Image Gen | POST /ai/image | ✅ Wired (Vertex) |
| Live Key | GET /ai/live-key | ✅ Wired |
| Domain Check | POST /domains/check | ✅ Wired |
| Domain Register | POST /domains/register | ✅ Wired |
| Domain Status | GET /domains/status | ✅ Wired |
| Auth | /auth/* | ✅ Wired |
| Assets | /assets/* | ✅ Wired |
| Orders | /orders/* | ✅ Wired |
| Health | /health | ✅ Wired |

---

## 🆘 EMERGENCY CONTACTS / ROLLBACK

If APIs fail during launch:
1. Check Cloudflare Workers dashboard logs
2. Verify secrets: `wrangler secret list`
3. Quick rollback: `wrangler rollback`
4. Firebase rollback via Firebase Console

---

**Last Updated:** 2026-03-26  
**Launch Ready:** ⬜ PENDING API KEY VERIFICATION
