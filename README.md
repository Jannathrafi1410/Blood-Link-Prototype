# BLOOD AVAILABILITY NETWORK

> **"The right blood, to the right patient, at the right time."**

An intelligent emergency blood-matching platform connecting **Patients & Families**, **Hospitals**, **Blood Banks**, **Blood Donors**, **NSS Partners**, and **System Administrators** across India.

---

## 1. Problem & Purpose

Blood availability in emergency trauma and surgical care is severely fragmented across disparate hospital registers and voluntary rosters. Families frequently resort to frantic social media messaging, risking delay, fraud, and severe privacy violations.

The **Blood Availability Network (BAN)** does not manufacture blood; rather, it drastically eliminates search delay by providing real-time visibility and location-aware, privacy-safe matching:
- **Bank-First Logic:** Queries regional blood bank inventories first to reserve available stock before alerting community donors.
- **Two-Stage Matching Engine:** Combines hard medical/eligibility filters with multi-factor proximity scoring.
- **Zero Contact Unmasking:** Donor phone numbers, emails, and home addresses are cryptographically protected and never exposed to requesters or hospitals.
- **In-App Privacy Relay:** In-app coordination with automated regex detectors that actively block phone numbers, emails, and street addresses.

---

## 2. Full-Stack System Architecture

```text
                    ┌───────────────────────────────┐
                    │           FRONTEND            │
                    │ React 19 + TypeScript + Vite  │
                    │ Tailwind CSS + Leaflet Maps   │
                    │ Dynamic Persona Switcher      │
                    └───────────────┬───────────────┘
                                    │
                             REST API + SSE Stream
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │           BACKEND             │
                    │ Express / TypeScript Service  │
                    │ PostGIS Geodesic Matcher      │
                    │ Two-Stage Ranking Engine      │
                    │ Privacy Layer & PII Blocker   │
                    │ Audit Surveillance Logging    │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             Database Store    Redis Queue     Worker/Scheduler
            (PostGIS Indexed)  (Degraded Mode  (180s Timeout &
            842 Donors Seeded  In-Process Fall) Wave Escalation)
```

---

## 3. Dedicated User Roles & Dashboards

The application implements strict Role-Based Access Control (RBAC) with 6 dedicated consoles:

| Role | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Hospital** | `/hospital` | Emergency SOS creation, real-time anonymized candidate table (D-014, D-207, D-092), bank stock check, clinical confirmation of patient requests, live SSE timeline. |
| **Donor** | `/donor` | Availability toggle, eligibility checklist (90-day cooldown, weight, illness), live emergency alerts with instant Accept/Decline, zero-contact in-app relay. |
| **Blood Bank** | `/blood-bank` | Component inventory register, freshness tracking (Fresh, Recent, Aging, Stale), CSV template download & batch import with per-row validation. |
| **Patient / Family** | `/patient` | Simplified emergency SOS broadcast, live fulfillment progress bar, nearest 24/7 trauma hospitals, hospital liaison relay. |
| **NSS Partner** | `/nss` | Institutional blood donation camps manager, consented student volunteer CSV roster import with mandatory consent validation. |
| **Administrator** | `/admin` | Entity verification queue, reason-required PII unmasking with audit logging, algorithmic matching configuration, demo scenario controls. |

---

## 4. Benchmark Scenario: Thrissur, Kerala

The platform is seeded with a baseline benchmark scenario reproducing exact clinical triage numbers:
- **Location:** Thrissur, Kerala (Pincode `680001`, Lat: `10.5276`, Lng: `76.2144`)
- **Emergency Case:** `BAN-10291` created by **ABC Hospital, Thrissur**
- **Requirement:** 2 Units of **O- Negative Whole Blood** (CRITICAL)
- **Pipeline Progression:**
  - **23** potential O- donors in Thrissur regional pool
  - **11** medically eligible (cooldown interval ≥ 90 days, no illness, consented)
  - **6** within 5 km proximity radius
  - **3** candidates notified in Wave 1:
    - `D-014` (Distance ~2.1 km, Match Score 94%) &rarr; **ACCEPTED**
    - `D-207` (Distance ~3.4 km, Match Score 88%) &rarr; SENT
    - `D-092` (Distance ~4.1 km, Match Score 81%) &rarr; SENT
  - **1** match confirmed (`D-014`) with in-app relay opened without revealing contact info.

---

## 5. Matching Engine & Scoring Formula

### Stage 1: Hard Clinical Filters
Candidates are filtered out if any condition fails:
- ABO/Rh blood compatibility according to component rules (Red Cells, Whole Blood, Plasma, Platelets)
- Mandatory informed consent (`hasConsented == true`)
- Active availability (`isAvailable == true`)
- Whole Blood cooldown interval (minimum 90 days since last donation)
- Proximity check: $Distance \le Radius_{wave}$ (Wave 1: 5 km; Wave 2: 10 km)

### Stage 2: Multi-Factor Scoring
Surviving candidates are ranked using the formula:
$$\text{MatchScore} = 0.40 \times \text{ProximityScore} + 0.25 \times \text{GroupScore} + 0.20 \times \text{ResponseScore} + 0.15 \times \text{ActivityScore}$$

- **ProximityScore:** $1 - \frac{\text{Distance}}{\text{MaxRadius}}$
- **GroupScore:** $1.0$ if identical ABO+Rh; $0.85$ if compatible substitute
- **ResponseScore:** Historical donor acceptance rate ($0.0 - 1.0$)
- **ActivityScore:** Recent response activity index ($0.0 - 1.0$)
- **Wave Capping:** Maximum 3 candidates notified simultaneously to prevent volunteer fatigue and spam.

---

## 6. Privacy & Security Architecture

1. **Zero Contact Unmasking:** Hospital and patient consoles view only Candidate IDs (e.g. `D-014`), group, distance, and score.
2. **Coarse Location Jitter:** Donor coordinates are saved and displayed using a 1 km coarse grid resolution. Exact home GPS is never stored.
3. **Automated PII Blocker:** Relay messages are passed through a regex scanner. Any telephone numbers (e.g. 10-digit Indian mobiles), emails, or street addresses are intercepted with status `BLOCKED_PII`.
4. **Audit Surveillance:** Admin access to masked user contact info requires an explicit clinical reason string and creates an immutable audit log entry.

---

## 7. Demo Accounts & Quick Persona Switching

Use the **Demo Persona** dropdown in the top header to instantly switch roles:

| Persona | Role | Default Organization / Context |
| :--- | :--- | :--- |
| **Dr. Thomas Mathew** | `HOSPITAL` | ABC Hospital, Thrissur (Pincode 680001) |
| **Rahul Varma** | `DONOR` | Candidate D-014, O- Eligible Donor (Thrissur) |
| **Priya Nair** | `BLOOD_BANK` | Jubilee Mission Blood Centre (Pincode 680005) |
| **Lakshmi Menon** | `PATIENT` | Family Requester (Pre-surgery SOS) |
| **Prof. Haridas K.** | `NSS_PARTNER` | St. Thomas College NSS Unit #42 |
| **System Administrator** | `ADMIN` | Security & Matching Governance Console |

---

## 8. Development & Startup

### Environment Variables
Copy `.env.example` to `.env`:
```bash
PORT=3000
NODE_ENV=development
VITE_API_URL=/api
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key
```

### Installation & Run
```bash
# Install dependencies
npm install

# Start full-stack server (Express + Vite mounted on port 3000)
npm run dev

# Build for production
npm run build
npm start
```

### Verification & Health
- Health check: `http://localhost:3000/api/health`
- Seed status: 842 donors, 12 blood banks, 8 hospitals, 7 open requests.

---

## 9. Disclaimers

- **Simulated Demo Data:** Seed metrics (91.2% fulfillment, 78.4% response rate, 4.2s match time) represent synthetic benchmark scenario data, not clinical production guarantees.
- **Medical Transfusion Notice:** Compatibility rules are advisory and require clinical review by a licensed transfusion medicine professional prior to crossmatch or administration.
