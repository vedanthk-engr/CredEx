# CREDEX — Cohort-Relative MSME Credit Intelligence Platform

CREDEX is a full-stack, enterprise-grade credit intelligence and scoring platform designed to bridge India's **₹25 Lakh Crore MSME credit gap**. By shifting the paradigm from rigid asset-based underwriting to dynamic, cash-flow-relative assessment, CREDEX enables credit-invisible (New-To-Credit) businesses to establish creditworthiness and unlock competitive capital.

The platform is wrapped in a **premium, high-contrast monochrome (black and white) design language** featuring pure black backdrops, subtle glassmorphism card layouts, glowing white typography, and responsive, fluid workspaces.

---

## 📸 Core Features & Capabilities

### 1. Cohort-Relative Scoring Engine
* **Context:** Traditional scoring models penalize small businesses for low absolute revenues or lack of collateral.
* **Feature:** CREDEX groups MSMEs into **800+ granular peer micro-cohorts** based on their:
  - 2-Digit National Industrial Classification (NIC) code (e.g., Food Services, Auto Parts, Textiles).
  - Geographic location tier (Tier 1 vs. Tier 2, etc.).
  - Business vintage (years in operation).
  - Employee bounds.
* **Scoring Metrics:** Computes peer-relative percentiles across 6 core dimensions:
  1. **GST Compliance & Discipline:** Regularity of filings and tax payment history.
  2. **Runway Resilience:** Sufficiency of operational cash runway.
  3. **Growth Trajectory:** Momentum of underlying cash inflows.
  4. **Network Diversity:** Resilience against client or supplier concentration.
  5. **Alternative Signals:** Composite performance score from external registry APIs.
  6. **Behavioral Trust:** Sentiment and consistency metrics compiled from vernacular check-ins.
* **Auto-Limit Generator:** Suggests recommended credit limits and sets next review dates on a rolling monthly basis.

---

### 2. GST Ledger STL Decomposition
* **Context:** Seasonal market dips (e.g., festival demands, harvest cycles) are often misclassified by underwriters as financial decline.
* **Feature:** Separates seasonality from true underlying trade trends.
* **Visualizations & Analysis:**
  - **Raw GSTR vs. Trend Line:** A line chart overlaying raw monthly filings against the underlying decomposed growth trend.
  - **Seasonality Wave Chart:** An area chart plotting cyclical trade variations to isolate seasonal peaks and troughs.
  - **Residual Anomalies Chart:** A bar chart depicting unexplained deviations from the trend and seasonal patterns. Custom color coding alerts underwriters to sudden drops (anomaly flags) or positive cash surges.

---

### 3. Alternative Registry Signal Hub
* **Context:** Offline or cash-dominated merchants lack formal credit histories but leave rich digital footprints across utilities and networks.
* **Feature:** Connects non-traditional datasets to apply score modifiers:
  - **ONDC Seller Score:** Tracks order fulfillment rates, Average Order Value (AOV), and customer return ratios.
  - **WhatsApp Business API Vitality:** Evaluates client diversity, response velocity, and communication volumes.
  - **DigiLocker Skill Certificates:** Validates government-certified employee credentials, applying a skill-resilience modifier.
  - **DISCOM Electricity Draws:** Analyzes monthly power usage. Drastic drops (e.g., a 55% reduction in power draw) alert underwriters to potential factory closures or labor halts.

---

### 4. Supply Chain directed graphs
* **Context:** Businesses dependent on a single supplier or buyer are highly vulnerable to chain disruption.
* **Feature:** Map payment networks to evaluate supplier/buyer relationships.
* **Visualizations:**
  - **Concentric Directed Graph:** An interactive SVG layout placing the target business at the center, suppliers on the right, and buyers on the left.
  - **Node Highlights:** Highlight a node to see its transaction volume, cash flow percentage, and centrality score.
  - **Concentration Metrics:** Computes index values for buyer and supplier concentration to detect single-point-of-failure risks.

---

### 5. Vernacular Voice Diary
* **Context:** Numerical ledgers miss the qualitative behavioral signals that local branch managers traditionally rely on.
* **Feature:** A voice console permitting weekly vernacular check-ins.
* **Capabilities:**
  - **Bouncy Waveform Visualizer:** Animated CSS waves reflecting recording states.
  - **Speech-to-Text & Translation:** Translates and transcribes local dialets using OpenAI Whisper.
  - **NLP Sentiment Analytics:** Computes a behavioral confidence rating, unlocking indicators like the *Committed Borrower Badge* for regular filing compliance.

---

### 6. Interactive Credit-Limit Simulator & Roadmap
* **Context:** MSMEs need transparency on how to improve their credit profile.
* **Feature:** A credit optimization dashboard containing:
  - **Metric Sliders:** Adjust GST filing rates, cash runway days, and EPFO payroll registrations to see real-time updates to projected credit limits.
  - **90-Day Action Plans:** Actionable recovery cards (e.g., "Establish a cash buffer," "Settle pending buyer receivables") to guide the business toward higher scoring bands.

---

### 7. Zero-Knowledge Attestation & OCEN Marketplace
* **Context:** Sharing raw GSTR files exposes confidential business margins to prospective lenders.
* **Feature:** Generates signed ZK Attestations proving credit eligibility bands without exposing underlying ledgers.
* **Lender Marketplace:**
  - Connects to an **OCEN 4.0 lending registry**.
  - Displays dynamic, competitive loan bids from financial institutions (e.g., *SBI MSME Core*, *HDFC FlexiGrow*, *SIDBI Udyog Mitra*).
  - Includes a JWT Claim Token Inspector with copy-paste utility.

---

### 8. Bank Underwriter Portal
* **Context:** Underwriters require portfolio-level oversight and risk alerts.
* **Feature:** A specialized portal showing:
  - **Portfolio KPIs:** Total capital deployed, average rating, and active default stress signals.
  - **Cohort Dispersion Scatter Chart:** Bubble plot mapping MSME vintage against percentile ratings, with bubbles sized by approved credit limits.
  - **One-Click Inspector Hooks:** Quickly click any borrower (e.g., *Singh Cold Chain*, *K किरण Pharma*) to inspect their GST decomposition, networks, and alternate signals.

---

## 🛠️ Architecture & Technology Stack

```
                                  [ Vite / React Client ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ MSME Portal Mode ]                       [ Underwriter Mode ]
             ├── Dashboard Overview                     ├── Portfolio KPI Cards
             ├── GST STL Decomposition                  ├── Dispersion Bubble Chart
             ├── Network Directed Graph                 └── Quick Inspect Hooks
             ├── Alternates Signal Hub
             ├── Voice sentiment Diaries
             └── ZK Proof / OCEN Marketplace
                       │
                       ▼ (HTTP Requests / SSE Stream)
                       │
                              [ FastAPI Backend Server ]
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
               [ SQLite / Postgres ]  [ STL Decomposer ]    [ Whisper Engine ]
               └── MSME Tables        └── statsmodels       └── Transcription NLP
```

- **Backend Framework:** Python 3.11 · FastAPI · Uvicorn · SQLAlchemy 2.0 (Async) · aiosqlite / asyncpg
- **ML & Network Analytics:** scikit-learn · statsmodels · NetworkX · pandas · numpy
- **Frontend Framework:** React 18 · Vite · TypeScript · Tailwind CSS · Recharts · Framer Motion
- **Cryptography:** PyNaCl (simulating crystals-kyber PQC) · JWT

---

## 📂 Project Structure

```
credex/
├── backend/
│   ├── main.py                    # FastAPI app initialization & routes assembly
│   ├── database.py                # Async session engine with SQLite fallback
│   ├── seed.py                    # Preloads 10 representative MSMEs with distinct traits
│   ├── models/
│   │   └── msme.py                # SQLAlchemy async data schemas
│   ├── routers/
│   │   ├── msme.py                # MSME Profile and assessment APIs
│   │   ├── stream.py              # Server-Sent Events (SSE) progress streams
│   │   └── signal.py              # Connected alternate feeds and registries
│   └── tests/
│       └── test_flow.py           # Verification script for models, STL, and scoring
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Central Router, left sidebar, and switcher shell
│   │   ├── index.css              # Custom black & white glow style definitions
│   │   ├── pages/                 # Onboarding, Dashboard, Signals, Graphs, and Market
│   │   └── components/            # Score gauges, area graphs, progress streams
│   ├── tailwind.config.js         # Grayscale tokens config
│   └── Dockerfile
├── vercel.json                    # Configuration for static Vercel frontend hosting
├── docker-compose.yml             # Full-system container setup
└── README.md
```

---

## 🚀 Installation & Running Locally

### 1. Database Seeding
Populate the database with the 10 representative demo MSMEs:
```bash
python -m backend.seed
```
*Note: If a PostgreSQL connection is not active, the system automatically builds and seeds a local `credex.db` SQLite database.*

### 2. Run Verification Tests
Verify the mathematical correctness of scoring engines, STL, and Whisper transcription:
```bash
python -m backend.tests.test_flow
```

### 3. Run Backend API Server
Start the local FastAPI development server:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Run Frontend Client
Instantiate dependencies and launch the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173/` in your browser.
