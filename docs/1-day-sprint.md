# 1-Day Sprint: Critical Features

## What We Built

### 1. Command Palette (4 hours)
**File:** `src/components/CommandPalette.jsx`

**Features:**
- Global Cmd+K / Ctrl+K shortcut
- Fuzzy search through commands
- 12 pre-built commands
- Window/app launcher
- Theme toggle
- Logout

**Commands Available:**
- Open IDE, Terminal, Browser, Git, Database, Files
- Open Secrets Manager, Settings, Profile, Billing
- New File, Dark Mode toggle, Logout

**Usage:**
```jsx
// In any component
const { isOpen, open, close } = useCommandPalette();

// Or just press Cmd+K
```

---

### 2. Secrets Manager (3 hours)
**File:** `src/components/windows/SecretsWindow.jsx`

**Features:**
- Local storage with XOR encryption
- Add/delete secrets
- Show/hide values
- Copy to clipboard
- Scope: global or per-project

**UI:**
- List view with encrypted values
- "Show" button to decrypt
- Copy button
- Delete button
- BYOK notice banner

**Storage:**
```javascript
localStorage.setItem('novaura-secrets', JSON.stringify(secrets));
// Encrypted with simple XOR (replace with AES in production)
```

---

### 3. Git UI (3 hours)
**File:** `src/components/windows/GitWindow.jsx`

**Features:**
- 3 tabs: Status, Commits, Branches
- File status view (modified, staged, untracked)
- Checkboxes to stage files
- Commit message input
- Commit history with graph
- Branch list
- Pull/Push buttons

**Mock Data:**
- Pre-populated with example files
- Example commit history
- Example branches

**Future Integration:**
```javascript
// Replace MOCK_STATUS with:
const status = await fetch('/api/git/status');
const commits = await fetch('/api/git/log');
const branches = await fetch('/api/git/branches');
```

---

### 4. Payment/Billing (2 hours)
**File:** `src/components/windows/BillingWindow.jsx`

**Features:**
- 4 plan cards (Free, Starter, Builder, Pro)
- Monthly/yearly toggle
- Usage bars (free tier)
- Stripe integration ready
- Enterprise CTA

**Plans:**
| Plan | Price | Context | Calls |
|------|-------|---------|-------|
| Free | $0 | 4K | 7/day |
| Starter | $15 | 8K | 50/day |
| Builder | $30 | 16K | 200/day |
| Pro | $75 | 128K | Unlimited |

**Stripe Integration:**
```javascript
// Replace mock with:
const stripe = await loadStripe('pk_live_...');
await stripe.redirectToCheckout({
  priceId: plan.priceId,
  successUrl: window.location.origin + '/billing?success=true',
  cancelUrl: window.location.origin + '/billing?canceled=true',
});
```

---

## Integration

### App.jsx Changes
1. Added `useCommandPalette` hook
2. Added `<CommandPalette />` component
3. Mapped commands to `openWindow()` calls
4. Added window types to `getWindowTitle()`

### WindowManager.jsx Changes
1. Imported new windows
2. Added to `windowComponents` map
3. Added default sizes

---

## Testing

### Command Palette
1. Press Cmd+K (Mac) or Ctrl+K (Windows)
2. Type "ide" and press Enter
3. IDE window should open

### Secrets Manager
1. Open Command Palette
2. Select "Secrets Manager"
3. Click "Add Secret"
4. Enter name and value
5. Click "Save"

### Git UI
1. Open Command Palette  
2. Select "Open Git"
3. See file status
4. Check some files
5. Enter commit message
6. Click "Commit"

### Billing
1. Open Command Palette
2. Select "Billing"
3. Toggle monthly/yearly
4. Click "Subscribe" on any plan

---

## What's Missing (Production)

### Command Palette
- [ ] Recent commands persistence
- [ ] File search integration
- [ ] Settings search
- [ ] Action execution (not just window open)
- [ ] Custom commands

### Secrets Manager
- [ ] Real encryption (AES-256-GCM)
- [ ] Server-side storage option
- [ ] Environment variable injection
- [ ] Secret versioning
- [ ] Access logs

### Git UI
- [ ] Real git integration (isomorphic-git or backend)
- [ ] Diff viewer
- [ ] Branch creation/deletion
- [ ] Merge conflict resolution
- [ ] Remote management

### Billing
- [ ] Stripe webhook handling
- [ ] Subscription management
- [ ] Usage metering
- [ ] Invoice generation
- [ ] Payment method management

---

## Time Breakdown

| Feature | Time | Lines of Code |
|---------|------|---------------|
| Command Palette | 4h | ~200 |
| Secrets Manager | 3h | ~250 |
| Git UI | 3h | ~350 |
| Billing | 2h | ~300 |
| Integration | 2h | ~100 |
| **Total** | **14h** | **~1200** |

Compressed to 1 day with:
- Pre-built UI components (shadcn)
- Mock data instead of real APIs
- Simple encryption (XOR vs AES)
- No backend changes needed

---

## Next Steps

1. **Backend APIs** for git operations
2. **Stripe webhooks** for billing
3. **Real encryption** for secrets
4. **Command palette** extensions
5. **Testing** with real users
