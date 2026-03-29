# NovAura WebOS - Replit Deployment

## Active-Active Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │  (DNS/Load Bal) │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    www.novaura.life   novaura.life    (fallback)
            │                │                │
    ┌───────▼────────┐ ┌────▼────────┐ ┌──────▼──────┐
    │    Replit      │ │  Firebase   │ │   Backup    │
    │   (Instance 1) │ │ (Instance 2)│ │   (Replit)  │
    └───────┬────────┘ └────┬────────┘ └──────┬──────┘
            │               │                  │
            └───────────────┼──────────────────┘
                            │
            ┌───────────────▼──────────────────┐
            │   Shared Infrastructure          │
            │  • Firebase Auth (users/sessions)│
            │  • PostgreSQL (app state/data)   │
            │  • Firebase Storage (files)      │
            │  • Firebase Functions (API/AI)   │
            └──────────────────────────────────┘
```

## What Gets Synced

| Data | Storage | Sync Status |
|------|---------|-------------|
| User accounts | Firebase Auth | ✅ Automatic |
| Sessions | Cookie + Firebase | ✅ Shared |
| App state (windows, files) | PostgreSQL | ✅ Real-time |
| User uploads | Firebase Storage | ✅ Both access |
| AI chat history | PostgreSQL | ✅ Real-time |
| IDE projects | PostgreSQL | ✅ Real-time |

## Deploy to Replit

1. **Import from GitHub** on Replit
2. **Set environment variables** from `.env.replit`
3. **Configure PostgreSQL**:
   ```bash
   # In Replit shell
   echo "DATABASE_URL=$REPLIT_DB_URL" >> .env
   ```
4. **Run**:
   ```bash
   npm install
   npm run dev
   ```

## Domain Setup

### Cloudflare DNS:
```
Type    Name        Content                    TTL
A       @           (Firebase IP)              Auto
CNAME   www         (Replit deployment URL)    Auto
```

### Firebase Hosting:
- Custom domain: `novaura.life` (bare domain)
- Add `www.novaura.life` as redirect OR separate site

## Failover

If Firebase goes down:
- Change Cloudflare A record for `@` to point to Replit
- Users access via `novaura.life` → Replit

If Replit goes down:
- Cloudflare already routes `@` to Firebase
- `www.novaura.life` might be down but bare domain works

Both down? 
- You're having a really bad day 😂
