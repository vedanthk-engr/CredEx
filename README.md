# CREDEX — Cohort-Relative MSME Credit Intelligence Platform

CREDEX is a full-stack, AI-driven MSME Financial Health Card scoring platform built for credit-invisible businesses in India. It scores businesses relative to micro-cohorts (~800 peer archetypes based on NIC sector, location tier, vintage, and employee bounds) across 6 dimensions, evaluates alternate signals (ONDC sellers, DISCOM electricity, DigiLocker skills, and WhatsApp API metadata), monitors cohort genetic drift, integrates Whisper local speech-to-text diaries, and creates PQC-ready ZK Proof credit band attestations.

The interface is styled with a **premium, stark monochrome (black and white) design language** that mimics high-end developer tooling (Vercel/Linear style), featuring pure black backdrops, glassmorphism overlays, white rim-lighting, and responsive, accessible layouts.

---

## ✨ Features

- **Collapsible Workspace Sidebar Layout:** A unified, professional app shell housing active profile stats, quick-access controls, navigation subtexts, and cryptographic indicators.
- **Interactive Profile Switcher:** Swaps between 10 pre-loaded MSME profiles (from agricultural retail to textile weavers) to instantly observe how different risk variables, seasonalities, and employee sizes impact credit scoring.
- **Dynamic Alternate Signal Integrations:** Maps seller scores from ONDC, responses from WhatsApp APIs, validated skills from DigiLocker, and electricity logs from DISCOMs.
- **Supplier Payment Directed Graphs:** concentric supply chain network layout separating customer and supplier concentration.
- **Whisper Voice Diaries:** Transcribes weekly regional-language recordings to check behavioral patterns.
- **Roadmap Score Recalculator:** Interactive metric sliders allowing simulated rating outcomes and 90-day recovery checklists.
- **ZK Cryptographic Proof Cards:** Copy JWT tokens containing salt hashes and eligibility proof claims.
- **Cross-Portal Underwriter Hooks:** The Bank Underwriter Dashboard provides list-level portfolio oversight with risk badges. Click any registered borrower to inspect their MSME records, and switch back to underwriter mode in one click.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11 · FastAPI · SQLAlchemy 2.0 (Async) · aiosqlite / asyncpg
- **Alternate Data & ML:** scikit-learn · statsmodels · NetworkX · pandas · numpy
- **AI Integration:** Anthropic Claude (Roadmap Narratives) · Local OpenAI Whisper (Voice check-ins)
- **Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · Recharts · Framer Motion
- **Cryptography:** PyNaCl (simulating crystals-kyber PQC) · JWT

---

## 📂 Project Structure

```
credex/
├── backend/
│   ├── main.py                    # FastAPI app setup
│   ├── database.py                # Async session engine (Postgres / SQLite fallback)
│   ├── seed.py                    # Preloads 10 representative MSMEs
│   ├── models/                    # Database schemas
│   ├── routers/                   # Modular API routers
│   ├── services/                  # Business logic & ML scoring engines
│   └── tests/
│       └── test_flow.py           # Unit / Integration test suite
├── frontend/                      # React SPA
│   ├── src/
│   │   ├── App.tsx                # Central Router, Sidebar & Workspace layout
│   │   ├── pages/                 # Onboarding, Dashboard, Bank, Roadmap panels
│   │   └── components/            # Reusable UI widgets
│   └── Dockerfile
├── vercel.json                    # Configuration for static Vercel frontend hosting
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Local Executions)

### 1. Database Seeding
To populate the database with the 10 representative demo MSMEs (such as *Priya's Fresh Kitchen* and *Arjun Agro Inputs*):
```bash
python -m backend.seed
```
*Note: If PostgreSQL is unreachable, the system automatically builds and seeds a local `credex.db` SQLite file.*

### 2. Run Verification Tests
Verify all STL decomposition, scoring models, and voice sentiment components:
```bash
python -m backend.tests.test_flow
```

### 3. Run Backend API Server
Start the local FastAPI development server:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Run Frontend Client
Scaffold dependencies and start the Vite server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 🐳 Docker Deployment
To spin up all services (PostgreSQL, Redis, FastAPI, and Vite Client) containerized:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173/`
- Backend API: `http://localhost:8000/docs`
