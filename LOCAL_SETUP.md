# 🖥️ Novaura Web OS - Local Development Setup

## Quick Start (5 minutes)

### 1. Prerequisites
- **Node.js** v18+ (https://nodejs.org)
- **Git** (https://git-scm.com)

### 2. Install Dependencies

```bash
cd "z:\Novaura platform\NovAura-WebOS"
npm install
```

### 3. Environment Setup

Create `.env` file in `NovAura-WebOS/`:
```bash
VITE_BACKEND_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

The app will open at: **http://localhost:5173**

---

## 🔧 Backend Setup (Optional)

If you want the full stack locally:

### 1. Navigate to API
```bash
cd "z:\Novaura platform\novaura-api"
```

### 2. Install & Run
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
# - DATABASE_URL (use local SQLite for dev)
# - NAMECOM_API_TOKEN
# - GEMINI_API_KEY

# Run dev server
npm run dev
```

Backend runs at: **http://localhost:3000**

---

## 📁 Project Structure

```
NovAura-WebOS/
├── src/
│   ├── components/          # React components
│   │   ├── windows/        # All app windows
│   │   ├── ui/             # Shadcn UI components
│   │   ├── OnboardingWizard.jsx
│   │   ├── PricingPage.jsx
│   │   └── ...
│   ├── App.jsx             # Main app entry
│   ├── main.jsx            # Vite entry
│   └── index.css           # Global styles + themes
├── public/                 # Static assets
├── package.json
└── vite.config.js
```

---

## 🎨 Available Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🌐 Access Points

Once running:
- **Web OS**: http://localhost:5173
- **Pricing Page**: Open Settings → Billing (or add window type 'pricing')
- **Onboarding**: Clear localStorage to see again
- **Personalization**: Settings → Themes

---

## 🐛 Troubleshooting

### Port 5173 in use?
```bash
npm run dev -- --port 3000
```

### Hot reload not working?
- Check Windows Defender isn't blocking
- Try: `npm run dev -- --host`

### Build errors?
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

---

## 🚀 Production Build

```bash
# Build static files
npm run build

# Output in dist/ folder
# Upload to: Name.com, Vercel, Netlify, etc.
```

---

## 🔗 Quick Links in App

I've added a **Pricing** window you can open:
- Via Settings → Billing
- Or programmatically: `openWindow('pricing', 'Pricing')`

The pricing page shows:
- All 5 tiers with new prices
- Monthly/Yearly toggle
- Feature comparisons
- Trust signals
- CTA buttons

---

## 📊 Updated Pricing Summary

| Tier | Price | Original | Margin |
|------|-------|----------|--------|
| Starter | $14.99 | $29.99 | 85% |
| Builder | $29.99 | $59.99 | 85% |
| Pro | $75.00 | $99.99 | 70% |
| Studio | $149.99 | $199.99 | 65% |
| Enterprise | $349.99 | $499.99 | 75% |

**Launch Special: 50% off first month!**

---

## ✅ What's Connected

- ✅ Onboarding Wizard (shows on first visit)
- ✅ Pricing Page (full-featured, 5 tiers)
- ✅ Tips Widget (rotating hints)
- ✅ Help Button (keyboard shortcuts)
- ✅ Personalization (themes + taskbar)
- ✅ 50+ App Windows
- ✅ Local AI via Ollama (optional)

---

**Ready to launch?** Run `npm run dev` and test everything! 🚀
