# PixAI Security Fix - DEPLOYMENT CHECKLIST

## ✅ Changes Made

### 1. Frontend (`platform/src/services/pixaiService.js`)
- **REPLACED** direct PixAI API calls with backend proxy calls
- **REMOVED** all references to `VITE_PIXAI_API_KEY`
- **SECURED** all generation requests go through `/api/generation/*`
- **BACKUP CREATED** `pixaiService.old.js` (delete after deployment)

### 2. Backend (`functions/src/api/routes/generation.ts`)
- **ADDED** authentication middleware (`requireAuth`)
- **ADDED** rate limiting per user tier
- **ADDED** rate limit headers in responses
- **SECURED** PixAI API key only used server-side

### 3. Environment Variables
- **REMOVED** `VITE_PIXAI_API_KEY` from `platform/.env`
- **KEPT** `PIXAI_API_KEY` in `functions/.env` (server-side only)

---

## 🚀 Deployment Steps

### Step 1: Deploy Firebase Functions
```bash
cd "z:/Novaura platform/NovAura-WebOS/functions"
firebase deploy --only functions
```

### Step 2: Verify Functions Health
Check the Firebase Console > Functions to ensure no errors.

### Step 3: Test Generation
1. Open platform at `https://novaura.life`
2. Log in as test user
3. Try generating an image via TCG Card Forge
4. Verify it works without exposing API keys

### Step 4: Clean Up
Delete the backup file after confirming everything works:
```bash
rm "z:/Novaura platform/NovAura-WebOS/platform/src/services/pixaiService.old.js"
```

---

## 🔒 Security Improvements

| Before | After |
|--------|-------|
| API key in frontend bundle | API key only in backend |
| No authentication required | Firebase Auth required |
| No rate limiting | Rate limits per user tier |
| Direct PixAI API calls | Proxied through backend |
| Vulnerable to key theft | Keys never exposed |

---

## 📊 Rate Limits (Per User)

| Tier | Requests/Hour | Notes |
|------|---------------|-------|
| free | 100 | Generous for testing |
| basic | 500 | Casual users |
| pro | 2000 | Power users |
| unlimited | 10000 | Full PixAI capacity |

**Total capacity: 10,000/hour** - limits are just for abuse protection, not strict quotas.

---

## 🧪 Testing Commands

```bash
# Test with curl (replace TOKEN with actual Firebase ID token)
curl -X POST https://novaura.life/api/generation/image \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image"}'

# Should return: { success: true, taskId: "...", rateLimit: {...} }
```

---

## 🎯 Next Steps

1. ✅ Deploy functions
2. ✅ Test image generation
3. ✅ Monitor rate limits
4. ✅ Update documentation
5. 🔄 Consider adding Redis for distributed rate limiting

---

## ⚠️ Rollback Plan

If issues occur:
1. Restore old pixaiService.js: `mv pixaiService.old.js pixaiService.js`
2. Re-add VITE_PIXAI_API_KEY to platform/.env
3. Redeploy platform only
4. Debug and re-apply fix

---

**STATUS: READY TO DEPLOY**
