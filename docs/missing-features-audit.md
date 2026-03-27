# Novaura Missing Features Audit

## Date: March 2026
## Status: Pre-Launch Checklist

---

## CRITICAL - Needed for MVP

### 1. Command Palette (Global)
**Status:** UI component exists, NOT integrated

**What's Missing:**
- Global keyboard shortcut (Cmd+K / Ctrl+K)
- Command registry system
- Window/app launcher
- Settings search
- File search

**Implementation:** 4-6 hours

---

### 2. Secrets Manager
**Status:** NOT IMPLEMENTED

**What's Missing:**
- UI for managing env variables
- Encryption at rest
- Per-project secrets
- BYOK API key storage (for Pro tier)

**Implementation:** 1-2 days

---

### 3. Git UI
**Status:** Mentioned but NO dedicated interface

**What's Missing:**
- Visual commit history
- Branch management
- Diff viewer
- Merge conflict resolution
- Push/pull buttons

**Implementation:** 2-3 days

---

### 4. Real-Time Collaboration
**Status:** Mentioned in analysis, NOT IMPLEMENTED

**What's Missing:**
- WebSocket infrastructure
- Cursor presence
- Live editing
- Conflict resolution

**Implementation:** 1 week

---

### 5. Database UI
**Status:** NOT IMPLEMENTED

**What's Missing:**
- Table browser
- Query editor
- Connection management
- Schema viewer

**Implementation:** 2-3 days

---

## HIGH PRIORITY - Needed for Launch

### 6. Deployment Pipeline
**Status:** Partial (domain registration exists)

**What's Missing:**
- One-click deploy to hosting
- Build process UI
- Deployment logs
- Rollback capability

**Implementation:** 2-3 days

---

### 7. Payment/Billing System
**Status:** Pricing defined, NO implementation

**What's Missing:**
- Stripe integration
- Subscription management
- Usage tracking
- Invoice generation

**Implementation:** 3-4 days

---

### 8. Email Service
**Status:** Signature exists, NO service

**What's Missing:**
- Transactional emails
- Email templates
- SendGrid/AWS SES integration

**Implementation:** 1 day

---

### 9. Admin Dashboard
**Status:** Window exists, NEEDS features

**What's Missing:**
- User management
- Analytics/stats
- System health
- Content moderation

**Implementation:** 2-3 days

---

## MEDIUM PRIORITY - Post-Launch

### 10. Template System Integration
**Status:** Templates defined, NO UI

**Implementation:** 2 days

---

### 11. API Keys Management
**Status:** BYOK mentioned, NO UI

**Implementation:** 1-2 days

---

### 12. Search (Global)
**Status:** Command palette only

**Implementation:** 2-3 days

---

### 13. Notifications System
**Status:** Window exists, NEEDS backend

**Implementation:** 1-2 days

---

### 14. Keyboard Shortcuts Help
**Status:** NOT IMPLEMENTED

**Implementation:** 4-6 hours

---

## Summary

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| Command Palette | Partial | Critical | 4-6h |
| Secrets Manager | Missing | Critical | 1-2d |
| Git UI | Missing | Critical | 2-3d |
| Real-time Collab | Missing | Critical | 1w |
| Database UI | Missing | Critical | 2-3d |
| Deployment | Partial | High | 2-3d |
| Payment/Billing | Missing | High | 3-4d |
| Email Service | Missing | High | 1d |
| Admin Dashboard | Partial | High | 2-3d |
| Templates | Missing | Medium | 2d |
| API Keys | Missing | Medium | 1-2d |
| Search | Missing | Medium | 2-3d |
| Notifications | Partial | Medium | 1-2d |

---

## Recommended Sprint Order

### Sprint 1 (Week 1)
1. Command Palette - Quick win
2. Secrets Manager - Required for BYOK
3. Git UI - Core developer feature

### Sprint 2 (Week 2)
4. Payment/Billing - Revenue unblocked
5. Email Service - User onboarding
6. Deployment Pipeline - Core feature

### Sprint 3 (Week 3)
7. Database UI - Data management
8. Admin Dashboard - Operations

### Sprint 4 (Week 4)
9. Real-time Collaboration - Big feature
10. Template Gallery - UX improvement

---

## What We Have (Complete)

### Core Platform
- Web OS with window system
- 50+ app windows
- Theme system (3 themes)
- User onboarding
- Personalization
- Tauri desktop app

### AI Systems
- Rate limiting by tier
- Context window management
- Engram RAG (9 markers x 9 emotions)
- Context catalog with retrieval strategies

### Backend
- Domain registration (Name.com)
- Authentication
- Asset management
- API structure

### Frontend
- React 19 + Vite
- Tailwind + Framer Motion
- shadcn/ui components
- Interactive backgrounds

---

## Bottom Line

**For MVP Launch:** Need Command Palette + Secrets Manager + Git UI + Payment system

**Time Estimate:** 2-3 weeks with 2 developers

**Biggest Risk:** Real-time collaboration (1 week effort, complex)
