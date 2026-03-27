# NovaAura Tiered Domain Pricing

## Overview

Two-tier pricing strategy based on user subscription level:

| Tier | Markup | Target Users | Best For |
|------|--------|--------------|----------|
| **Standard** | Flat $2 | Free/Basic users | Cheap domains (.com, .xyz) |
| **Premium** | 15% on premium domains | Paid subscribers | High-value domains (.ai, premiums) |

---

## Standard Tier (Flat $2)

**Simple, predictable pricing for everyone.**

The $2 flat fee covers:
- Platform fee: $0.75 (infrastructure)
- Sourcing tax: $1.25 (procurement overhead)

### Examples:
| Domain | Base Price | Your Cost | You Pay | Profit |
|--------|-----------|-----------|---------|--------|
| .com | $9.50 | $11.50 | $11.50 | $2.00 |
| .xyz | $7.00 | $9.00 | $9.00 | $2.00 |
| .io | $32.00 | $34.00 | $34.00 | $2.00 |
| .net | $10.50 | $12.50 | $12.50 | $2.00 |

**Best for:** Budget-conscious users, personal projects, small businesses

---

## Premium Tier (15% on Premium Domains)

**Higher revenue on high-value transactions.**

Premium domains = base price >$50 OR registry flagged as premium

### Examples:
| Domain | Base Price | Tier | Fee | Total | vs Flat |
|--------|-----------|------|-----|-------|---------|
| .ai | $65.00 | Standard | $2.00 | $67.00 | — |
| .ai | $65.00 | Premium | $9.75 (15%) | $74.75 | **+$7.75** |
| .store | $35.00 | Standard | $2.00 | $37.00 | — |
| .store | $35.00 | Premium | $2.00 | $37.00 | Same (not premium) |
| Premium* | $500.00 | Standard | $2.00 | $502.00 | — |
| Premium* | $500.00 | Premium | $75.00 (15%) | $575.00 | **+$73.00** |

*Registry premium domains

**Best for:** Enterprise users, domain investors, high-value purchases

---

## Why This Works

### Standard Tier ($2 flat)
```
User buys .com for $11.50
→ Simple, predictable
→ No confusion
→ Good for budget users
```

### Premium Tier (15%)
```
User buys .ai for $74.75 (was $67 on flat fee)
→ You make $7.75 MORE
→ User is premium subscriber (pays monthly)
→ High-value domain = justified fee
```

### Ultra Premium (15% scales)
```
User buys registry premium for $575 (base $500)
→ You make $75 fee vs $2 flat = $73 MORE
→ Scales with domain value
→ Enterprise customers expect percentage fees
```

---

## Implementation

```typescript
// Backend logic
const PREMIUM_THRESHOLD = 50;
const FLAT_FEE = 2.00;
const PREMIUM_PCT = 0.15;

function applyFees(basePrice: number, userTier: string) {
  const isPremium = basePrice > PREMIUM_THRESHOLD;
  
  if (userTier === 'premium' && isPremium) {
    // 15% on premium domains
    return basePrice * 1.15;
  }
  
  // Flat $2 for everything else
  return basePrice + FLAT_FEE;
}
```

---

## API Response

```json
{
  "domain": "startup.ai",
  "basePrice": 65.00,
  "standardTier": {
    "total": 67.00,
    "markupType": "flat",
    "fee": 2.00
  },
  "premiumTier": {
    "total": 74.75,
    "markupType": "percentage",
    "fee": 9.75
  },
  "yourPrice": 74.75,
  "yourTier": "premium"
}
```

---

## Migration Path

1. **All users start on Standard** ($2 flat)
2. **Upgrade to Premium** for advanced features + tiered pricing
3. **Premium users get**: 15% on premiums, flat on standard
4. **Standard users keep**: Flat $2 on everything

**Everyone wins:**
- Standard users get simple pricing
- Premium users get better features
- You get higher revenue on high-value domains
