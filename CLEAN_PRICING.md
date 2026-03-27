# NovaAura Clean Domain Pricing

## Simple, Transparent Pricing

No hidden fees. No platform fees exposed. Just one clean price.

---

## The Rules

### 1. **.COM Domains: Always 15%**
All users (Standard & Premium tiers) pay 15% markup on .com domains.

| Base Price | Your Price | Markup |
|-----------|-----------|--------|
| $9.50 | $10.93 | 15% |

**Why?** .com is our bread & butter. 15% on every .com = steady revenue.

---

### 2. **Other Domains: Tiered**

**Standard Tier (Free/Basic):**
- Flat $2 markup on ALL non-.com domains

| Domain | Base | Your Price |
|--------|------|-----------|
| .xyz ($7) | +$2 | $9 |
| .io ($32) | +$2 | $34 |
| .ai ($65) | +$2 | $67 |

**Premium Tier (Paid):**
- 15% on premium domains (base >$50)
- Flat $2 on standard domains (base ≤$50)

| Domain | Base | Your Price |
|--------|------|-----------|
| .xyz ($7) | +$2 | $9 |
| .io ($32) | +$2 | $34 |
| .ai ($65) | 15% | $74.75 |

---

## Examples

### Standard Tier User
```
Buying myapp.com:
  Base: $9.50
  You pay: $10.93 (15%)

Buying myapp.ai:
  Base: $65.00
  You pay: $67.00 (+$2 flat)
```

### Premium Tier User
```
Buying myapp.com:
  Base: $9.50
  You pay: $10.93 (15%)

Buying myapp.ai:
  Base: $65.00
  You pay: $74.75 (15%)
  → We make $7.75 more than standard tier!
```

---

## API Response (Clean)

```json
{
  "domain": "startup.com",
  "basePrice": 9.50,
  "totalPrice": 10.93,
  "available": true
}
```

No fee breakdown. No platform fee. No sourcing tax. Just one price.

---

## Revenue Model

**Standard Tier:**
- .com: 15% (~$1.43 per domain)
- Other: $2 flat

**Premium Tier:**
- .com: 15% (~$1.43 per domain)
- Premium domains (>$50): 15% (scales with price!)
- Standard domains: $2 flat

**The Win:**
- Premium user buying $500 registry premium:
  - Standard tier: $502 (we make $2)
  - Premium tier: $575 (we make $75!)
  - **Difference: $73 more revenue!**

---

## Backend Logic

```typescript
const COM_MARKUP_PCT = 0.15;
const PREMIUM_MARKUP_PCT = 0.15;
const FLAT_FEE = 2.00;

function getPrice(basePrice: number, tld: string, userTier: string) {
  // .com: Always 15% (both tiers)
  if (tld === 'com') {
    return basePrice * 1.15;
  }
  
  // Premium tier + expensive domain: 15%
  if (userTier === 'premium' && basePrice > 50) {
    return basePrice * 1.15;
  }
  
  // Everything else: flat $2
  return basePrice + 2.00;
}
```

---

## Customer Experience

**What they see:**
```
startup.com
$10.93/year
Available ✓
```

**What they DON'T see:**
- ❌ Platform fee: $0.75
- ❌ Sourcing tax: $1.25
- ❌ Fee breakdown
- ❌ Markup explanation

Just a clean, simple price. Like it should be.
