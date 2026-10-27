/**
 * CREATIVE CAPACITY INTELLIGENCE
 * Data Engine & Analytical Core
 * Generates & manages the 4,680 employee-week dataset (60 employees x 78 weeks, Jan 2025 - Jun 2026)
 * directly from the official 60-employee master table, and supports CSV export/import.
 */

window.EMPLOYEE_MASTER = [
  { Employee_ID: "EMP001", Department: "Video & Motion", Role: "Video Creative", Experience_Months_At_Start: 119, Skill_Level: "Senior", Sustainable_Capacity_Points: 24.6 },
  { Employee_ID: "EMP002", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 46, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 25.5 },
  { Employee_ID: "EMP003", Department: "Copywriting", Role: "Copywriter", Experience_Months_At_Start: 36, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 27.8 },
  { Employee_ID: "EMP004", Department: "Strategy", Role: "Planning Executive", Experience_Months_At_Start: 9, Skill_Level: "Junior", Sustainable_Capacity_Points: 21.8 },
  { Employee_ID: "EMP005", Department: "Copywriting", Role: "Copywriter", Experience_Months_At_Start: 14, Skill_Level: "Junior", Sustainable_Capacity_Points: 24.2 },
  { Employee_ID: "EMP006", Department: "Account Management", Role: "Account Executive", Experience_Months_At_Start: 32, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 22.4 },
  { Employee_ID: "EMP007", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 5, Skill_Level: "Junior", Sustainable_Capacity_Points: 22.2 },
  { Employee_ID: "EMP008", Department: "Account Management", Role: "Client Partner", Experience_Months_At_Start: 73, Skill_Level: "Senior", Sustainable_Capacity_Points: 26.2 },
  { Employee_ID: "EMP009", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 70, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 26.0 },
  { Employee_ID: "EMP010", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 30, Skill_Level: "Junior", Sustainable_Capacity_Points: 20.2 },
  { Employee_ID: "EMP011", Department: "Strategy", Role: "Brand Strategist", Experience_Months_At_Start: 70, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 23.8 },
  { Employee_ID: "EMP012", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 23, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 25.2 },
  { Employee_ID: "EMP013", Department: "Video & Motion", Role: "Motion Designer", Experience_Months_At_Start: 64, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 19.6 },
  { Employee_ID: "EMP014", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 20, Skill_Level: "Junior", Sustainable_Capacity_Points: 19.8 },
  { Employee_ID: "EMP015", Department: "Creative Design", Role: "Art Director", Experience_Months_At_Start: 94, Skill_Level: "Senior", Sustainable_Capacity_Points: 28.8 },
  { Employee_ID: "EMP016", Department: "Strategy", Role: "Planning Executive", Experience_Months_At_Start: 60, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 25.7 },
  { Employee_ID: "EMP017", Department: "Creative Design", Role: "Art Director", Experience_Months_At_Start: 111, Skill_Level: "Senior", Sustainable_Capacity_Points: 30.4 },
  { Employee_ID: "EMP018", Department: "Copywriting", Role: "Copywriter", Experience_Months_At_Start: 45, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 22.2 },
  { Employee_ID: "EMP019", Department: "Copywriting", Role: "Senior Copywriter", Experience_Months_At_Start: 114, Skill_Level: "Senior", Sustainable_Capacity_Points: 30.7 },
  { Employee_ID: "EMP020", Department: "Copywriting", Role: "Senior Copywriter", Experience_Months_At_Start: 44, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 20.5 },
  { Employee_ID: "EMP021", Department: "Copywriting", Role: "Copywriter", Experience_Months_At_Start: 28, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 27.1 },
  { Employee_ID: "EMP022", Department: "Video & Motion", Role: "Motion Designer", Experience_Months_At_Start: 57, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 23.9 },
  { Employee_ID: "EMP023", Department: "Account Management", Role: "Client Partner", Experience_Months_At_Start: 44, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 23.1 },
  { Employee_ID: "EMP024", Department: "Strategy", Role: "Campaign Strategist", Experience_Months_At_Start: 27, Skill_Level: "Junior", Sustainable_Capacity_Points: 21.4 },
  { Employee_ID: "EMP025", Department: "Copywriting", Role: "Copywriter", Experience_Months_At_Start: 15, Skill_Level: "Junior", Sustainable_Capacity_Points: 22.8 },
  { Employee_ID: "EMP026", Department: "Account Management", Role: "Account Manager", Experience_Months_At_Start: 44, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 25.8 },
  { Employee_ID: "EMP027", Department: "Account Management", Role: "Account Executive", Experience_Months_At_Start: 132, Skill_Level: "Senior", Sustainable_Capacity_Points: 30.8 },
  { Employee_ID: "EMP028", Department: "Strategy", Role: "Campaign Strategist", Experience_Months_At_Start: 69, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 21.0 },
  { Employee_ID: "EMP029", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 48, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 26.8 },
  { Employee_ID: "EMP030", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 133, Skill_Level: "Senior", Sustainable_Capacity_Points: 30.9 },
  { Employee_ID: "EMP031", Department: "Copywriting", Role: "Content Strategist", Experience_Months_At_Start: 36, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 22.6 },
  { Employee_ID: "EMP032", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 5, Skill_Level: "Junior", Sustainable_Capacity_Points: 20.2 },
  { Employee_ID: "EMP033", Department: "Copywriting", Role: "Content Strategist", Experience_Months_At_Start: 71, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 21.5 },
  { Employee_ID: "EMP034", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 14, Skill_Level: "Junior", Sustainable_Capacity_Points: 20.5 },
  { Employee_ID: "EMP035", Department: "Strategy", Role: "Brand Strategist", Experience_Months_At_Start: 28, Skill_Level: "Junior", Sustainable_Capacity_Points: 22.2 },
  { Employee_ID: "EMP036", Department: "Video & Motion", Role: "Video Creative", Experience_Months_At_Start: 144, Skill_Level: "Senior", Sustainable_Capacity_Points: 29.9 },
  { Employee_ID: "EMP037", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 20, Skill_Level: "Junior", Sustainable_Capacity_Points: 19.8 },
  { Employee_ID: "EMP038", Department: "Creative Design", Role: "Art Director", Experience_Months_At_Start: 27, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 20.1 },
  { Employee_ID: "EMP039", Department: "Strategy", Role: "Brand Strategist", Experience_Months_At_Start: 73, Skill_Level: "Senior", Sustainable_Capacity_Points: 23.4 },
  { Employee_ID: "EMP040", Department: "Account Management", Role: "Account Manager", Experience_Months_At_Start: 13, Skill_Level: "Junior", Sustainable_Capacity_Points: 21.4 },
  { Employee_ID: "EMP041", Department: "Account Management", Role: "Account Manager", Experience_Months_At_Start: 137, Skill_Level: "Senior", Sustainable_Capacity_Points: 29.4 },
  { Employee_ID: "EMP042", Department: "Video & Motion", Role: "Video Creative", Experience_Months_At_Start: 89, Skill_Level: "Senior", Sustainable_Capacity_Points: 23.8 },
  { Employee_ID: "EMP043", Department: "Video & Motion", Role: "Video Editor", Experience_Months_At_Start: 56, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 21.9 },
  { Employee_ID: "EMP044", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 14, Skill_Level: "Junior", Sustainable_Capacity_Points: 21.7 },
  { Employee_ID: "EMP045", Department: "Video & Motion", Role: "Video Editor", Experience_Months_At_Start: 18, Skill_Level: "Junior", Sustainable_Capacity_Points: 18.7 },
  { Employee_ID: "EMP046", Department: "Creative Design", Role: "Art Director", Experience_Months_At_Start: 83, Skill_Level: "Senior", Sustainable_Capacity_Points: 26.9 },
  { Employee_ID: "EMP047", Department: "Video & Motion", Role: "Motion Designer", Experience_Months_At_Start: 19, Skill_Level: "Junior", Sustainable_Capacity_Points: 18.1 },
  { Employee_ID: "EMP048", Department: "Account Management", Role: "Account Executive", Experience_Months_At_Start: 17, Skill_Level: "Junior", Sustainable_Capacity_Points: 19.4 },
  { Employee_ID: "EMP049", Department: "Strategy", Role: "Campaign Strategist", Experience_Months_At_Start: 8, Skill_Level: "Junior", Sustainable_Capacity_Points: 18.4 },
  { Employee_ID: "EMP050", Department: "Copywriting", Role: "Senior Copywriter", Experience_Months_At_Start: 28, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 22.8 },
  { Employee_ID: "EMP051", Department: "Account Management", Role: "Account Executive", Experience_Months_At_Start: 19, Skill_Level: "Junior", Sustainable_Capacity_Points: 18.7 },
  { Employee_ID: "EMP052", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 107, Skill_Level: "Senior", Sustainable_Capacity_Points: 30.6 },
  { Employee_ID: "EMP053", Department: "Video & Motion", Role: "Video Editor", Experience_Months_At_Start: 67, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 20.2 },
  { Employee_ID: "EMP054", Department: "Account Management", Role: "Account Manager", Experience_Months_At_Start: 29, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 21.8 },
  { Employee_ID: "EMP055", Department: "Creative Design", Role: "Creative Designer", Experience_Months_At_Start: 45, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 22.4 },
  { Employee_ID: "EMP056", Department: "Video & Motion", Role: "Video Editor", Experience_Months_At_Start: 14, Skill_Level: "Junior", Sustainable_Capacity_Points: 22.4 },
  { Employee_ID: "EMP057", Department: "Creative Design", Role: "Art Director", Experience_Months_At_Start: 108, Skill_Level: "Senior", Sustainable_Capacity_Points: 25.0 },
  { Employee_ID: "EMP058", Department: "Copywriting", Role: "Content Strategist", Experience_Months_At_Start: 65, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 30.1 },
  { Employee_ID: "EMP059", Department: "Copywriting", Role: "Senior Copywriter", Experience_Months_At_Start: 22, Skill_Level: "Intermediate", Sustainable_Capacity_Points: 24.1 },
  { Employee_ID: "EMP060", Department: "Creative Design", Role: "Graphic Designer", Experience_Months_At_Start: 10, Skill_Level: "Junior", Sustainable_Capacity_Points: 19.2 }
];

// Deterministic PRNG (Mulberry32) so dataset is 100% consistent across runs
function createSeededRandom(seed) {
  let a = seed;
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHistoricalDataset() {
  if (window.AGENCY_DATA && window.AGENCY_DATA.length > 0) {
    return window.AGENCY_DATA;
  }

  const rand = createSeededRandom(20250106);
  const randUniform = (min, max) => min + rand() * (max - min);
  const randGauss = (mean = 0, std = 1) => {
    const u1 = Math.max(1e-7, rand());
    const u2 = rand();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  };
  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
  const round = (val, dec = 1) => {
    const f = Math.pow(10, dec);
    return Math.round(val * f) / f;
  };

  // Generate 78 weekly Mondays from 2025-01-06 to 2026-06-29
  const weeks = [];
  const startDate = new Date(Date.UTC(2025, 0, 6));
  for (let i = 0; i < 78; i++) {
    const d = new Date(startDate.getTime() + i * 7 * 24 * 3600 * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    weeks.push({
      w_idx: i,
      Week_Start: `${yyyy}-${mm}-${dd}`,
      Month: `${yyyy}-${mm}`,
      Quarter: `${yyyy}-Q${q}`
    });
  }

  const rows = [];

  for (let eIdx = 0; eIdx < window.EMPLOYEE_MASTER.length; eIdx++) {
    const emp = window.EMPLOYEE_MASTER[eIdx];
    const empId = emp.Employee_ID;
    const dept = emp.Department;
    const role = emp.Role;
    const startExp = Number(emp.Experience_Months_At_Start);
    const skill = emp.Skill_Level;
    const susCap = Number(emp.Sustainable_Capacity_Points);

    // Department overload regime parameters in H2 2025 - H1 2026
    let peakMultiplier = 1.0;
    if (dept === "Video & Motion") peakMultiplier = 1.31;
    else if (dept === "Creative Design") peakMultiplier = 1.25;
    else if (dept === "Account Management") peakMultiplier = 1.08;
    else if (dept === "Copywriting") peakMultiplier = 0.89; // Available capacity for redistribution
    else if (dept === "Strategy") peakMultiplier = 0.85;    // Available capacity for redistribution

    const indivFactor = 1.0 + randUniform(-0.045, 0.045);
    const skillBonus = skill === "Senior" ? 0.035 : skill === "Intermediate" ? 0.0 : -0.025;

    const empWeeks = [];

    for (let w = 0; w < weeks.length; w++) {
      const wk = weeks[w];
      const expMonths = round(startExp + (w * 7.0) / 30.4375, 1);

      // Phase 1: Weeks 0..30 (Jan 2025 - Jul 2025) -> Sustainable Historical Baseline
      // Phase 2: Weeks 31..41 (Aug 2025 - Oct 2025) -> Campaign Volume Expansion & Tipping Point Crossing
      // Phase 3: Weeks 42..77 (Nov 2025 - Jun 2026) -> Chronic High-Workload Regime in Creative & Video
      let utilTarget;
      if (w < 31) {
        utilTarget = randUniform(0.87, 0.97);
      } else if (w < 42) {
        const prog = (w - 31) / 11.0;
        utilTarget = 0.93 + prog * (peakMultiplier - 0.93) + randUniform(-0.03, 0.03);
      } else {
        const seasonalWave = 0.035 * Math.sin((w - 42) / 3.8);
        utilTarget = peakMultiplier + seasonalWave + randUniform(-0.04, 0.05);
      }

      const workloadPoints = round(clamp(susCap * utilTarget * indivFactor + randGauss(0, 0.75), 11.5, 44.0), 1);
      const capacityUtil = round((workloadPoints / susCap) * 100.0, 1);

      // Ads Assigned vs Completed (Normalized complexity varies by role/skill)
      const ptsPerAd = skill === "Senior" ? 2.5 : skill === "Intermediate" ? 1.9 : 1.4;
      const adsAssigned = Math.max(2, Math.round(workloadPoints / ptsPerAd + randUniform(-0.4, 0.4)));
      let compRatio = 0.98;
      if (capacityUtil > 120) compRatio = randUniform(0.77, 0.88);
      else if (capacityUtil > 106) compRatio = randUniform(0.87, 0.94);
      else compRatio = randUniform(0.95, 1.0);
      const adsCompleted = Math.max(1, Math.min(adsAssigned, Math.round(adsAssigned * compRatio)));

      // Working Hours, Overtime, and the Empirical Tipping Point (~25.5 - 26.5 Workload Points)
      // Up to ~25.8 points (or ~100% capacity), working hours remain near 39-41h, so Productivity_Points_Per_Hour rises with healthy flow.
      // Beyond ~26.0 points (or >102% capacity), context switching, coordination overhead, and fatigue cause working hours & overtime to escalate faster than output!
      const excessCapPts = Math.max(0.0, workloadPoints - susCap * 0.98);
      const excessAbsPts = Math.max(0.0, workloadPoints - 25.8);
      const chronicFatigue = w > 35 && capacityUtil > 105 ? clamp((w - 35) / 40.0, 0.0, 1.0) : 0.0;

      let overtimeHours = 0.0;
      if (excessCapPts > 0 || excessAbsPts > 0) {
        const driver = Math.max(excessCapPts, excessAbsPts * 0.85);
        overtimeHours = Math.pow(driver, 1.32) * randUniform(1.42, 1.68) + chronicFatigue * 4.2;
      } else {
        overtimeHours = Math.max(0.0, randGauss(0.55, 0.55));
      }
      overtimeHours = round(clamp(overtimeHours, 0.0, 26.0), 1);

      const baseRegHours = overtimeHours === 0 ? round(randUniform(38.6, 40.1), 1) : 40.0;
      const workingHours = round(baseRegHours + overtimeHours, 1);
      const overtimeDays = clamp(Math.round(overtimeHours / 3.1), 0, 5);

      // Raw Hourly Productivity = Workload Points / Working Hours
      // Because workingHours stays ~39.5 up to 25.8 pts and then rises steeply via overtime, prodPerHr naturally peaks at ~25.5 - 26.5 pts!
      const prodPerHr = round(workloadPoints / workingHours, 3);

      const overloadRatio = Math.max(0.0, (capacityUtil - 100.0) / 100.0);

      // Avg Completion Days (turnaround time)
      const avgCompDays = round(clamp(2.4 + overloadRatio * 4.6 + chronicFatigue * 0.95 + randGauss(0, 0.2), 1.7, 6.8), 2);

      // Revision Count
      const revCount = round(clamp(1.05 + overloadRatio * 4.7 + chronicFatigue * 0.75 + randGauss(0, 0.18), 0.4, 5.8), 1);

      // Quality Score (1-10)
      const qualityScore = round(clamp(9.15 + skillBonus * 4.5 - overloadRatio * 3.85 - chronicFatigue * 0.8 + randGauss(0, 0.18), 5.6, 9.8), 1);

      // Client Satisfaction (1-10)
      const clientSat = round(clamp(9.2 - overloadRatio * 3.9 - Math.max(0, revCount - 1.2) * 0.35 + randGauss(0, 0.2), 5.4, 9.8), 1);

      // Engagement Score (1-10)
      const engagementScore = round(clamp(8.85 - (overtimeHours / 21.0) * 3.4 - chronicFatigue * 1.55 + randGauss(0, 0.22), 4.2, 9.6), 1);

      // Absenteeism Days (Lagging Indicator: spikes after prolonged overtime & engagement erosion)
      let absenteeismDays = 0.0;
      if (chronicFatigue > 0.24 && (engagementScore < 6.8 || overtimeHours > 8.5)) {
        const p = rand();
        if (p < 0.42) absenteeismDays = 0.0;
        else if (p < 0.72) absenteeismDays = 0.5;
        else if (p < 0.91) absenteeismDays = 1.0;
        else absenteeismDays = 1.5;
      } else {
        absenteeismDays = rand() < 0.05 ? 0.5 : 0.0;
      }

      // Deadline Met Percentage
      const deadlineMet = round(clamp(96.8 - overloadRatio * 48.0 - chronicFatigue * 11.5 + randGauss(0, 1.7), 58.0, 100.0), 1);

      // Performance Score (0-100)
      const perfScore = round(clamp(qualityScore * 4.6 + deadlineMet * 0.35 + engagementScore * 1.9 + randGauss(0, 1.2), 48.0, 99.0), 1);

      // Effective Productivity Index
      // Combines hourly point velocity with quality multiplier, revision rework penalty, and deadline timeliness
      const qualFactor = Math.pow(qualityScore / 9.1, 0.45);
      const reworkPenalty = 1.0 / (1.0 + 0.16 * Math.max(0.0, revCount - 1.15));
      const deadlineFactor = Math.pow(deadlineMet / 96.0, 0.35);
      const effProdIndex = round(prodPerHr * 172.0 * qualFactor * reworkPenalty * deadlineFactor, 1);

      empWeeks.push({
        Employee_ID: empId,
        Week_Start: wk.Week_Start,
        Month: wk.Month,
        Quarter: wk.Quarter,
        Department: dept,
        Role: role,
        Experience_Months: expMonths,
        Skill_Level: skill,
        Ads_Assigned: adsAssigned,
        Ads_Completed: adsCompleted,
        Workload_Points: workloadPoints,
        Working_Hours: workingHours,
        Overtime_Hours: overtimeHours,
        Overtime_Days: overtimeDays,
        Absenteeism_Days: absenteeismDays,
        Avg_Completion_Days: avgCompDays,
        Revision_Count: revCount,
        Quality_Score: qualityScore,
        Client_Satisfaction: clientSat,
        Engagement_Score: engagementScore,
        Performance_Score: perfScore,
        Deadline_Met_Percentage: deadlineMet,
        Sustainable_Capacity_Points: susCap,
        Capacity_Utilization_Percentage: capacityUtil,
        Productivity_Points_Per_Hour: prodPerHr,
        Effective_Productivity_Index: effProdIndex,
        _w_idx: w
      });
    }

    // Compute Employee's Historical Baseline Productivity (Weeks 0..25, H1 2025)
    let baseSum = 0;
    let baseCount = 0;
    for (let i = 0; i < 26; i++) {
      baseSum += empWeeks[i].Effective_Productivity_Index;
      baseCount++;
    }
    const baselineEff = round(baseSum / baseCount, 1);

    for (let i = 0; i < empWeeks.length; i++) {
      const r = empWeeks[i];
      r.Historical_Baseline_Productivity = baselineEff;
      r.Productivity_Change_Percentage = round(((r.Effective_Productivity_Index - baselineEff) / baselineEff) * 100.0, 1);

      const capU = r.Capacity_Utilization_Percentage;
      const otH = r.Overtime_Hours;
      const engS = r.Engagement_Score;
      const revC = r.Revision_Count;
      const absD = r.Absenteeism_Days;

      if ((capU > 114.0 && (otH >= 6.5 || revC >= 2.4 || engS <= 6.8 || absD >= 0.5)) || capU >= 122.0) {
        r.Workload_Risk = "High";
      } else if (capU >= 102.0 || otH >= 3.8 || engS <= 7.3 || revC >= 1.9) {
        r.Workload_Risk = "Medium";
      } else {
        r.Workload_Risk = "Low";
      }

      delete r._w_idx;
      rows.push(r);
    }
  }

  window.AGENCY_DATA = rows;
  return rows;
}

// Initialize dataset immediately
buildHistoricalDataset();

// CSV Export Utility for "Advertising_Agency_Creative_Capacity_Historical_Data.csv"
window.exportDatasetToCSV = function() {
  const data = window.AGENCY_DATA || [];
  if (!data.length) return;
  const headers = [
    "Employee_ID", "Week_Start", "Month", "Quarter", "Department", "Role",
    "Experience_Months", "Skill_Level", "Ads_Assigned", "Ads_Completed",
    "Workload_Points", "Working_Hours", "Overtime_Hours", "Overtime_Days",
    "Absenteeism_Days", "Avg_Completion_Days", "Revision_Count",
    "Quality_Score", "Client_Satisfaction", "Engagement_Score",
    "Performance_Score", "Deadline_Met_Percentage",
    "Sustainable_Capacity_Points", "Capacity_Utilization_Percentage",
    "Workload_Risk", "Productivity_Points_Per_Hour",
    "Effective_Productivity_Index", "Historical_Baseline_Productivity",
    "Productivity_Change_Percentage"
  ];
  const csvLines = [headers.join(",")];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const vals = headers.map(h => {
      const v = row[h];
      if (typeof v === "string" && v.includes(",")) return `"${v}"`;
      return v !== undefined && v !== null ? v : "";
    });
    csvLines.push(vals.join(","));
  }
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Advertising_Agency_Creative_Capacity_Historical_Data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// CSV Upload Parser so user can also load a custom CSV file if desired
window.parseUploadedCSV = function(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const numericFields = new Set([
    "Experience_Months", "Experience_Months_At_Start", "Ads_Assigned", "Ads_Completed",
    "Workload_Points", "Working_Hours", "Overtime_Hours", "Overtime_Days",
    "Absenteeism_Days", "Avg_Completion_Days", "Revision_Count",
    "Quality_Score", "Client_Satisfaction", "Engagement_Score",
    "Performance_Score", "Deadline_Met_Percentage",
    "Sustainable_Capacity_Points", "Capacity_Utilization_Percentage",
    "Productivity_Points_Per_Hour", "Effective_Productivity_Index",
    "Historical_Baseline_Productivity", "Productivity_Change_Percentage"
  ]);

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const parts = lines[i].split(",");
    const obj = {};
    headers.forEach((h, idx) => {
      let val = parts[idx] !== undefined ? parts[idx].trim().replace(/^"|"$/g, "") : "";
      if (numericFields.has(h) && val !== "" && !isNaN(Number(val))) {
        val = Number(val);
      }
      obj[h] = val;
    });
    parsed.push(obj);
  }
  return parsed;
};
