# CREATIVE CAPACITY INTELLIGENCE
### AI-Powered Workload & Productivity Optimization for Advertising Operations

An enterprise decision-support dashboard designed in a clean BCG / McKinsey consulting aesthetic to diagnose workload sustainability, identify the empirical productivity tipping point, and recommend optimal capacity rebalancing across 60 advertising specialists (January 2025 – June 2026, $N = 4,680$ employee-weeks).

---

## Quick Start

1. **Direct Browser Launch (Zero Setup):**
   Open [`index.html`](./index.html) directly in any modern browser (Chrome, Edge, Firefox, Safari). All 4,680 employee-week records are pre-bundled via [`data.js`](./data.js) and [`data_engine.js`](./data_engine.js).

2. **Local Python Server Launch:**
   ```bash
   python app.py
   ```
   Automatically regenerates [`Advertising_Agency_Creative_Capacity_Historical_Data.csv`](./Advertising_Agency_Creative_Capacity_Historical_Data.csv) and opens `http://localhost:8050/index.html`.

---

## Core Analytical Pages

1. **01 · Executive Overview:** Top 6 KPIs vs. H1 2025 baseline, dynamic AI management synthesis, longitudinal workload vs. effective productivity trajectory, risk distribution, and root-cause operational issues.
2. **02 · Historical Productivity ("From More Hours to Lower Productivity"):** Customizable Period A vs. Period B comparison matrix across 10 metrics and 6 synchronized monthly trend charts pinpointing the September–October 2025 inflection window.
3. **03 · Productivity Tipping Point:** Empirical scatter & binned non-linear regression curve identifying the exact **Productivity Tipping Point (~25.8–26.2 workload points)**, with Sustainable, Warning, and Overload zones.
4. **04 · Employee Capacity Intelligence:** Searchable, sortable 60-employee directory with clickable longitudinal employee profile drawers and non-disciplinary capacity rebalancing advice.
5. **05 · Team & Department Capacity:** Departmental capacity vs. workload comparison (`Video & Motion`, `Creative Design`, `Account Management`, `Copywriting`, `Strategy`) and a Department $\times$ Quarter Capacity Utilization Heatmap.
6. **06 · AI Workload Recommendation Engine:** Executive synthesis, net capacity ledger, 4 prioritized recommendation cards, and an employee-level point reallocation schedule.
7. **07 · Risk & Early Warning ("Workload Sustainability Risk"):** 5-stage longitudinal cascade chain (`Workload Surge` $\rightarrow$ `Overtime` $\rightarrow$ `Completion Delay` $\rightarrow$ `Engagement Drop` $\rightarrow$ `Lagging Absenteeism`) and Top 10 Highest-Risk Watchlist.
8. **08 · Simulation / What-If Planner:** Interactive 5-lever policy simulator with real-time response-surface **Model Estimates**.
