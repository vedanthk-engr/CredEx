# CREDEX — Cohort-Relative MSME Credit Intelligence Platform

CREDEX is a full-stack, AI-driven MSME Financial Health Card scoring platform built for credit-invisible businesses in India. It scores businesses relative to micro-cohorts (~800 peer archetypes based on NIC sector, location tier, vintage, and employee bounds) across 6 dimensions, evaluates alternate signals (ONDC sellers, DISCOM electricity, DigiLocker skills, and WhatsApp API metadata), monitors cohort genetic drift, integrates Whisper local speech-to-text diaries, and creates PQC-ready ZK Proof credit band attestations.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11/3.14 · FastAPI · SQLAlchemy 2.0 (Async) · aiosqlite / asyncpg
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
│   │   ├── App.tsx                # Central Router & Header layout
│   │   ├── pages/                 # Onboarding, Dashboard, Bank, Roadmap panels
│   │   └── components/            # Reusable UI widgets
│   └── Dockerfile
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
