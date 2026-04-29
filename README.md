# Fynn.AI — AI-Native Revenue Intelligence for SMBs

**Live Demo:** [fynn-ai-theta.vercel.app](https://fynn-ai-theta.vercel.app)

Fynn is an AI-powered revenue intelligence platform that helps small and mid-market businesses detect revenue leakage, predict client churn, recover unpaid invoices, and forecast cash position — all from their existing accounting data.

## What it does

- **Revenue leakage detection** — Scans invoice and payment patterns to identify under-billing, missed charges, and systematic revenue loss
- **Invoice recovery** — AI-generated recovery emails with context-aware messaging tailored to each overdue account
- **Cash flow forecasting** — Predictive models for cash position based on historical payment behavior and AR aging
- **Tax reserve calculation** — Automated tax liability estimation based on transaction patterns
- **Profitability analysis** — Client and service-level profitability breakdown
- **Weekly AI briefing** — Automated executive summary of financial health, risks, and recommended actions

## QuickBooks Integration

Fynn connects directly to **Intuit QuickBooks Online** via OAuth 2.0, pulling live accounting data for AI analysis.

**Integration architecture:**

```
QuickBooks Online (Sandbox)
        │
        ▼
  OAuth 2.0 Handshake (/api/auth/quickbooks)
        │
        ▼
  QB API Client (lib/quickbooks.ts)
  ├── getInvoices()
  ├── getCustomers()
  ├── getPayments()
  ├── getOverdueInvoices()
  └── getARAgingSummary()
        │
        ▼
  AI Analysis Layer (Claude API)
  ├── Churn prediction
  ├── Under-billing detection
  ├── Collection risk scoring
  └── Payment pattern analysis
        │
        ▼
  Dashboard (Next.js + Tailwind)
```

**QB API endpoints consumed:**
- `Invoice` — TxnDate, DueDate, Amount, Balance, CustomerRef, Line items → drives late payment prediction and under-billing detection
- `Customer` — profiles, balances, transaction history → feeds churn prediction
- `Payment` — payment patterns, amounts, dates → feeds collection risk scoring
- `ARAgingSummary` — aging buckets → feeds AR intelligence dashboard

**Intuit Developer Program:** Built on the Intuit App Partner Program (Builder tier), targeting the QuickBooks Online and Intuit Enterprise Suite ecosystem.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI/ML | Anthropic Claude API |
| Accounting integration | Intuit QuickBooks Online API (OAuth 2.0) |
| Auth | Clerk |
| Deployment | Vercel |

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/quickbooks/    # OAuth 2.0 flow with Intuit
│   │   ├── qb/                 # QB data endpoints
│   │   ├── briefing/           # AI weekly briefing
│   │   ├── dashboard/          # KPI aggregation
│   │   ├── forecast/           # Cash flow prediction
│   │   ├── leakage/            # Revenue leak detection
│   │   ├── profitability/      # Client profitability
│   │   ├── recovery/           # Invoice recovery
│   │   ├── tax/                # Tax reserve calculation
│   │   └── transactions/       # Transaction processing
│   └── dashboard/              # Dashboard UI pages
├── components/                 # Reusable UI components
└── lib/
    └── quickbooks.ts           # QB API client wrapper
```

## Getting started

```bash
# Clone the repository
git clone https://github.com/ApuroopM1/Fynn.AI.git
cd Fynn.AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase, Clerk, Anthropic, and QuickBooks API keys

# Run development server
npm run dev
```

**Required environment variables:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
CLERK_SECRET_KEY=
QB_CLIENT_ID=           # From Intuit Developer Portal
QB_CLIENT_SECRET=       # From Intuit Developer Portal
QB_REDIRECT_URI=        # OAuth callback URL
QB_SANDBOX_BASE_URL=    # https://sandbox-quickbooks.api.intuit.com
QB_REALM_ID=            # QuickBooks company ID
```

## Why this exists

Revenue leakage is a silent problem for SMBs. Most businesses lose 1-5% of revenue to under-billing, missed invoices, and poor collection practices — but they don't have the tools or time to detect it. Fynn brings enterprise-grade revenue intelligence to businesses that run on QuickBooks, using AI to surface insights that would take a finance team weeks to uncover.

## Author

**Apuroop M** — Product management leader with 16+ years in enterprise PM across BFSI, Telecom, HCM, Healthcare, and SaaS. Building at the intersection of AI and financial operations.

- [LinkedIn](https://www.linkedin.com/in/apuroopm/)
- [GitHub](https://github.com/ApuroopM1)