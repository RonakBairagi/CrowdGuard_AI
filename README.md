# CrowdGuard AI — Real-Time Crowd Safety & Smart Navigation Platform

> **Tagline:** *Detect the danger. Guide the crowd. Protect lives.*

CrowdGuard AI is a full-stack real-time crowd-monitoring and public safety platform engineered for high-density public venues and mass gatherings, including Durga Puja pandals, railway terminals, metro stations, book fairs, and stadiums.

The platform provides two connected interfaces linked through a shared reactive backend:
1. **Public Mobile Interface:** Mobile-first, smartphone visitor interface for checking live crowd conditions, viewing verified gate statuses, navigating safe corridor routes, reporting hazards, and receiving urgent safety alerts.
2. **Authority & Event Management Dashboard:** Command and control center for venue managers, safety officers, and organizers to monitor zone densities, control gates, triage public hazard reports, publish verified emergency alerts, and edit venue map topologies.

---

## 🏗️ Architecture & Technology Stack

```
                              [ Physical / Simulated IoT Sensors ]
                                              │
                                              ▼
                                 [ Sensor Ingestion Service ]
                                              │
                                              ▼
                                   [ Crowd-Risk Engine ]
                          (Explainable Rules, Density, Freshness)
                                              │
                                              ▼
                                   [ Central App Store ]
                                  (State of Truth & RBAC)
                                     │               │
                     WebSocket Broadcast             REST Endpoints
                             │                               │
            ┌────────────────┴───────────────┐               │
            ▼                                ▼               ▼
[ Public Visitor Interface ]     [ Authority Dashboard ] ◄───┘
 (Smartphone View & Offline)      (Command Control Center)
```

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS Design System with accessible WCAG tokens, responsive mobile frame simulator, and interactive SVG topology renderer.
- **Backend:** Node.js, Express, WebSocket (`ws`) server with real-time bidirectional push and stale telemetry watchdog.
- **Engines:**
  - `CrowdRiskEngine`: Rule-based explainable risk evaluator (LOW, MODERATE, HIGH, CRITICAL, UNKNOWN) with sensor timeout detection.
  - `VenueRouteEngine`: Graph-based pathfinder (Dijkstra) penalizing high-density zones, strictly excluding closed gates and blocked corridors, and providing safe emergency directives.
- **Internationalization:** Multi-language support structure for English, Bengali (বাংলা), and Hindi (हिंदी).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation

1. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Platform

1. **Start the Backend Server (Port 5000):**
   ```bash
   cd server
   npm run dev
   ```
   *Runs Express REST API on `http://localhost:5000` and WebSocket on `ws://localhost:5000/ws`.*

2. **Start the Frontend Client (Port 5173):**
   ```bash
   cd client
   npm run dev
   ```
   *Launches the Vite dev server at `http://localhost:5173`.*

3. **Open the Application:**
   Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🧪 Automated Tests

The core backend includes an automated test suite verifying role-based access, crowd risk thresholds, sensor timeouts (stale telemetry), gate closures, verified alerts, and Dijkstra routing:

```bash
cd server
npm test
```

**Results:**
- `✅ PASS: Zone with 40% capacity evaluates to LOW risk`
- `✅ PASS: Zone above 95% capacity evaluates to CRITICAL risk`
- `✅ PASS: Risk engine provides transparent explainable reasoning`
- `✅ PASS: Offline sensor transitions zone status to UNKNOWN`
- `✅ PASS: Offline sensor sets confidence to 0%`
- `✅ PASS: Stale sensor telemetry (>30s) automatically triggers UNKNOWN status`
- `✅ PASS: Route successfully found when all gates are open`
- `✅ PASS: Closing exit gate automatically generates verified safety alert`
- `✅ PASS: Route planner rejects paths terminating at a CLOSED gate`
- `✅ PASS: Route planner successfully reroutes pedestrians to alternate open Gate 4`
- `✅ PASS: Public reports default to UNVERIFIED and can be triaged`

---

## 🎯 Verification & Demonstration Scenario (Section 13)

The platform includes a dedicated **Dual Sync View** accessible from the top navigation bar. It displays the **Public Mobile Interface** on the left and the **Authority Dashboard** on the right side-by-side, sharing the same live WebSocket connection:

1. **Select Venue:** Select **Baghbazar Sarbojanin Durga Puja & Grounds** or **Howrah Junction Main Terminal**.
2. **View Crowd Status & Route:** On the Public Mobile screen, tap the venue card. View the crowd occupancy meter, explainable risk reason, and the interactive SVG venue map. Notice the verified safe route from Gate 1 to Gate 3.
3. **Simulate Ingress Surge:** On the Authority Dashboard, click **Simulate Ingress Spike (+120 persons)**. Observe both screens immediately updating the crowd count and risk level.
4. **Close Exit Gate 3:** In the Authority Simulation Deck, click **Close Gate 3**.
   - The Public Mobile screen instantly updates Gate 3 badge to **CLOSED**.
   - A verified safety alert appears on the visitor's screen: *"SAFETY ALERT: Gate 3 is temporarily closed. Follow verified route to Gate 4 and obey on-site staff instructions."*
   - The route planner automatically invalidates routes using Gate 3 and reroutes visitors safely to open Gate 4!
5. **Simulate Sensor Disconnect:** Click **Simulate Sensor Failure**.
   - The affected zone's risk badge immediately changes to **UNKNOWN** with confidence 0%.
   - The UI displays the last known update timestamp and cautions visitors to follow staff instructions.
6. **Restore Sensor:** Click **Restore Sensor Telemetry**. The zone immediately recovers with active calibrated readings.
7. **Submit & Triage Public Hazard Report:** On the Public screen, tap **Report Safety Hazard**. Submit an unverified report. Notice it appear in the Authority **Public Hazard Queue** marked **UNVERIFIED**. The authority operator can dispatch marshals, confirm the report, or dismiss false alarms.

---

## 🔒 Role-Based Access Control (RBAC)

Use the **Role Selector** in the top navigation bar to test server-enforced permissions:

| Role | View Crowd & Route | Submit Report | Toggle Gates | Publish Verified Alerts | Triage Reports | Map Editor | Event Creation |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Public Visitor** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Safety Officer** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Venue Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Event Organiser** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **System Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*Administrative endpoints on `/api/venues/:id/gates/:gateId`, `/api/alerts`, and `/api/venues/:id/map` enforce role verification on the server.*

---

## 📊 Simulated vs. Integrated Features (Prompt Requirement 10.15)

In compliance with ethical AI and safety prototyping standards:

| Feature | Status | Notes |
|---|---|---|
| **Real-Time WebSockets & Sync** | **Genuinely Integrated** | Shared state broadcast over WebSockets to all connected clients. |
| **Explainable Risk Assessment Engine** | **Genuinely Integrated** | Mathematical density calculations, flow deltas, and configurable thresholds. |
| **Stale Telemetry Watchdog** | **Genuinely Integrated** | Background interval checks timestamps; flags zone `UNKNOWN` after timeout. |
| **Graph-Based Route Guidance** | **Genuinely Integrated** | Dijkstra algorithm with dynamic hazard weights and closed-gate exclusion. |
| **Multi-Language Support (EN, BN, HI)** | **Genuinely Integrated** | Dictionary-driven localization system. |
| **Physical IoT Counters & CCTV Feeds** | **Simulated** | Telemetry is ingested via `/api/sensors/ingest` and the Simulation Control Deck. Physical hardware is not claimed to be connected. |
| **Facial Recognition / GPS Tracking** | **Deliberately Excluded** | Privacy-conscious design: aggregate counting only; optional manual location choice. |

---

## 🛡️ Privacy & Safety Principles

1. **No Facial Recognition:** Crowd counts are aggregate numbers derived from overhead sensors or gate turnstiles.
2. **Optional Location:** Visitors are never tracked continuously; they can switch between simulated GPS and manual location selection.
3. **No False Guarantees:** The risk engine provides trend awareness and early alerts, but does not claim to predict every emergency or guarantee crush prevention.
4. **Offline Safeguards:** When offline, the app displays cached emergency numbers and safety directives with clear disclaimers that live crowd data may be outdated.
