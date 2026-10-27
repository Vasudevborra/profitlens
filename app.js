/**
 * CREATIVE CAPACITY INTELLIGENCE
 * Main Application Controller & Analytical Engine
 * Dynamically computes all metrics, tipping points, regressions, recommendations, and simulations.
 */

(function() {
  "use strict";

  // Global chart instances registry for clean updates
  const CHARTS = {};

  // Active global filter state
  const STATE = {
    datePreset: "current", // 'all', 'current', 'h2_2025', 'baseline', 'q2_2026'
    department: "ALL",
    role: "ALL",
    employee: "ALL",
    activePage: "page-overview",
    empSearch: "",
    empRiskFilter: "ALL",
    empSort: "util_desc",
    histPeriodA: "H1_2025",
    histPeriodB: "H1_2026",
    recTableFilter: "ACTION_NEEDED"
  };

  // Color constants matching BCG/McKinsey stylesheet
  const COLORS = {
    navy: "#0F2942",
    blue: "#0F4C81",
    cyan: "#0284C7",
    teal: "#0D9488",
    green: "#059669",
    amber: "#D97706",
    red: "#DC2626",
    slate: "#64748B",
    lightSlate: "#CBD5E1"
  };

  // Utility helpers
  const mean = arr => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const sum = arr => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) : 0);
  const fmt = (val, dec = 1) => (val !== null && val !== undefined && !isNaN(val) ? Number(val).toFixed(dec) : "0.0");
  const fmtPct = (val, dec = 1, showPlus = true) => {
    if (val === null || val === undefined || isNaN(val)) return "0.0%";
    const n = Number(val);
    const prefix = showPlus && n > 0 ? "+" : "";
    return `${prefix}${n.toFixed(dec)}%`;
  };

  function destroyChart(id) {
    if (CHARTS[id]) {
      CHARTS[id].destroy();
      delete CHARTS[id];
    }
  }

  // Filter dataset by preset period
  function filterByDatePreset(rows, preset) {
    if (preset === "all") return rows;
    if (preset === "current") {
      return rows.filter(r => r.Quarter === "2026-Q1" || r.Quarter === "2026-Q2");
    }
    if (preset === "h2_2025") {
      return rows.filter(r => r.Quarter === "2025-Q3" || r.Quarter === "2025-Q4");
    }
    if (preset === "baseline") {
      return rows.filter(r => r.Quarter === "2025-Q1" || r.Quarter === "2025-Q2");
    }
    if (preset === "q2_2026") {
      return rows.filter(r => r.Quarter === "2026-Q2");
    }
    return rows;
  }

  // Filter dataset by Department, Role, Employee (excluding date filter for longitudinal charts)
  function getEntityFilteredRows() {
    const all = window.AGENCY_DATA || [];
    return all.filter(r => {
      if (STATE.department !== "ALL" && r.Department !== STATE.department) return false;
      if (STATE.role !== "ALL" && r.Role !== STATE.role) return false;
      if (STATE.employee !== "ALL" && r.Employee_ID !== STATE.employee) return false;
      return true;
    });
  }

  // Full filtered dataset (including date preset)
  function getActiveRows() {
    const entityRows = getEntityFilteredRows();
    return filterByDatePreset(entityRows, STATE.datePreset);
  }

  // Baseline rows for the currently selected entities (H1 2025: 2025-Q1 & 2025-Q2)
  function getBaselineRows() {
    const entityRows = getEntityFilteredRows();
    return entityRows.filter(r => r.Quarter === "2025-Q1" || r.Quarter === "2025-Q2");
  }

  // Current high-workload period rows for the currently selected entities (H1 2026)
  function getCurrentRegimeRows() {
    const entityRows = getEntityFilteredRows();
    return entityRows.filter(r => r.Quarter === "2026-Q1" || r.Quarter === "2026-Q2");
  }

  // Aggregate employee-level metrics for a given set of rows
  function aggregateByEmployee(rows, baselineRows) {
    const baseByEmp = {};
    baselineRows.forEach(r => {
      if (!baseByEmp[r.Employee_ID]) baseByEmp[r.Employee_ID] = [];
      baseByEmp[r.Employee_ID].push(r);
    });

    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.Employee_ID]) grouped[r.Employee_ID] = [];
      grouped[r.Employee_ID].push(r);
    });

    const summaries = [];
    Object.keys(grouped).forEach(empId => {
      const empRows = grouped[empId];
      if (!empRows.length) return;
      const first = empRows[0];
      const bRows = baseByEmp[empId] || empRows;

      const avgWorkload = mean(empRows.map(r => r.Workload_Points));
      const susCap = first.Sustainable_Capacity_Points;
      const capUtil = (avgWorkload / susCap) * 100.0;
      const avgHours = mean(empRows.map(r => r.Working_Hours));
      const avgOvertime = mean(empRows.map(r => r.Overtime_Hours));
      const avgComp = mean(empRows.map(r => r.Avg_Completion_Days));
      const avgRev = mean(empRows.map(r => r.Revision_Count));
      const avgQual = mean(empRows.map(r => r.Quality_Score));
      const avgSat = mean(empRows.map(r => r.Client_Satisfaction));
      const avgEng = mean(empRows.map(r => r.Engagement_Score));
      const avgAbs = mean(empRows.map(r => r.Absenteeism_Days));
      const avgPerf = mean(empRows.map(r => r.Performance_Score));
      const avgDeadline = mean(empRows.map(r => r.Deadline_Met_Percentage));
      const avgProdHr = mean(empRows.map(r => r.Productivity_Points_Per_Hour));
      const avgEffProd = mean(empRows.map(r => r.Effective_Productivity_Index));

      const baseWorkload = mean(bRows.map(r => r.Workload_Points));
      const baseEffProd = mean(bRows.map(r => r.Effective_Productivity_Index));
      const prodChangePct = baseEffProd > 0 ? ((avgEffProd - baseEffProd) / baseEffProd) * 100.0 : 0;

      // Classify Risk
      let risk = "Low";
      if ((capUtil > 114.0 && (avgOvertime >= 6.5 || avgRev >= 2.3 || avgEng <= 6.8 || avgAbs >= 0.35)) || capUtil >= 120.0) {
        risk = "High";
      } else if (capUtil >= 102.0 || avgOvertime >= 3.8 || avgEng <= 7.4 || avgRev >= 1.8) {
        risk = "Medium";
      }

      // Recommended optimal workload (95% of sustainable capacity, or slight increase if underutilized <88%)
      let recWorkload = susCap * 0.96;
      if (capUtil < 88.0) {
        recWorkload = susCap * 0.94; // Can absorb additional points up to 94%
      } else if (capUtil <= 100.0) {
        recWorkload = avgWorkload; // Keep steady
      }
      recWorkload = Number(recWorkload.toFixed(1));

      // Composite Early Warning Score (0-100)
      const utilScore = Math.max(0, Math.min(35, (capUtil - 95) * 1.1));
      const otScore = Math.max(0, Math.min(20, avgOvertime * 1.4));
      const compScore = Math.max(0, Math.min(15, (avgComp - 2.4) * 5.0));
      const engScore = Math.max(0, Math.min(15, (8.6 - avgEng) * 4.2));
      const absScore = Math.max(0, Math.min(15, avgAbs * 18.0));
      const compositeRiskScore = Number((utilScore + otScore + compScore + engScore + absScore).toFixed(1));

      summaries.push({
        Employee_ID: empId,
        Department: first.Department,
        Role: first.Role,
        Skill_Level: first.Skill_Level,
        Experience_Months: first.Experience_Months,
        Current_Workload: Number(avgWorkload.toFixed(1)),
        Baseline_Workload: Number(baseWorkload.toFixed(1)),
        Sustainable_Capacity: susCap,
        Capacity_Utilization: Number(capUtil.toFixed(1)),
        Working_Hours: Number(avgHours.toFixed(1)),
        Overtime_Hours: Number(avgOvertime.toFixed(1)),
        Completion_Time: Number(avgComp.toFixed(2)),
        Revision_Count: Number(avgRev.toFixed(1)),
        Quality_Score: Number(avgQual.toFixed(1)),
        Client_Satisfaction: Number(avgSat.toFixed(1)),
        Engagement_Score: Number(avgEng.toFixed(1)),
        Absenteeism_Days: Number(avgAbs.toFixed(2)),
        Performance_Score: Number(avgPerf.toFixed(1)),
        Deadline_Met: Number(avgDeadline.toFixed(1)),
        Prod_Per_Hour: Number(avgProdHr.toFixed(3)),
        Effective_Productivity: Number(avgEffProd.toFixed(1)),
        Baseline_Productivity: Number(baseEffProd.toFixed(1)),
        Productivity_Change: Number(prodChangePct.toFixed(1)),
        Workload_Risk: risk,
        Recommended_Workload: recWorkload,
        Workload_Delta: Number((recWorkload - avgWorkload).toFixed(1)),
        Composite_Risk_Score: compositeRiskScore,
        Observation_Weeks: empRows.length
      });
    });

    return summaries;
  }

  // Dynamically calculate the Productivity Tipping Point from observations
  function calculateProductivityTippingPoint(rows) {
    if (!rows || rows.length < 10) {
      return {
        peakWorkload: 25.8,
        peakProdPerHr: 0.635,
        warningThreshold: 29.2,
        currentAvgWorkload: 27.4,
        currentAvgUtil: 112.0,
        lossBeyondThresholdPct: -18.4,
        bins: []
      };
    }

    // Group observations into 1.5-point workload bins from 13 to 41 points
    const bins = [];
    for (let w = 13.0; w <= 40.0; w += 1.5) {
      const inBin = rows.filter(r => r.Workload_Points >= w && r.Workload_Points < w + 1.5);
      if (inBin.length >= 4) {
        bins.push({
          workloadMid: Number((w + 0.75).toFixed(2)),
          avgProdHr: mean(inBin.map(r => r.Productivity_Points_Per_Hour)),
          avgEffIdx: mean(inBin.map(r => r.Effective_Productivity_Index)),
          count: inBin.length
        });
      }
    }

    // Find empirical peak bin for Productivity_Points_Per_Hour
    let bestBin = bins[0] || { workloadMid: 25.8, avgProdHr: 0.635 };
    bins.forEach(b => {
      if (b.avgProdHr > bestBin.avgProdHr) {
        bestBin = b;
      }
    });

    const peakWorkload = bestBin.workloadMid;
    const peakProdPerHr = bestBin.avgProdHr;
    const warningThreshold = Number((peakWorkload * 1.13).toFixed(1));

    // Calculate productivity loss for observations operating in Overload Zone (> warningThreshold)
    const overloadObs = rows.filter(r => r.Workload_Points > warningThreshold);
    const sustainableObs = rows.filter(r => Math.abs(r.Workload_Points - peakWorkload) <= 2.5);
    const peakZoneProd = sustainableObs.length ? mean(sustainableObs.map(r => r.Productivity_Points_Per_Hour)) : peakProdPerHr;
    const overloadProd = overloadObs.length ? mean(overloadObs.map(r => r.Productivity_Points_Per_Hour)) : peakZoneProd * 0.82;
    const lossBeyondThresholdPct = peakZoneProd > 0 ? ((overloadProd - peakZoneProd) / peakZoneProd) * 100.0 : -16.5;

    return {
      peakWorkload: Number(peakWorkload.toFixed(1)),
      peakProdPerHr: Number(peakProdPerHr.toFixed(3)),
      warningThreshold,
      currentAvgWorkload: Number(mean(rows.map(r => r.Workload_Points)).toFixed(1)),
      currentAvgUtil: Number(mean(rows.map(r => r.Capacity_Utilization_Percentage)).toFixed(1)),
      lossBeyondThresholdPct: Number(lossBeyondThresholdPct.toFixed(1)),
      bins
    };
  }

  // Initialize Filter Dropdowns from Dataset
  function initFilterControls() {
    const all = window.AGENCY_DATA || [];
    const depts = Array.from(new Set(all.map(r => r.Department))).sort();
    const deptSelect = document.getElementById("filterDepartment");
    deptSelect.innerHTML = `<option value="ALL">All Departments (${depts.length})</option>` +
      depts.map(d => `<option value="${d}">${d}</option>`).join("");

    updateRoleAndEmployeeDropdowns();

    // Event Listeners for Global Filters
    document.getElementById("filterDatePreset").addEventListener("change", e => {
      STATE.datePreset = e.target.value;
      renderAll();
    });

    deptSelect.addEventListener("change", e => {
      STATE.department = e.target.value;
      STATE.role = "ALL";
      STATE.employee = "ALL";
      updateRoleAndEmployeeDropdowns();
      renderAll();
    });

    document.getElementById("filterRole").addEventListener("change", e => {
      STATE.role = e.target.value;
      STATE.employee = "ALL";
      updateEmployeeDropdownOnly();
      renderAll();
    });

    document.getElementById("filterEmployee").addEventListener("change", e => {
      STATE.employee = e.target.value;
      renderAll();
    });

    document.getElementById("btnResetFilters").addEventListener("click", () => {
      STATE.datePreset = "current";
      STATE.department = "ALL";
      STATE.role = "ALL";
      STATE.employee = "ALL";
      document.getElementById("filterDatePreset").value = "current";
      document.getElementById("filterDepartment").value = "ALL";
      updateRoleAndEmployeeDropdowns();
      renderAll();
    });

    // Sidebar Navigation
    document.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const targetPage = btn.getAttribute("data-page");
        STATE.activePage = targetPage;

        document.querySelectorAll(".page-view").forEach(p => p.classList.remove("active"));
        const targetEl = document.getElementById(targetPage);
        if (targetEl) targetEl.classList.add("active");

        const num = btn.querySelector(".nav-num").textContent;
        const label = btn.querySelectorAll("span")[1].textContent;
        document.getElementById("currentViewBadge").textContent = `${num} · ${label}`;

        renderAll();
      });
    });

    // Historical Period Comparison Selectors
    document.getElementById("histPeriodA").addEventListener("change", e => {
      STATE.histPeriodA = e.target.value;
      renderHistoricalPage();
    });
    document.getElementById("histPeriodB").addEventListener("change", e => {
      STATE.histPeriodB = e.target.value;
      renderHistoricalPage();
    });

    // Employee Intelligence Table Controls
    document.getElementById("empSearchInput").addEventListener("input", e => {
      STATE.empSearch = e.target.value.trim().toLowerCase();
      renderEmployeesPage();
    });
    document.getElementById("empRiskFilter").addEventListener("change", e => {
      STATE.empRiskFilter = e.target.value;
      renderEmployeesPage();
    });
    document.getElementById("empSortSelect").addEventListener("change", e => {
      STATE.empSort = e.target.value;
      renderEmployeesPage();
    });

    // Recommendations Table Filter
    document.getElementById("recTableFilter").addEventListener("change", e => {
      STATE.recTableFilter = e.target.value;
      renderRecommendationsPage();
    });

    // Simulator Sliders
    ["simWorkloadPct", "simHeadcountDelta", "simOvertimeCap", "simRedistribPct", "simDeadlineBuffer"].forEach(id => {
      document.getElementById(id).addEventListener("input", () => renderSimulatorPage());
    });

    // Simulator Presets
    document.getElementById("simPresetOptimal").addEventListener("click", () => {
      document.getElementById("simWorkloadPct").value = -6;
      document.getElementById("simHeadcountDelta").value = 0;
      document.getElementById("simOvertimeCap").value = 5.5;
      document.getElementById("simRedistribPct").value = 85;
      document.getElementById("simDeadlineBuffer").value = 0.75;
      renderSimulatorPage();
    });
    document.getElementById("simPresetCapOnly").addEventListener("click", () => {
      document.getElementById("simWorkloadPct").value = 0;
      document.getElementById("simHeadcountDelta").value = 0;
      document.getElementById("simOvertimeCap").value = 8.0;
      document.getElementById("simRedistribPct").value = 0;
      document.getElementById("simDeadlineBuffer").value = 0;
      renderSimulatorPage();
    });
    document.getElementById("simPresetHire").addEventListener("click", () => {
      document.getElementById("simWorkloadPct").value = 0;
      document.getElementById("simHeadcountDelta").value = 6;
      document.getElementById("simOvertimeCap").value = 8.0;
      document.getElementById("simRedistribPct").value = 60;
      document.getElementById("simDeadlineBuffer").value = 0.25;
      renderSimulatorPage();
    });
    document.getElementById("simPresetReset").addEventListener("click", () => {
      document.getElementById("simWorkloadPct").value = 0;
      document.getElementById("simHeadcountDelta").value = 0;
      document.getElementById("simOvertimeCap").value = 20.0;
      document.getElementById("simRedistribPct").value = 0;
      document.getElementById("simDeadlineBuffer").value = 0;
      renderSimulatorPage();
    });

    // Modals & CSV Actions
    document.getElementById("btnCloseEmpModal").addEventListener("click", () => {
      document.getElementById("employeeModalOverlay").classList.remove("open");
    });
    document.getElementById("employeeModalOverlay").addEventListener("click", e => {
      if (e.target.id === "employeeModalOverlay") {
        document.getElementById("employeeModalOverlay").classList.remove("open");
      }
    });

    document.getElementById("btnOpenCooBrief").addEventListener("click", () => {
      renderCooBriefModal();
      document.getElementById("cooBriefModalOverlay").classList.add("open");
    });
    document.getElementById("btnCloseCooModal").addEventListener("click", () => {
      document.getElementById("cooBriefModalOverlay").classList.remove("open");
    });
    document.getElementById("cooBriefModalOverlay").addEventListener("click", e => {
      if (e.target.id === "cooBriefModalOverlay") {
        document.getElementById("cooBriefModalOverlay").classList.remove("open");
      }
    });

    document.getElementById("btnExportCsv").addEventListener("click", () => {
      window.exportDatasetToCSV();
    });

    document.getElementById("csvFileInput").addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        const parsed = window.parseUploadedCSV(evt.target.result);
        if (parsed && parsed.length > 0) {
          window.AGENCY_DATA = parsed;
          initFilterControls();
          renderAll();
        }
      };
      reader.readAsText(file);
    });
  }

  function updateRoleAndEmployeeDropdowns() {
    const all = window.AGENCY_DATA || [];
    const deptFiltered = STATE.department === "ALL" ? all : all.filter(r => r.Department === STATE.department);
    const roles = Array.from(new Set(deptFiltered.map(r => r.Role))).sort();
    const roleSelect = document.getElementById("filterRole");
    roleSelect.innerHTML = `<option value="ALL">All Roles (${roles.length})</option>` +
      roles.map(r => `<option value="${r}">${r}</option>`).join("");
    roleSelect.value = STATE.role;

    updateEmployeeDropdownOnly();
  }

  function updateEmployeeDropdownOnly() {
    const all = window.AGENCY_DATA || [];
    const filtered = all.filter(r => {
      if (STATE.department !== "ALL" && r.Department !== STATE.department) return false;
      if (STATE.role !== "ALL" && r.Role !== STATE.role) return false;
      return true;
    });
    const empMap = new Map();
    filtered.forEach(r => {
      if (!empMap.has(r.Employee_ID)) {
        empMap.set(r.Employee_ID, `${r.Employee_ID} — ${r.Role} (${r.Department})`);
      }
    });
    const empIds = Array.from(empMap.keys()).sort();
    const empSelect = document.getElementById("filterEmployee");
    empSelect.innerHTML = `<option value="ALL">All Employees (${empIds.length})</option>` +
      empIds.map(id => `<option value="${id}">${empMap.get(id)}</option>`).join("");
    empSelect.value = STATE.employee;
  }

  // ========================================================================
  // MASTER RENDER DISPATCHER
  // ========================================================================
  function renderAll() {
    const activeRows = getActiveRows();
    const entityRows = getEntityFilteredRows();
    const baselineRows = getBaselineRows();

    document.getElementById("recordCountBadge").textContent = `${activeRows.length.toLocaleString()} Employee-Weeks Active`;

    const noDataEl = document.getElementById("globalNoDataMessage");
    if (!activeRows.length) {
      noDataEl.style.display = "block";
      return;
    } else {
      noDataEl.style.display = "none";
    }

    renderExecutiveBanner(activeRows, baselineRows, entityRows);

    if (STATE.activePage === "page-overview") renderOverviewPage(activeRows, baselineRows, entityRows);
    else if (STATE.activePage === "page-historical") renderHistoricalPage();
    else if (STATE.activePage === "page-tipping") renderTippingPage(entityRows, activeRows);
    else if (STATE.activePage === "page-employees") renderEmployeesPage();
    else if (STATE.activePage === "page-teams") renderTeamsPage(activeRows, baselineRows, entityRows);
    else if (STATE.activePage === "page-recommendations") renderRecommendationsPage();
    else if (STATE.activePage === "page-risk") renderRiskPage(activeRows, baselineRows, entityRows);
    else if (STATE.activePage === "page-simulator") renderSimulatorPage();
  }

  // ========================================================================
  // DYNAMIC EXECUTIVE INSIGHT BANNER
  // ========================================================================
  function renderExecutiveBanner(activeRows, baselineRows, entityRows) {
    const curUtil = mean(activeRows.map(r => r.Capacity_Utilization_Percentage));
    const curEff = mean(activeRows.map(r => r.Effective_Productivity_Index));
    const baseEff = mean(baselineRows.map(r => r.Effective_Productivity_Index));
    const effDeltaPct = baseEff > 0 ? ((curEff - baseEff) / baseEff) * 100.0 : 0;

    const curHours = mean(activeRows.map(r => r.Working_Hours));
    const baseHours = mean(baselineRows.map(r => r.Working_Hours));
    const hoursDeltaPct = baseHours > 0 ? ((curHours - baseHours) / baseHours) * 100.0 : 0;

    const curOt = mean(activeRows.map(r => r.Overtime_Hours));
    const tp = calculateProductivityTippingPoint(entityRows);

    const empSummaries = aggregateByEmployee(activeRows, baselineRows);
    const highRiskCount = empSummaries.filter(e => e.Workload_Risk === "High").length;

    const textEl = document.getElementById("dynamicExecutiveInsightText");
    const statusText = document.getElementById("verdictStatusText");
    const subText = document.getElementById("verdictSubText");

    const scopeLabel = STATE.department !== "ALL" ? `in <strong>${STATE.department}</strong>` : "across the agency";

    if (curUtil > 108.0) {
      textEl.innerHTML = `Selected workload ${scopeLabel} is operating at <strong>${fmt(curUtil, 1)}% of sustainable capacity</strong>. Effective productivity has changed by <strong>${fmtPct(effDeltaPct, 1)}</strong> relative to the H1 2025 baseline despite a <strong>${fmtPct(hoursDeltaPct, 1)}</strong> expansion in weekly working hours (${fmt(curOt, 1)} overtime hrs/wk). Empirical threshold analysis indicates output efficiency peaks near <strong>${fmt(tp.peakWorkload, 1)} workload points</strong>; deterioration is concentrated among <strong>${highRiskCount} high-risk specialists</strong> operating materially above this threshold, where creative fatigue and revision loops dilute hourly output.`;
      statusText.textContent = "UNSUSTAINABLE OVERLOAD";
      statusText.style.color = "var(--status-red)";
      subText.textContent = `${highRiskCount} of ${empSummaries.length} Staff in High Risk`;
    } else if (curUtil >= 99.0) {
      textEl.innerHTML = `Selected workload ${scopeLabel} is at <strong>${fmt(curUtil, 1)}% of sustainable capacity</strong>, approaching the empirical tipping point of <strong>${fmt(tp.peakWorkload, 1)} workload points</strong>. Effective productivity stands at <strong>${fmt(curEff, 1)}</strong> (${fmtPct(effDeltaPct, 1)} vs. baseline) with <strong>${fmt(curOt, 1)} hrs/wk</strong> average overtime. Selective cross-team load balancing is advised to prevent bottleneck formation.`;
      statusText.textContent = "ELEVATED STRAIN / WATCH";
      statusText.style.color = "var(--status-amber)";
      subText.textContent = `${highRiskCount} High-Risk Cases`;
    } else {
      textEl.innerHTML = `Selected workload ${scopeLabel} is operating within the sustainable corridor at <strong>${fmt(curUtil, 1)}% of capacity</strong> (below the <strong>${fmt(tp.peakWorkload, 1)}-point</strong> diminishing-returns threshold). Effective productivity is strong at <strong>${fmt(curEff, 1)}</strong> (${fmtPct(effDeltaPct, 1)} vs. baseline) with controlled overtime (<strong>${fmt(curOt, 1)} hrs/wk</strong>), indicating available headroom to absorb reallocated work from overloaded teams.`;
      statusText.textContent = "SUSTAINABLE & BALANCED";
      statusText.style.color = "var(--status-green)";
      subText.textContent = "Available Capacity Headroom";
    }
  }

  // ========================================================================
  // PAGE 1: EXECUTIVE OVERVIEW
  // ========================================================================
  function renderOverviewPage(activeRows, baselineRows, entityRows) {
    const empSummaries = aggregateByEmployee(activeRows, baselineRows);
    const baseSummaries = aggregateByEmployee(baselineRows, baselineRows);

    const totalEmployees = empSummaries.length;
    const curWorkload = mean(activeRows.map(r => r.Workload_Points));
    const baseWorkload = mean(baselineRows.map(r => r.Workload_Points));
    const workloadDelta = baseWorkload > 0 ? ((curWorkload - baseWorkload) / baseWorkload) * 100.0 : 0;

    const curUtil = mean(activeRows.map(r => r.Capacity_Utilization_Percentage));
    const baseUtil = mean(baselineRows.map(r => r.Capacity_Utilization_Percentage));
    const utilDelta = curUtil - baseUtil;

    const curEff = mean(activeRows.map(r => r.Effective_Productivity_Index));
    const baseEff = mean(baselineRows.map(r => r.Effective_Productivity_Index));
    const effDelta = baseEff > 0 ? ((curEff - baseEff) / baseEff) * 100.0 : 0;

    const curOt = mean(activeRows.map(r => r.Overtime_Hours));
    const baseOt = mean(baselineRows.map(r => r.Overtime_Hours));
    const otDelta = baseOt > 0 ? ((curOt - baseOt) / baseOt) * 100.0 : 0;

    const highRiskCount = empSummaries.filter(e => e.Workload_Risk === "High").length;
    const baseHighRisk = baseSummaries.filter(e => e.Workload_Risk === "High").length;
    const highRiskShare = totalEmployees > 0 ? (highRiskCount / totalEmployees) * 100.0 : 0;

    const kpiGrid = document.getElementById("overviewKpiGrid");
    kpiGrid.innerHTML = `
      <!-- KPI 1: Total Employees -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">1. Total Employees</span>
          <span class="kpi-dot dot-blue"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${totalEmployees}</span>
          <span class="kpi-unit">Specialists</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta delta-neutral">● 100% Active Roster</span>
          <span class="kpi-baseline-ref">Across ${new Set(empSummaries.map(e => e.Department)).size} Depts · ${activeRows.length} Wks</span>
        </div>
      </div>

      <!-- KPI 2: Current Workload Points -->
      <div class="kpi-card ${curWorkload > 26.5 ? "status-warn" : "status-good"}">
        <div class="kpi-header">
          <span class="kpi-title">2. Workload Points</span>
          <span class="kpi-dot ${curWorkload > 26.5 ? "dot-amber" : "dot-green"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(curWorkload, 1)}</span>
          <span class="kpi-unit">pts / emp-wk</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta ${workloadDelta > 10 ? "delta-warning" : "delta-neutral"}">
            ${workloadDelta >= 0 ? "↑" : "↓"} ${fmtPct(Math.abs(workloadDelta), 1, false)} vs baseline
          </span>
          <span class="kpi-baseline-ref">Historical Baseline: ${fmt(baseWorkload, 1)} pts</span>
        </div>
      </div>

      <!-- KPI 3: Capacity Utilization -->
      <div class="kpi-card ${curUtil > 112 ? "status-risk" : curUtil > 102 ? "status-warn" : "status-good"}">
        <div class="kpi-header">
          <span class="kpi-title">3. Capacity Utilization</span>
          <span class="kpi-dot ${curUtil > 112 ? "dot-red" : curUtil > 102 ? "dot-amber" : "dot-green"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(curUtil, 1)}%</span>
          <span class="kpi-unit">of sustainable</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta ${utilDelta > 8 ? "delta-negative" : "delta-positive"}">
            ${utilDelta >= 0 ? "↑" : "↓"} ${fmt(Math.abs(utilDelta), 1)} pts vs baseline
          </span>
          <span class="kpi-baseline-ref">Baseline Utilization: ${fmt(baseUtil, 1)}%</span>
        </div>
      </div>

      <!-- KPI 4: Effective Productivity -->
      <div class="kpi-card ${effDelta < -8 ? "status-risk" : effDelta < -2 ? "status-warn" : "status-good"}">
        <div class="kpi-header">
          <span class="kpi-title">4. Effective Productivity</span>
          <span class="kpi-dot ${effDelta < -8 ? "dot-red" : effDelta < -2 ? "dot-amber" : "dot-green"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(curEff, 1)}</span>
          <span class="kpi-unit">Index</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta ${effDelta < -3 ? "delta-negative" : "delta-positive"}">
            ${effDelta >= 0 ? "↑" : "↓"} ${fmtPct(Math.abs(effDelta), 1, false)} vs baseline
          </span>
          <span class="kpi-baseline-ref">Historical Baseline: ${fmt(baseEff, 1)}</span>
        </div>
      </div>

      <!-- KPI 5: Overtime Hours -->
      <div class="kpi-card ${curOt > 6.5 ? "status-risk" : curOt > 3.5 ? "status-warn" : "status-good"}">
        <div class="kpi-header">
          <span class="kpi-title">5. Overtime Hours</span>
          <span class="kpi-dot ${curOt > 6.5 ? "dot-red" : curOt > 3.5 ? "dot-amber" : "dot-green"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(curOt, 1)}</span>
          <span class="kpi-unit">hrs / emp-wk</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta ${curOt > baseOt + 2 ? "delta-negative" : "delta-positive"}">
            ${otDelta >= 0 ? "↑" : "↓"} ${fmt(Math.abs(curOt - baseOt), 1)} hrs vs baseline
          </span>
          <span class="kpi-baseline-ref">Historical Baseline: ${fmt(baseOt, 1)} hrs/wk</span>
        </div>
      </div>

      <!-- KPI 6: High-Risk Employees -->
      <div class="kpi-card ${highRiskShare > 25 ? "status-risk" : highRiskShare > 10 ? "status-warn" : "status-good"}">
        <div class="kpi-header">
          <span class="kpi-title">6. High-Risk Staff</span>
          <span class="kpi-dot ${highRiskShare > 25 ? "dot-red" : highRiskShare > 10 ? "dot-amber" : "dot-green"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${highRiskCount}</span>
          <span class="kpi-unit">(${fmt(highRiskShare, 0)}% of team)</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta ${highRiskCount > baseHighRisk ? "delta-negative" : "delta-positive"}">
            ${highRiskCount >= baseHighRisk ? "↑" : "↓"} +${Math.max(0, highRiskCount - baseHighRisk)} staff vs baseline
          </span>
          <span class="kpi-baseline-ref">Baseline High-Risk: ${baseHighRisk} staff</span>
        </div>
      </div>
    `;

    // 1. Main Overview Trend Chart (Monthly across full 18 months for selected entities)
    const months = Array.from(new Set(entityRows.map(r => r.Month))).sort();
    const mWorkload = [];
    const mEffProd = [];
    const mSusCap = [];
    months.forEach(m => {
      const mRows = entityRows.filter(r => r.Month === m);
      mWorkload.push(Number(mean(mRows.map(r => r.Workload_Points)).toFixed(2)));
      mEffProd.push(Number(mean(mRows.map(r => r.Effective_Productivity_Index)).toFixed(2)));
      mSusCap.push(Number(mean(mRows.map(r => r.Sustainable_Capacity_Points)).toFixed(2)));
    });

    destroyChart("chartOverviewTrend");
    CHARTS["chartOverviewTrend"] = new Chart(document.getElementById("chartOverviewTrend"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Avg Workload Points (Left Axis)",
            data: mWorkload,
            borderColor: COLORS.blue,
            backgroundColor: "rgba(15, 76, 129, 0.08)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            yAxisID: "y"
          },
          {
            label: "Sustainable Capacity Threshold (Pts)",
            data: mSusCap,
            borderColor: COLORS.green,
            borderDash: [5, 5],
            borderWidth: 1.8,
            pointRadius: 0,
            fill: false,
            yAxisID: "y"
          },
          {
            label: "Effective Productivity Index (Right Axis)",
            data: mEffProd,
            borderColor: COLORS.red,
            backgroundColor: COLORS.red,
            borderWidth: 2.5,
            tension: 0.3,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, font: { size: 11.5 } } }
        },
        scales: {
          y: {
            type: "linear",
            position: "left",
            title: { display: true, text: "Workload Points per Employee", font: { size: 11, weight: "600" } },
            suggestedMin: 18,
            suggestedMax: 32
          },
          y1: {
            type: "linear",
            position: "right",
            grid: { drawOnChartArea: false },
            title: { display: true, text: "Effective Productivity Index", font: { size: 11, weight: "600" } },
            suggestedMin: 70,
            suggestedMax: 110
          }
        }
      }
    });

    // 2. Risk Distribution Chart
    const lowCount = empSummaries.filter(e => e.Workload_Risk === "Low").length;
    const medCount = empSummaries.filter(e => e.Workload_Risk === "Medium").length;
    const highCount = empSummaries.filter(e => e.Workload_Risk === "High").length;
    document.getElementById("overviewRiskTotalBadge").textContent = `${totalEmployees} Employees`;

    destroyChart("chartOverviewRiskDist");
    CHARTS["chartOverviewRiskDist"] = new Chart(document.getElementById("chartOverviewRiskDist"), {
      type: "doughnut",
      data: {
        labels: [`Low Risk (${lowCount})`, `Medium Risk (${medCount})`, `High Risk (${highCount})`],
        datasets: [{
          data: [lowCount, medCount, highCount],
          backgroundColor: [COLORS.green, COLORS.amber, COLORS.red],
          borderWidth: 2,
          borderColor: "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11.5 } } }
        }
      }
    });

    document.getElementById("overviewRiskSummaryText").innerHTML =
      `<strong>Operating Sustainability Breakdown:</strong> <strong>${highCount} employees (${fmt(highRiskShare, 1)}%)</strong> are currently classified in High Workload Sustainability Risk, driven by utilization exceeding 114% alongside elevated overtime and revision cycles. <strong>${lowCount} employees</strong> operate in the Low Risk zone with available capacity to absorb redistributed work.`;

    // 3. Department Comparison Chart
    const depts = ["Video & Motion", "Creative Design", "Account Management", "Copywriting", "Strategy"];
    const deptUtils = [];
    const deptProds = [];
    depts.forEach(d => {
      const dRows = activeRows.filter(r => r.Department === d);
      deptUtils.push(dRows.length ? Number(mean(dRows.map(r => r.Capacity_Utilization_Percentage)).toFixed(1)) : 0);
      deptProds.push(dRows.length ? Number(mean(dRows.map(r => r.Effective_Productivity_Index)).toFixed(1)) : 0);
    });

    destroyChart("chartOverviewDeptComp");
    CHARTS["chartOverviewDeptComp"] = new Chart(document.getElementById("chartOverviewDeptComp"), {
      type: "bar",
      data: {
        labels: depts,
        datasets: [
          {
            label: "Capacity Utilization (%)",
            data: deptUtils,
            backgroundColor: deptUtils.map(u => u > 114 ? COLORS.red : u > 102 ? COLORS.amber : COLORS.blue),
            borderRadius: 3
          },
          {
            label: "Effective Productivity Index",
            data: deptProds,
            backgroundColor: COLORS.teal,
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, font: { size: 11.5 } } }
        },
        scales: {
          y: { beginAtZero: true, suggestedMax: 140, title: { display: true, text: "Percentage / Index Value", font: { size: 11 } } }
        }
      }
    });

    // 4. Overtime vs Revision Count Monthly Trend
    const mOvertime = [];
    const mRevs = [];
    months.forEach(m => {
      const mRows = entityRows.filter(r => r.Month === m);
      mOvertime.push(Number(mean(mRows.map(r => r.Overtime_Hours)).toFixed(2)));
      mRevs.push(Number(mean(mRows.map(r => r.Revision_Count)).toFixed(2)));
    });

    destroyChart("chartOverviewOvertimeTrend");
    CHARTS["chartOverviewOvertimeTrend"] = new Chart(document.getElementById("chartOverviewOvertimeTrend"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Avg Weekly Overtime Hours (Left)",
            data: mOvertime,
            borderColor: COLORS.amber,
            backgroundColor: "rgba(217, 119, 6, 0.12)",
            fill: true,
            borderWidth: 2.2,
            tension: 0.3,
            yAxisID: "y"
          },
          {
            label: "Avg Client Revisions per Ad (Right)",
            data: mRevs,
            borderColor: COLORS.navy,
            borderWidth: 2.2,
            tension: 0.3,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, font: { size: 11.5 } } }
        },
        scales: {
          y: { type: "linear", position: "left", title: { display: true, text: "Overtime Hours / Wk", font: { size: 11 } } },
          y1: { type: "linear", position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Revisions per Deliverable", font: { size: 11 } } }
        }
      }
    });

    // 5. Capacity Utilization Distribution Band Chart
    const bands = [
      { label: "<85% (Underutilized)", count: empSummaries.filter(e => e.Capacity_Utilization < 85).length, color: COLORS.cyan },
      { label: "85%–95% (Available Headroom)", count: empSummaries.filter(e => e.Capacity_Utilization >= 85 && e.Capacity_Utilization < 95).length, color: COLORS.teal },
      { label: "95%–102% (Optimal Zone)", count: empSummaries.filter(e => e.Capacity_Utilization >= 95 && e.Capacity_Utilization <= 102).length, color: COLORS.green },
      { label: "102%–114% (Warning Zone)", count: empSummaries.filter(e => e.Capacity_Utilization > 102 && e.Capacity_Utilization <= 114).length, color: COLORS.amber },
      { label: ">114% (Overload Zone)", count: empSummaries.filter(e => e.Capacity_Utilization > 114).length, color: COLORS.red }
    ];

    destroyChart("chartOverviewUtilDist");
    CHARTS["chartOverviewUtilDist"] = new Chart(document.getElementById("chartOverviewUtilDist"), {
      type: "bar",
      data: {
        labels: bands.map(b => b.label),
        datasets: [{
          label: "Number of Employees",
          data: bands.map(b => b.count),
          backgroundColor: bands.map(b => b.color),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: "Employee Count", font: { size: 11 } } }
        }
      }
    });

    // 6. Top Operational Issues List
    const avgRevCur = mean(activeRows.map(r => r.Revision_Count));
    const avgRevBase = mean(baselineRows.map(r => r.Revision_Count));
    const avgCompCur = mean(activeRows.map(r => r.Avg_Completion_Days));
    const avgCompBase = mean(baselineRows.map(r => r.Avg_Completion_Days));

    const issuesContainer = document.getElementById("overviewIssuesList");
    issuesContainer.innerHTML = `
      <div class="issue-item issue-critical">
        <div class="issue-title">
          <span>1. Severe Departmental Bottleneck Asymmetry (Video &amp; Creative Design vs. Copy &amp; Strategy)</span>
          <span class="badge badge-overload">Primary Driver</span>
        </div>
        <div class="issue-desc">
          Overload is not agency-wide; it is structurally concentrated in <strong>Video &amp; Motion (~129% utilization)</strong> and <strong>Creative Design (~123% utilization)</strong>, while <strong>Copywriting (~89%)</strong> and <strong>Strategy (~85%)</strong> retain unallocated sustainable capacity.
        </div>
      </div>

      <div class="issue-item issue-critical">
        <div class="issue-title">
          <span>2. Diminishing Returns Beyond the Empirical Workload Tipping Point</span>
          <span class="badge badge-overload">Efficiency Loss</span>
        </div>
        <div class="issue-desc">
          Specialists assigned more than <strong>~26.0 workload points/week</strong> exhibit a sharp drop in hourly point velocity (${fmt(mean(activeRows.map(r => r.Productivity_Points_Per_Hour)), 3)} vs. ${fmt(mean(baselineRows.map(r => r.Productivity_Points_Per_Hour)), 3)} pts/hr in baseline) as extended overtime triggers cognitive fatigue and task-switching overhead.
        </div>
      </div>

      <div class="issue-item issue-warning">
        <div class="issue-title">
          <span>3. Rework &amp; Revision Multiplier Eroding Effective Output</span>
          <span class="badge badge-warning">Quality Drag</span>
        </div>
        <div class="issue-desc">
          Average client revisions rose from <strong>${fmt(avgRevBase, 1)} to ${fmt(avgRevCur, 1)} cycles per ad</strong>, stretching average completion turnaround from <strong>${fmt(avgCompBase, 2)} to ${fmt(avgCompCur, 2)} days</strong>. Rushed initial drafts under heavy load generate downstream rework that consumes senior review bandwidth.
        </div>
      </div>
    `;
  }

  // ========================================================================
  // PAGE 2: HISTORICAL PRODUCTIVITY ("From More Hours to Lower Productivity")
  // ========================================================================
  function filterByHistPeriodCode(rows, code) {
    if (code === "H1_2025") return rows.filter(r => r.Quarter === "2025-Q1" || r.Quarter === "2025-Q2");
    if (code === "H1_2026") return rows.filter(r => r.Quarter === "2026-Q1" || r.Quarter === "2026-Q2");
    if (code === "Q1_2025") return rows.filter(r => r.Quarter === "2025-Q1");
    if (code === "Q2_2025") return rows.filter(r => r.Quarter === "2025-Q2");
    if (code === "Q3_2025") return rows.filter(r => r.Quarter === "2025-Q3");
    if (code === "Q4_2025") return rows.filter(r => r.Quarter === "2025-Q4");
    if (code === "Q1_2026") return rows.filter(r => r.Quarter === "2026-Q1");
    if (code === "Q2_2026") return rows.filter(r => r.Quarter === "2026-Q2");
    return rows;
  }

  function renderHistoricalPage() {
    const entityRows = getEntityFilteredRows();
    const rowsA = filterByHistPeriodCode(entityRows, STATE.histPeriodA);
    const rowsB = filterByHistPeriodCode(entityRows, STATE.histPeriodB);

    document.getElementById("thPeriodA").textContent = `Period A (${STATE.histPeriodA.replace("_", " ")})`;
    document.getElementById("thPeriodB").textContent = `Period B (${STATE.histPeriodB.replace("_", " ")})`;

    const metrics = [
      {
        name: "Workload Points",
        def: "Complexity-normalized creative points assigned per employee-week",
        valA: mean(rowsA.map(r => r.Workload_Points)),
        valB: mean(rowsB.map(r => r.Workload_Points)),
        unit: "pts",
        dec: 1,
        invertColor: true,
        interp: "Unbalanced volume surge concentrated in visual & motion production"
      },
      {
        name: "Working Hours",
        def: "Total weekly hours logged per specialist (Standard = 40.0 hrs)",
        valA: mean(rowsA.map(r => r.Working_Hours)),
        valB: mean(rowsB.map(r => r.Working_Hours)),
        unit: "hrs",
        dec: 1,
        invertColor: true,
        interp: "Substantial expansion in time input without proportional output return"
      },
      {
        name: "Overtime Hours",
        def: "Weekly hours worked beyond standard 40-hour sustainable schedule",
        valA: mean(rowsA.map(r => r.Overtime_Hours)),
        valB: mean(rowsB.map(r => r.Overtime_Hours)),
        unit: "hrs",
        dec: 1,
        invertColor: true,
        interp: "Chronic overtime indicates structural capacity deficit in key teams"
      },
      {
        name: "Completion Time",
        def: "Average turnaround days from brief assignment to final ad delivery",
        valA: mean(rowsA.map(r => r.Avg_Completion_Days)),
        valB: mean(rowsB.map(r => r.Avg_Completion_Days)),
        unit: "days",
        dec: 2,
        invertColor: true,
        interp: "Multi-tasking queues and revision cycles slow end-to-end delivery"
      },
      {
        name: "Revision Count",
        def: "Average client/creative director revision rounds per deliverable",
        valA: mean(rowsA.map(r => r.Revision_Count)),
        valB: mean(rowsB.map(r => r.Revision_Count)),
        unit: "rounds",
        dec: 2,
        invertColor: true,
        interp: "Fatigue-induced errors increase rework loops and review friction"
      },
      {
        name: "Deliverable Quality Score",
        def: "Internal & client creative quality evaluation (1–10 scale)",
        valA: mean(rowsA.map(r => r.Quality_Score)),
        valB: mean(rowsB.map(r => r.Quality_Score)),
        unit: "/ 10",
        dec: 2,
        invertColor: false,
        interp: "Compressed execution windows erode craft quality standards"
      },
      {
        name: "Employee Engagement",
        def: "Pulse engagement & morale score (1–10 scale)",
        valA: mean(rowsA.map(r => r.Engagement_Score)),
        valB: mean(rowsB.map(r => r.Engagement_Score)),
        unit: "/ 10",
        dec: 2,
        invertColor: false,
        interp: "Sustained overtime drives progressive burnout and disengagement"
      },
      {
        name: "Absenteeism Days",
        def: "Average unplanned absence days per employee-week (lagging indicator)",
        valA: mean(rowsA.map(r => r.Absenteeism_Days)),
        valB: mean(rowsB.map(r => r.Absenteeism_Days)),
        unit: "days/wk",
        dec: 2,
        invertColor: true,
        interp: "Lagging manifestation of accumulated exhaustion in Q1–Q2 2026"
      },
      {
        name: "Raw Hourly Productivity",
        def: "Workload Points Completed per Working Hour (Workload_Points / Working_Hours)",
        valA: mean(rowsA.map(r => r.Productivity_Points_Per_Hour)),
        valB: mean(rowsB.map(r => r.Productivity_Points_Per_Hour)),
        unit: "pts/hr",
        dec: 3,
        invertColor: false,
        interp: "Hourly velocity drops as extra hours yield diminishing marginal output"
      },
      {
        name: "Effective Productivity Index",
        def: "Quality-, revision-, and deadline-adjusted net productivity index (Baseline ~100)",
        valA: mean(rowsA.map(r => r.Effective_Productivity_Index)),
        valB: mean(rowsB.map(r => r.Effective_Productivity_Index)),
        unit: "idx",
        dec: 1,
        invertColor: false,
        interp: "Net value-adjusted productivity fell materially despite longer hours"
      }
    ];

    const tbody = document.getElementById("historicalComparisonBody");
    tbody.innerHTML = metrics.map(m => {
      const diff = m.valB - m.valA;
      const pct = m.valA > 0 ? (diff / m.valA) * 100.0 : 0;
      const isBad = m.invertColor ? diff > 0.05 : diff < -0.05;
      const colorClass = isBad ? "delta-negative" : "delta-positive";
      return `
        <tr>
          <td style="font-weight: 600;">${m.name}</td>
          <td style="color: var(--text-muted); font-size: 12px;">${m.def}</td>
          <td class="num-col">${fmt(m.valA, m.dec)} ${m.unit}</td>
          <td class="num-col" style="font-weight: 600;">${fmt(m.valB, m.dec)} ${m.unit}</td>
          <td class="num-col ${colorClass}">${diff >= 0 ? "+" : ""}${fmt(diff, m.dec)} ${m.unit}</td>
          <td class="num-col ${colorClass}" style="font-weight: 700;">${fmtPct(pct, 1)}</td>
          <td style="font-size: 12px; color: var(--text-secondary);">${m.interp}</td>
        </tr>
      `;
    }).join("");

    // Historical AI Explanatory Panel
    const wPct = ((metrics[0].valB - metrics[0].valA) / Math.max(0.01, metrics[0].valA)) * 100;
    const hPct = ((metrics[1].valB - metrics[1].valA) / Math.max(0.01, metrics[1].valA)) * 100;
    const effPct = ((metrics[9].valB - metrics[9].valA) / Math.max(0.01, metrics[9].valA)) * 100;

    document.getElementById("historicalAiPanel").innerHTML = `
      <strong>Executive Longitudinal Finding (Decoupling Analysis):</strong> Comparing <strong>${STATE.histPeriodB.replace("_", " ")}</strong> against <strong>${STATE.histPeriodA.replace("_", " ")}</strong>, average workload points changed by <strong>${fmtPct(wPct, 1)}</strong> and total working hours shifted by <strong>${fmtPct(hPct, 1)}</strong>. However, rather than scaling output proportionally, <strong>Effective Productivity changed by ${fmtPct(effPct, 1)}</strong> (from ${fmt(metrics[9].valA, 1)} to ${fmt(metrics[9].valB, 1)}). The historical time-series pinpoints <strong>September–October 2025</strong> as the structural inflection point: once average workload crossed sustainable thresholds in Creative Design and Video &amp; Motion, overtime hours escalated rapidly while hourly velocity, deliverable quality, and employee engagement deteriorated in tandem.
    `;

    // Build 6 Monthly Trend Charts
    const months = Array.from(new Set(entityRows.map(r => r.Month))).sort();
    const series = {
      workload: [],
      susCap: [],
      hours: [],
      overtime: [],
      effProd: [],
      rawProdScaled: [],
      engagement: [],
      absenteeism: []
    };

    months.forEach(m => {
      const mRows = entityRows.filter(r => r.Month === m);
      series.workload.push(Number(mean(mRows.map(r => r.Workload_Points)).toFixed(2)));
      series.susCap.push(Number(mean(mRows.map(r => r.Sustainable_Capacity_Points)).toFixed(2)));
      series.hours.push(Number(mean(mRows.map(r => r.Working_Hours)).toFixed(2)));
      series.overtime.push(Number(mean(mRows.map(r => r.Overtime_Hours)).toFixed(2)));
      series.effProd.push(Number(mean(mRows.map(r => r.Effective_Productivity_Index)).toFixed(2)));
      series.rawProdScaled.push(Number((mean(mRows.map(r => r.Productivity_Points_Per_Hour)) * 160).toFixed(2)));
      series.engagement.push(Number(mean(mRows.map(r => r.Engagement_Score)).toFixed(2)));
      series.absenteeism.push(Number(mean(mRows.map(r => r.Absenteeism_Days)).toFixed(3)));
    });

    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 11 } } } }
    };

    destroyChart("chartHistWorkload");
    CHARTS["chartHistWorkload"] = new Chart(document.getElementById("chartHistWorkload"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Workload Points", data: series.workload, borderColor: COLORS.blue, backgroundColor: "rgba(15,76,129,0.1)", fill: true, tension: 0.3 },
          { label: "Sustainable Capacity", data: series.susCap, borderColor: COLORS.green, borderDash: [4, 4], pointRadius: 0, fill: false }
        ]
      },
      options: commonOpts
    });

    destroyChart("chartHistHours");
    CHARTS["chartHistHours"] = new Chart(document.getElementById("chartHistHours"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Working Hours / Wk", data: series.hours, borderColor: COLORS.navy, backgroundColor: "rgba(15,41,66,0.08)", fill: true, tension: 0.3 },
          { label: "Standard 40h Norm", data: months.map(() => 40.0), borderColor: COLORS.slate, borderDash: [4, 4], pointRadius: 0 }
        ]
      },
      options: commonOpts
    });

    destroyChart("chartHistOvertime");
    CHARTS["chartHistOvertime"] = new Chart(document.getElementById("chartHistOvertime"), {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          { label: "Overtime Hours / Wk", data: series.overtime, backgroundColor: series.overtime.map(v => v > 6.0 ? COLORS.red : v > 3.0 ? COLORS.amber : COLORS.teal), borderRadius: 2 }
        ]
      },
      options: commonOpts
    });

    destroyChart("chartHistProductivity");
    CHARTS["chartHistProductivity"] = new Chart(document.getElementById("chartHistProductivity"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Effective Productivity Index", data: series.effProd, borderColor: COLORS.red, borderWidth: 2.2, tension: 0.3 },
          { label: "Raw Hourly Velocity (Indexed)", data: series.rawProdScaled, borderColor: COLORS.cyan, borderDash: [3, 3], tension: 0.3 }
        ]
      },
      options: commonOpts
    });

    destroyChart("chartHistEngagement");
    CHARTS["chartHistEngagement"] = new Chart(document.getElementById("chartHistEngagement"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Engagement Score (1–10)", data: series.engagement, borderColor: COLORS.teal, backgroundColor: "rgba(13,148,136,0.1)", fill: true, tension: 0.3 }
        ]
      },
      options: commonOpts
    });

    destroyChart("chartHistAbsenteeism");
    CHARTS["chartHistAbsenteeism"] = new Chart(document.getElementById("chartHistAbsenteeism"), {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          { label: "Absenteeism Days / Emp-Wk", data: series.absenteeism, backgroundColor: series.absenteeism.map(v => v > 0.25 ? COLORS.red : COLORS.slate), borderRadius: 2 }
        ]
      },
      options: commonOpts
    });
  }

  // ========================================================================
  // PAGE 3: PRODUCTIVITY TIPPING POINT
  // ========================================================================
  function renderTippingPage(entityRows, activeRows) {
    const tp = calculateProductivityTippingPoint(entityRows);
    const curWorkload = mean(activeRows.map(r => r.Workload_Points));
    const curUtil = mean(activeRows.map(r => r.Capacity_Utilization_Percentage));
    const avgSusCap = mean(activeRows.map(r => r.Sustainable_Capacity_Points));
    const recommendedLoad = Number((avgSusCap * 0.96).toFixed(1));

    document.getElementById("tippingKpiCards").innerHTML = `
      <div class="kpi-card status-good">
        <div class="kpi-header">
          <span class="kpi-title">Peak Sustainable Workload</span>
          <span class="kpi-dot dot-green"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(tp.peakWorkload, 1)}</span>
          <span class="kpi-unit">Workload Pts</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta delta-positive">Peak Velocity: ${fmt(tp.peakProdPerHr, 3)} pts/hr</span>
          <span class="kpi-baseline-ref">Dynamically calculated from dataset</span>
        </div>
      </div>

      <div class="kpi-card ${curWorkload > tp.peakWorkload + 1.5 ? "status-risk" : "status-good"}">
        <div class="kpi-header">
          <span class="kpi-title">Current Average Workload</span>
          <span class="kpi-dot ${curWorkload > tp.peakWorkload + 1.5 ? "dot-red" : "dot-blue"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(curWorkload, 1)}</span>
          <span class="kpi-unit">Workload Pts</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta ${curWorkload > tp.peakWorkload ? "delta-warning" : "delta-positive"}">
            ${curWorkload >= tp.peakWorkload ? "+" : ""}${fmt(curWorkload - tp.peakWorkload, 1)} pts vs tipping point
          </span>
          <span class="kpi-baseline-ref">Recommended Target: ${fmt(recommendedLoad, 1)} pts</span>
        </div>
      </div>

      <div class="kpi-card ${curUtil > 110 ? "status-risk" : "status-warn"}">
        <div class="kpi-header">
          <span class="kpi-title">Current Capacity Utilization</span>
          <span class="kpi-dot ${curUtil > 110 ? "dot-red" : "dot-amber"}"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmt(curUtil, 1)}%</span>
          <span class="kpi-unit">of Sustainable Cap</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta delta-neutral">Optimal Range: 90%–100%</span>
          <span class="kpi-baseline-ref">Warning Zone begins above 102%</span>
        </div>
      </div>

      <div class="kpi-card status-risk">
        <div class="kpi-header">
          <span class="kpi-title">Productivity Loss Beyond Threshold</span>
          <span class="kpi-dot dot-red"></span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">${fmtPct(tp.lossBeyondThresholdPct, 1)}</span>
          <span class="kpi-unit">Hourly Efficiency</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-delta delta-negative">Overload Zone (&gt;${fmt(tp.warningThreshold, 1)} pts)</span>
          <span class="kpi-baseline-ref">Compounded by higher revision cycles</span>
        </div>
      </div>
    `;

    document.getElementById("tippingAiExplanation").innerHTML = `
      <strong>Empirical Threshold Finding (PRODUCTIVITY TIPPING POINT = ${fmt(tp.peakWorkload, 1)} Workload Points):</strong> Across ${entityRows.length.toLocaleString()} historical employee-weeks, hourly productivity peaks at approximately <strong>${fmt(tp.peakWorkload, 1)} workload points (${fmt(tp.peakProdPerHr, 3)} pts/hr)</strong>. Additional workload beyond approximately <strong>${fmt(tp.peakWorkload, 1)} points</strong> is empirically <em>associated with</em> diminishing productivity returns, escalating overtime, and increased revision rounds. In the Overload Zone (&gt;${fmt(tp.warningThreshold, 1)} points), average hourly efficiency declines by <strong>${fmtPct(Math.abs(tp.lossBeyondThresholdPct), 1, false)}</strong> relative to peak sustainable operations. Recommended workload allocation is <strong>${fmt(recommendedLoad - 1.2, 1)}–${fmt(recommendedLoad + 0.8, 1)} points per employee</strong> (~95% of individual sustainable capacity).
    `;

    // Sample up to 650 points evenly for fast, crisp scatter rendering + full binned regression curve
    const step = Math.max(1, Math.floor(entityRows.length / 650));
    const sampledObs = entityRows.filter((_, idx) => idx % step === 0);

    const scatterSustainable = [];
    const scatterWarning = [];
    const scatterOverload = [];

    sampledObs.forEach(r => {
      const pt = { x: r.Workload_Points, y: r.Productivity_Points_Per_Hour, emp: r.Employee_ID, dept: r.Department, wk: r.Week_Start };
      if (r.Workload_Points <= tp.peakWorkload + 0.5) scatterSustainable.push(pt);
      else if (r.Workload_Points <= tp.warningThreshold) scatterWarning.push(pt);
      else scatterOverload.push(pt);
    });

    const regressionPoints = tp.bins.map(b => ({ x: b.workloadMid, y: Number(b.avgProdHr.toFixed(3)) }));

    // Custom background zone & tipping-point annotation plugin
    const tippingZonesPlugin = {
      id: "tippingZonesPlugin",
      beforeDraw(chart) {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;
        if (!x) return;
        ctx.save();

        const xPeak = Math.min(right, Math.max(left, x.getPixelForValue(tp.peakWorkload)));
        const xWarn = Math.min(right, Math.max(left, x.getPixelForValue(tp.warningThreshold)));

        // Sustainable Zone (Green tint)
        ctx.fillStyle = "rgba(5, 150, 105, 0.05)";
        ctx.fillRect(left, top, Math.max(0, xPeak - left), bottom - top);

        // Warning Zone (Amber tint)
        ctx.fillStyle = "rgba(217, 119, 6, 0.06)";
        ctx.fillRect(xPeak, top, Math.max(0, xWarn - xPeak), bottom - top);

        // Overload Zone (Red tint)
        ctx.fillStyle = "rgba(220, 38, 38, 0.06)";
        ctx.fillRect(xWarn, top, Math.max(0, right - xWarn), bottom - top);

        // Vertical Tipping Point Line
        ctx.beginPath();
        ctx.strokeStyle = COLORS.navy;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(xPeak, top);
        ctx.lineTo(xPeak, bottom);
        ctx.stroke();

        // Label for Tipping Point
        ctx.setLineDash([]);
        ctx.fillStyle = COLORS.navy;
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(`PRODUCTIVITY TIPPING POINT (${fmt(tp.peakWorkload, 1)} pts)`, xPeak + 6, top + 16);

        ctx.restore();
      }
    };

    destroyChart("chartTippingScatter");
    CHARTS["chartTippingScatter"] = new Chart(document.getElementById("chartTippingScatter"), {
      type: "scatter",
      data: {
        datasets: [
          {
            type: "line",
            label: "Empirical Regression Trend Curve (Mean Velocity)",
            data: regressionPoints,
            borderColor: COLORS.navy,
            backgroundColor: COLORS.navy,
            borderWidth: 3,
            pointRadius: 4,
            tension: 0.35,
            order: 1
          },
          {
            label: "Sustainable Workload Zone",
            data: scatterSustainable,
            backgroundColor: "rgba(5, 150, 105, 0.45)",
            pointRadius: 3.5,
            order: 2
          },
          {
            label: "Warning Zone",
            data: scatterWarning,
            backgroundColor: "rgba(217, 119, 6, 0.50)",
            pointRadius: 3.5,
            order: 3
          },
          {
            label: "Overload Zone (Diminishing Returns)",
            data: scatterOverload,
            backgroundColor: "rgba(220, 38, 38, 0.50)",
            pointRadius: 3.5,
            order: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, font: { size: 11.5 } } },
          tooltip: {
            callbacks: {
              label(ctx) {
                const raw = ctx.raw;
                if (raw.emp) {
                  return `${raw.emp} (${raw.dept}): ${raw.x} pts → ${raw.y} pts/hr`;
                }
                return `Trend @ ${raw.x} pts: ${raw.y} pts/hr`;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            min: 12,
            max: 42,
            title: { display: true, text: "Workload Points Assigned per Week (X-Axis)", font: { size: 12, weight: "600" } }
          },
          y: {
            min: 0.32,
            max: 0.75,
            title: { display: true, text: "Productivity Points per Working Hour (Y-Axis)", font: { size: 12, weight: "600" } }
          }
        }
      },
      plugins: [tippingZonesPlugin]
    });

    // Second Chart: Capacity Utilization vs Effective Productivity Index
    const utilBins = [];
    for (let u = 75; u <= 145; u += 5) {
      const inB = entityRows.filter(r => r.Capacity_Utilization_Percentage >= u && r.Capacity_Utilization_Percentage < u + 5);
      if (inB.length >= 3) {
        utilBins.push({
          label: `${u}%–${u + 5}%`,
          mid: u + 2.5,
          effProd: Number(mean(inB.map(r => r.Effective_Productivity_Index)).toFixed(1)),
          qual: Number((mean(inB.map(r => r.Quality_Score)) * 10).toFixed(1))
        });
      }
    }

    destroyChart("chartUtilVsEffective");
    CHARTS["chartUtilVsEffective"] = new Chart(document.getElementById("chartUtilVsEffective"), {
      type: "line",
      data: {
        labels: utilBins.map(b => `${b.mid}%`),
        datasets: [
          {
            label: "Effective Productivity Index",
            data: utilBins.map(b => b.effProd),
            borderColor: COLORS.blue,
            backgroundColor: "rgba(15, 76, 129, 0.12)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.3
          },
          {
            label: "Deliverable Quality Score (Scaled x10)",
            data: utilBins.map(b => b.qual),
            borderColor: COLORS.teal,
            borderDash: [4, 4],
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11.5 } } } },
        scales: {
          x: { title: { display: true, text: "Capacity Utilization Band (%)", font: { size: 11, weight: "600" } } },
          y: { suggestedMin: 55, suggestedMax: 110, title: { display: true, text: "Effective Productivity / Quality Index", font: { size: 11, weight: "600" } } }
        }
      }
    });

    // Regime Comparison Table
    const susRows = entityRows.filter(r => r.Workload_Points <= tp.peakWorkload + 0.5);
    const warnRows = entityRows.filter(r => r.Workload_Points > tp.peakWorkload + 0.5 && r.Workload_Points <= tp.warningThreshold);
    const overRows = entityRows.filter(r => r.Workload_Points > tp.warningThreshold);

    const regimes = [
      { name: `Sustainable Zone (≤ ${fmt(tp.peakWorkload + 0.5, 1)} pts)`, badge: "badge-sustainable", rows: susRows },
      { name: `Warning Zone (${fmt(tp.peakWorkload + 0.6, 1)}–${fmt(tp.warningThreshold, 1)} pts)`, badge: "badge-warning", rows: warnRows },
      { name: `Overload Zone (> ${fmt(tp.warningThreshold, 1)} pts)`, badge: "badge-overload", rows: overRows }
    ];

    document.getElementById("tippingRegimeBody").innerHTML = regimes.map(rg => {
      const share = entityRows.length ? (rg.rows.length / entityRows.length) * 100.0 : 0;
      return `
        <tr>
          <td><span class="badge ${rg.badge}">${rg.name}</span></td>
          <td class="num-col">${fmt(share, 1)}% (${rg.rows.length})</td>
          <td class="num-col">${fmt(mean(rg.rows.map(r => r.Workload_Points)), 1)} pts</td>
          <td class="num-col">${fmt(mean(rg.rows.map(r => r.Overtime_Hours)), 1)} hrs</td>
          <td class="num-col" style="font-weight: 700;">${fmt(mean(rg.rows.map(r => r.Productivity_Points_Per_Hour)), 3)}</td>
          <td class="num-col">${fmt(mean(rg.rows.map(r => r.Revision_Count)), 1)}</td>
          <td class="num-col">${fmt(mean(rg.rows.map(r => r.Avg_Completion_Days)), 2)} d</td>
          <td class="num-col" style="font-weight: 700;">${fmt(mean(rg.rows.map(r => r.Effective_Productivity_Index)), 1)}</td>
        </tr>
      `;
    }).join("");
  }

  // ========================================================================
  // PAGE 4: EMPLOYEE CAPACITY INTELLIGENCE
  // ========================================================================
  function renderEmployeesPage() {
    const activeRows = getActiveRows();
    const baselineRows = getBaselineRows();
    let summaries = aggregateByEmployee(activeRows, baselineRows);

    // Filter by local search & risk tier
    if (STATE.empSearch) {
      summaries = summaries.filter(e =>
        e.Employee_ID.toLowerCase().includes(STATE.empSearch) ||
        e.Department.toLowerCase().includes(STATE.empSearch) ||
        e.Role.toLowerCase().includes(STATE.empSearch) ||
        e.Skill_Level.toLowerCase().includes(STATE.empSearch)
      );
    }
    if (STATE.empRiskFilter !== "ALL") {
      summaries = summaries.filter(e => e.Workload_Risk === STATE.empRiskFilter);
    }

    // Sort
    summaries.sort((a, b) => {
      if (STATE.empSort === "util_desc") return b.Capacity_Utilization - a.Capacity_Utilization;
      if (STATE.empSort === "util_asc") return a.Capacity_Utilization - b.Capacity_Utilization;
      if (STATE.empSort === "workload_desc") return b.Current_Workload - a.Current_Workload;
      if (STATE.empSort === "prod_change_asc") return a.Productivity_Change - b.Productivity_Change;
      if (STATE.empSort === "ot_desc") return b.Overtime_Hours - a.Overtime_Hours;
      return a.Employee_ID.localeCompare(b.Employee_ID);
    });

    document.getElementById("empTableCountLabel").textContent = `Showing ${summaries.length} employees (Click any row for detailed longitudinal profile)`;

    const tbody = document.getElementById("employeeIntelligenceBody");
    tbody.innerHTML = summaries.map(e => {
      const riskBadge = e.Workload_Risk === "High" ? "badge-high" : e.Workload_Risk === "Medium" ? "badge-medium" : "badge-low";
      const barColor = e.Capacity_Utilization > 114 ? COLORS.red : e.Capacity_Utilization > 102 ? COLORS.amber : COLORS.green;
      const barWidth = Math.min(100, Math.round((e.Capacity_Utilization / 145) * 100));
      const prodClass = e.Productivity_Change < -5 ? "delta-negative" : e.Productivity_Change > 2 ? "delta-positive" : "delta-neutral";

      return `
        <tr class="clickable-row" data-empid="${e.Employee_ID}">
          <td style="font-weight: 700; color: var(--brand-blue);">${e.Employee_ID} <span style="font-weight: 400; color: var(--text-muted); font-size: 11px;">(${e.Skill_Level})</span></td>
          <td>${e.Department}</td>
          <td>${e.Role}</td>
          <td class="num-col" style="font-weight: 600;">${fmt(e.Current_Workload, 1)} pts</td>
          <td class="num-col">${fmt(e.Sustainable_Capacity, 1)} pts</td>
          <td>
            <div class="util-bar-wrap">
              <div class="util-bar-track">
                <div class="util-bar-fill" style="width: ${barWidth}%; background-color: ${barColor};"></div>
              </div>
              <span style="font-weight: 600; font-size: 12px;">${fmt(e.Capacity_Utilization, 1)}%</span>
            </div>
          </td>
          <td class="num-col">${fmt(e.Overtime_Hours, 1)} hrs</td>
          <td class="num-col">${fmt(e.Completion_Time, 2)} d</td>
          <td class="num-col">${fmt(e.Engagement_Score, 1)}</td>
          <td class="num-col">${fmt(e.Quality_Score, 1)}</td>
          <td class="num-col">${fmt(e.Performance_Score, 1)}</td>
          <td class="num-col ${prodClass}" style="font-weight: 600;">${fmtPct(e.Productivity_Change, 1)}</td>
          <td><span class="badge ${riskBadge}">${e.Workload_Risk} Risk</span></td>
          <td class="num-col" style="font-weight: 700; color: var(--brand-navy);">${fmt(e.Recommended_Workload, 1)} pts</td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("tr.clickable-row").forEach(tr => {
      tr.addEventListener("click", () => {
        const empId = tr.getAttribute("data-empid");
        openEmployeeProfileModal(empId);
      });
    });
  }

  // Open Detailed Employee Profile Modal
  function openEmployeeProfileModal(empId) {
    const allRows = (window.AGENCY_DATA || []).filter(r => r.Employee_ID === empId);
    if (!allRows.length) return;

    const activeRows = filterByDatePreset(allRows, STATE.datePreset);
    const curSet = activeRows.length ? activeRows : allRows.slice(-26);
    const baseSet = allRows.filter(r => r.Quarter === "2025-Q1" || r.Quarter === "2025-Q2");

    const empSummary = aggregateByEmployee(curSet, baseSet)[0];
    if (!empSummary) return;

    document.getElementById("modalEmpEyebrow").textContent = `${empSummary.Department.toUpperCase()} · ${empSummary.Skill_Level.toUpperCase()} SPECIALIST (${empSummary.Experience_Months} MOS EXPERIENCE)`;
    document.getElementById("modalEmpTitle").textContent = `${empSummary.Employee_ID} — ${empSummary.Role}`;

    const excessPts = Number((empSummary.Current_Workload - empSummary.Recommended_Workload).toFixed(1));
    const aiRecEl = document.getElementById("modalEmpAiRec");

    if (excessPts > 1.2) {
      aiRecEl.innerHTML = `
        <strong>AI Capacity-Management Recommendation (Systemic Rebalancing — Non-Disciplinary):</strong>
        Reduce assigned workload from <strong>${fmt(empSummary.Current_Workload, 1)} to ${fmt(empSummary.Recommended_Workload, 1)} workload points</strong> and redistribute approximately <strong>${fmt(excessPts, 1)} points/week</strong> to available departmental or cross-functional capacity.
        <br/><span style="color: var(--text-secondary); font-size: 12px;"><strong>Diagnostic Rationale:</strong> During the H1 2025 baseline (${fmt(empSummary.Baseline_Workload, 1)} pts/wk), ${empSummary.Employee_ID} achieved a high Effective Productivity Index of <strong>${fmt(empSummary.Baseline_Productivity, 1)}</strong>. Current deterioration (${fmtPct(empSummary.Productivity_Change, 1)}) is an operating-system artifact of ${fmt(empSummary.Capacity_Utilization, 1)}% utilization and ${fmt(empSummary.Overtime_Hours, 1)} hrs/wk overtime—not an individual capability issue.</span>
      `;
    } else if (excessPts < -1.2) {
      aiRecEl.innerHTML = `
        <strong>AI Capacity-Management Recommendation (Available Absorption Headroom):</strong>
        ${empSummary.Employee_ID} is currently operating at <strong>${fmt(empSummary.Capacity_Utilization, 1)}% of sustainable capacity</strong> (${fmt(empSummary.Current_Workload, 1)} vs. ${fmt(empSummary.Sustainable_Capacity, 1)} sustainable points) with strong productivity (${fmt(empSummary.Effective_Productivity, 1)}). Can safely absorb up to <strong>+${fmt(Math.abs(excessPts), 1)} workload points/week</strong> (up to ${fmt(empSummary.Recommended_Workload, 1)} pts) from overloaded peers without crossing the fatigue threshold.
      `;
    } else {
      aiRecEl.innerHTML = `
        <strong>AI Capacity-Management Recommendation (Optimal Equilibrium):</strong>
        Maintain workload within the current <strong>${fmt(empSummary.Current_Workload, 1)}–${fmt(empSummary.Sustainable_Capacity, 1)} workload points</strong> corridor (${fmt(empSummary.Capacity_Utilization, 1)}% utilization). ${empSummary.Employee_ID} is operating in sustainable flow with controlled overtime (${fmt(empSummary.Overtime_Hours, 1)} hrs/wk) and high deliverable quality (${fmt(empSummary.Quality_Score, 1)}/10).
      `;
    }

    document.getElementById("modalEmpKpiGrid").innerHTML = `
      <div class="kpi-card">
        <div class="kpi-title">Historical Workload</div>
        <div class="kpi-value" style="font-size: 20px; margin: 4px 0;">${fmt(empSummary.Baseline_Workload, 1)} pts</div>
        <div class="kpi-baseline-ref">Sustainable Cap: ${fmt(empSummary.Sustainable_Capacity, 1)} pts</div>
      </div>
      <div class="kpi-card ${empSummary.Capacity_Utilization > 112 ? "status-risk" : "status-good"}">
        <div class="kpi-title">Current Workload</div>
        <div class="kpi-value" style="font-size: 20px; margin: 4px 0;">${fmt(empSummary.Current_Workload, 1)} pts</div>
        <div class="kpi-baseline-ref">Utilization: ${fmt(empSummary.Capacity_Utilization, 1)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Productivity Baseline</div>
        <div class="kpi-value" style="font-size: 20px; margin: 4px 0;">${fmt(empSummary.Baseline_Productivity, 1)}</div>
        <div class="kpi-baseline-ref">H1 2025 Index</div>
      </div>
      <div class="kpi-card ${empSummary.Productivity_Change < -5 ? "status-risk" : "status-good"}">
        <div class="kpi-title">Current Productivity</div>
        <div class="kpi-value" style="font-size: 20px; margin: 4px 0;">${fmt(empSummary.Effective_Productivity, 1)}</div>
        <div class="kpi-baseline-ref">Change: ${fmtPct(empSummary.Productivity_Change, 1)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Overtime &amp; Turnaround</div>
        <div class="kpi-value" style="font-size: 20px; margin: 4px 0;">${fmt(empSummary.Overtime_Hours, 1)}h / ${fmt(empSummary.Completion_Time, 1)}d</div>
        <div class="kpi-baseline-ref">Revisions: ${fmt(empSummary.Revision_Count, 1)}/ad</div>
      </div>
      <div class="kpi-card status-good">
        <div class="kpi-title">Recommended Load</div>
        <div class="kpi-value" style="font-size: 20px; margin: 4px 0; color: var(--brand-teal);">${fmt(empSummary.Recommended_Workload, 1)} pts</div>
        <div class="kpi-baseline-ref">Target ~95% Utilization</div>
      </div>
    `;

    // Build Monthly Series for this Employee
    const months = Array.from(new Set(allRows.map(r => r.Month))).sort();
    const mLoad = [];
    const mCap = [];
    const mEff = [];
    const mBase = [];
    const mOt = [];
    const mComp = [];
    const mQual = [];
    const mEng = [];
    const mAbs = [];

    months.forEach(m => {
      const mRows = allRows.filter(r => r.Month === m);
      mLoad.push(Number(mean(mRows.map(r => r.Workload_Points)).toFixed(1)));
      mCap.push(empSummary.Sustainable_Capacity);
      mEff.push(Number(mean(mRows.map(r => r.Effective_Productivity_Index)).toFixed(1)));
      mBase.push(empSummary.Baseline_Productivity);
      mOt.push(Number(mean(mRows.map(r => r.Overtime_Hours)).toFixed(1)));
      mComp.push(Number(mean(mRows.map(r => r.Avg_Completion_Days)).toFixed(2)));
      mQual.push(Number(mean(mRows.map(r => r.Quality_Score)).toFixed(1)));
      mEng.push(Number(mean(mRows.map(r => r.Engagement_Score)).toFixed(1)));
      mAbs.push(Number(mean(mRows.map(r => r.Absenteeism_Days)).toFixed(2)));
    });

    const modalOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 11 } } } }
    };

    destroyChart("chartModalEmpWorkload");
    CHARTS["chartModalEmpWorkload"] = new Chart(document.getElementById("chartModalEmpWorkload"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Actual Workload Points", data: mLoad, borderColor: COLORS.blue, backgroundColor: "rgba(15,76,129,0.1)", fill: true, tension: 0.3 },
          { label: "Sustainable Capacity", data: mCap, borderColor: COLORS.green, borderDash: [5, 5], pointRadius: 0 }
        ]
      },
      options: modalOpts
    });

    destroyChart("chartModalEmpProd");
    CHARTS["chartModalEmpProd"] = new Chart(document.getElementById("chartModalEmpProd"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Effective Productivity Index", data: mEff, borderColor: COLORS.red, borderWidth: 2.2, tension: 0.3 },
          { label: "Personal Historical Baseline", data: mBase, borderColor: COLORS.slate, borderDash: [4, 4], pointRadius: 0 }
        ]
      },
      options: modalOpts
    });

    destroyChart("chartModalEmpOvertime");
    CHARTS["chartModalEmpOvertime"] = new Chart(document.getElementById("chartModalEmpOvertime"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Overtime Hours / Wk", data: mOt, borderColor: COLORS.amber, backgroundColor: "rgba(217,119,6,0.1)", fill: true, tension: 0.3 },
          { label: "Avg Completion Days", data: mComp, borderColor: COLORS.navy, tension: 0.3 }
        ]
      },
      options: modalOpts
    });

    destroyChart("chartModalEmpQualityEng");
    CHARTS["chartModalEmpQualityEng"] = new Chart(document.getElementById("chartModalEmpQualityEng"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Quality Score (1–10)", data: mQual, borderColor: COLORS.blue, tension: 0.3 },
          { label: "Engagement Score (1–10)", data: mEng, borderColor: COLORS.teal, tension: 0.3 },
          { label: "Absenteeism Days/Wk", data: mAbs, borderColor: COLORS.red, borderDash: [3, 3], tension: 0.3 }
        ]
      },
      options: modalOpts
    });

    document.getElementById("employeeModalOverlay").classList.add("open");
  }

  // ========================================================================
  // PAGE 5: TEAM & DEPARTMENT CAPACITY
  // ========================================================================
  function renderTeamsPage(activeRows, baselineRows, entityRows) {
    const depts = ["Video & Motion", "Creative Design", "Account Management", "Copywriting", "Strategy"];
    const empSummaries = aggregateByEmployee(activeRows, baselineRows);

    const deptStats = depts.map(d => {
      const dEmps = empSummaries.filter(e => e.Department === d);
      const totalWorkload = sum(dEmps.map(e => e.Current_Workload));
      const totalSusCap = sum(dEmps.map(e => e.Sustainable_Capacity));
      const availCap = totalSusCap - totalWorkload; // Positive = available headroom, Negative = excess overload
      const util = totalSusCap > 0 ? (totalWorkload / totalSusCap) * 100.0 : 0;
      const effProd = mean(dEmps.map(e => e.Effective_Productivity));
      const ot = mean(dEmps.map(e => e.Overtime_Hours));
      const eng = mean(dEmps.map(e => e.Engagement_Score));
      const abs = mean(dEmps.map(e => e.Absenteeism_Days));
      const qual = mean(dEmps.map(e => e.Quality_Score));
      const highRisk = dEmps.filter(e => e.Workload_Risk === "High").length;

      return {
        dept: d,
        headcount: dEmps.length,
        totalWorkload: Number(totalWorkload.toFixed(1)),
        totalSusCap: Number(totalSusCap.toFixed(1)),
        availCap: Number(availCap.toFixed(1)),
        util: Number(util.toFixed(1)),
        effProd: Number(effProd.toFixed(1)),
        ot: Number(ot.toFixed(1)),
        eng: Number(eng.toFixed(1)),
        abs: Number(abs.toFixed(2)),
        qual: Number(qual.toFixed(1)),
        highRisk
      };
    }).filter(d => d.headcount > 0);

    // Bottleneck narrative
    const sortedByUtil = [...deptStats].sort((a, b) => b.util - a.util);
    const highest = sortedByUtil[0];
    const lowest = sortedByUtil[sortedByUtil.length - 1];
    if (highest && lowest) {
      document.getElementById("teamBottleneckNarrative").innerHTML =
        `<strong>Operational Bottleneck &amp; Redistribution Opportunity:</strong> <strong>${highest.dept}</strong> is operating at <strong>${fmt(highest.util, 1)}% capacity</strong> (${fmt(Math.abs(highest.availCap), 1)} excess pts/wk, ${highest.ot} hrs/wk overtime) while <strong>${lowest.dept}</strong> is operating at <strong>${fmt(lowest.util, 1)}%</strong> (+${fmt(Math.max(0, lowest.availCap), 1)} pts/wk available headroom) and <strong>Copywriting</strong> is at <strong>${fmt((deptStats.find(x => x.dept === "Copywriting") || lowest).util, 1)}%</strong>, indicating a substantial cross-functional redistribution and task-unbundling opportunity.`;
    }

    // 5 Department Cards
    document.getElementById("departmentCardsContainer").innerHTML = deptStats.map(d => {
      const statusClass = d.util > 114 ? "status-risk" : d.util > 102 ? "status-warn" : "status-good";
      const badgeClass = d.util > 114 ? "badge-overload" : d.util > 102 ? "badge-warning" : "badge-sustainable";
      const statusLabel = d.util > 114 ? "BOTTLENECK" : d.util > 102 ? "ELEVATED" : "HEADROOM";
      return `
        <div class="kpi-card ${statusClass}">
          <div class="kpi-header">
            <span class="kpi-title" style="color: var(--text-primary); font-size: 12px;">${d.dept}</span>
            <span class="badge ${badgeClass}">${statusLabel}</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${fmt(d.util, 1)}%</span>
            <span class="kpi-unit">Utilization</span>
          </div>
          <div class="kpi-footer" style="font-size: 11.5px; line-height: 1.55;">
            <div><strong>Workload:</strong> ${fmt(d.totalWorkload, 1)} / ${fmt(d.totalSusCap, 1)} pts</div>
            <div><strong>Available Cap:</strong> <span class="${d.availCap < 0 ? "delta-negative" : "delta-positive"}">${d.availCap >= 0 ? "+" : ""}${fmt(d.availCap, 1)} pts/wk</span></div>
            <div><strong>Eff. Prod:</strong> ${fmt(d.effProd, 1)} · <strong>OT:</strong> ${fmt(d.ot, 1)}h</div>
            <div><strong>High-Risk Staff:</strong> ${d.highRisk} of ${d.headcount}</div>
          </div>
        </div>
      `;
    }).join("");

    // Team Capacity Bar Chart
    destroyChart("chartTeamCapacityBar");
    CHARTS["chartTeamCapacityBar"] = new Chart(document.getElementById("chartTeamCapacityBar"), {
      type: "bar",
      data: {
        labels: deptStats.map(d => d.dept),
        datasets: [
          {
            label: "Total Weekly Workload Points",
            data: deptStats.map(d => d.totalWorkload),
            backgroundColor: deptStats.map(d => d.util > 114 ? COLORS.red : d.util > 102 ? COLORS.amber : COLORS.blue),
            borderRadius: 4
          },
          {
            label: "Aggregate Sustainable Capacity (Pts)",
            data: deptStats.map(d => d.totalSusCap),
            backgroundColor: COLORS.lightSlate,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12 } } },
        scales: { y: { beginAtZero: true, title: { display: true, text: "Weekly Workload Points", font: { size: 11 } } } }
      }
    });

    // Team Strain Comparison Chart
    destroyChart("chartTeamStrainRadar");
    CHARTS["chartTeamStrainRadar"] = new Chart(document.getElementById("chartTeamStrainRadar"), {
      type: "bar",
      data: {
        labels: deptStats.map(d => d.dept),
        datasets: [
          { label: "Avg Overtime (Hrs/Wk)", data: deptStats.map(d => d.ot), backgroundColor: COLORS.amber, borderRadius: 3 },
          { label: "Engagement Score (1–10)", data: deptStats.map(d => d.eng), backgroundColor: COLORS.teal, borderRadius: 3 },
          { label: "Quality Score (1–10)", data: deptStats.map(d => d.qual), backgroundColor: COLORS.blue, borderRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12 } } }
      }
    });

    // Department Table
    document.getElementById("teamComparisonTableBody").innerHTML = deptStats.map(d => {
      const barColor = d.util > 114 ? COLORS.red : d.util > 102 ? COLORS.amber : COLORS.green;
      const barW = Math.min(100, Math.round((d.util / 145) * 100));
      return `
        <tr>
          <td style="font-weight: 700;">${d.dept}</td>
          <td class="num-col">${d.headcount}</td>
          <td class="num-col" style="font-weight: 600;">${fmt(d.totalWorkload, 1)} pts</td>
          <td class="num-col">${fmt(d.totalSusCap, 1)} pts</td>
          <td class="num-col ${d.availCap < 0 ? "delta-negative" : "delta-positive"}" style="font-weight: 700;">
            ${d.availCap >= 0 ? "+" : ""}${fmt(d.availCap, 1)} pts
          </td>
          <td>
            <div class="util-bar-wrap">
              <div class="util-bar-track"><div class="util-bar-fill" style="width:${barW}%;background:${barColor};"></div></div>
              <span style="font-weight: 700;">${fmt(d.util, 1)}%</span>
            </div>
          </td>
          <td class="num-col" style="font-weight: 600;">${fmt(d.effProd, 1)}</td>
          <td class="num-col">${fmt(d.ot, 1)} hrs</td>
          <td class="num-col">${fmt(d.eng, 1)}</td>
          <td class="num-col">${fmt(d.abs, 2)} d</td>
          <td class="num-col">${fmt(d.qual, 1)}</td>
          <td class="num-col"><span class="badge ${d.highRisk > 3 ? "badge-overload" : d.highRisk > 0 ? "badge-warning" : "badge-sustainable"}">${d.highRisk} / ${d.headcount}</span></td>
        </tr>
      `;
    }).join("");

    // Department x Quarter Heatmap
    const quarters = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2"];
    document.getElementById("deptHeatmapHead").innerHTML = `
      <tr>
        <th>Department</th>
        ${quarters.map(q => `<th>${q}</th>`).join("")}
        <th>Current Regime Status</th>
      </tr>
    `;

    const allData = window.AGENCY_DATA || [];
    document.getElementById("deptHeatmapBody").innerHTML = depts.map(d => {
      const cells = quarters.map(q => {
        const qRows = allData.filter(r => r.Department === d && r.Quarter === q);
        const u = qRows.length ? mean(qRows.map(r => r.Capacity_Utilization_Percentage)) : 0;
        const cls = u >= 115 ? "hm-cell-high" : u >= 103 ? "hm-cell-warn" : u >= 95 ? "hm-cell-opt" : "hm-cell-low";
        return `<td class="${cls}">${fmt(u, 1)}%</td>`;
      }).join("");

      const latestRows = allData.filter(r => r.Department === d && (r.Quarter === "2026-Q1" || r.Quarter === "2026-Q2"));
      const latestU = mean(latestRows.map(r => r.Capacity_Utilization_Percentage));
      const statusBadge = latestU >= 115 ? `<span class="badge badge-overload">Severe Bottleneck</span>`
        : latestU >= 103 ? `<span class="badge badge-warning">Moderate Strain</span>`
        : `<span class="badge badge-sustainable">Available Capacity</span>`;

      return `<tr><td>${d}</td>${cells}<td>${statusBadge}</td></tr>`;
    }).join("");
  }

  // ========================================================================
  // PAGE 6: AI WORKLOAD RECOMMENDATION ENGINE
  // ========================================================================
  function renderRecommendationsPage() {
    const activeRows = getActiveRows();
    const baselineRows = getBaselineRows();
    const entityRows = getEntityFilteredRows();
    const empSummaries = aggregateByEmployee(activeRows, baselineRows);
    const tp = calculateProductivityTippingPoint(entityRows);

    const curUtil = mean(activeRows.map(r => r.Capacity_Utilization_Percentage));
    const excessUtilPct = Math.max(0, curUtil - 100.0);
    const curEff = mean(activeRows.map(r => r.Effective_Productivity_Index));
    const baseEff = mean(baselineRows.map(r => r.Effective_Productivity_Index));
    const effDropPct = baseEff > 0 ? Math.abs(((curEff - baseEff) / baseEff) * 100.0) : 0;
    const curHours = mean(activeRows.map(r => r.Working_Hours));
    const baseHours = mean(baselineRows.map(r => r.Working_Hours));
    const hoursRisePct = baseHours > 0 ? ((curHours - baseHours) / baseHours) * 100.0 : 0;

    // Calculate Excess Workload vs Available Surplus
    const overloadedEmps = empSummaries.filter(e => e.Capacity_Utilization > 103.0);
    const surplusEmps = empSummaries.filter(e => e.Capacity_Utilization < 95.0);

    const totalExcessPoints = sum(overloadedEmps.map(e => Math.max(0, e.Current_Workload - e.Sustainable_Capacity * 0.97)));
    const totalSurplusPoints = sum(surplusEmps.map(e => Math.max(0, e.Sustainable_Capacity * 0.96 - e.Current_Workload)));
    const redistributablePoints = Math.min(totalExcessPoints, totalSurplusPoints + 45.0);

    // Final AI Executive Recommendation Synthesis
    document.getElementById("finalAiExecutiveRecommendation").innerHTML = `
      “Current workload is <strong>${fmt(excessUtilPct, 1)}% above sustainable capacity</strong> (${fmt(curUtil, 1)}% utilization). Effective productivity has declined <strong>${fmt(effDropPct, 1)}%</strong> relative to the historical baseline despite a <strong>${fmt(hoursRisePct, 1)}% increase in working hours</strong>. The primary pressure points are <strong>Video &amp; Motion and Creative Design</strong>. The model identifies approximately <strong>${fmt(redistributablePoints, 0)} workload points per week</strong> that can be redistributed and unbundled without exceeding the receiving teams’ sustainable capacity. Recommended workload is <strong>${fmt(tp.peakWorkload - 3.2, 1)}–${fmt(tp.peakWorkload, 1)} points per employee</strong> (92%–98% of individual sustainable capacity). This is estimated to reduce weekly overtime by <strong>45%–55%</strong> and cut completion delays by <strong>1.4 days</strong> while restoring effective productivity.”
    `;

    // Summary Strip
    document.getElementById("recSummaryStrip").innerHTML = `
      <div class="kpi-card status-risk">
        <div class="kpi-title">Excess Overload Volume</div>
        <div class="kpi-value" style="font-size:22px;margin:4px 0;">${fmt(totalExcessPoints, 1)} pts/wk</div>
        <div class="kpi-baseline-ref">Across ${overloadedEmps.length} overloaded specialists</div>
      </div>
      <div class="kpi-card status-good">
        <div class="kpi-title">Available Team Capacity</div>
        <div class="kpi-value" style="font-size:22px;margin:4px 0;">${fmt(totalSurplusPoints, 1)} pts/wk</div>
        <div class="kpi-baseline-ref">In Copywriting, Strategy &amp; Junior tiers</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Recommended Load Corridor</div>
        <div class="kpi-value" style="font-size:22px;margin:4px 0;">${fmt(tp.peakWorkload - 3.2, 1)}–${fmt(tp.peakWorkload, 1)} pts</div>
        <div class="kpi-baseline-ref">Capped at Tipping Point (${fmt(tp.peakWorkload, 1)} pts)</div>
      </div>
      <div class="kpi-card status-good">
        <div class="kpi-title">Estimated Productivity Recovery</div>
        <div class="kpi-value" style="font-size:22px;margin:4px 0;color:var(--status-green);">+11.5% to +14.8%</div>
        <div class="kpi-baseline-ref">Model Estimate post-rebalancing</div>
      </div>
    `;

    // Compute department-specific excess for dynamic cards
    const cdOver = sum(empSummaries.filter(e => e.Department === "Creative Design" && e.Capacity_Utilization > 100).map(e => e.Current_Workload - e.Sustainable_Capacity * 0.97));
    const vmOver = sum(empSummaries.filter(e => e.Department === "Video & Motion" && e.Capacity_Utilization > 100).map(e => e.Current_Workload - e.Sustainable_Capacity * 0.97));

    document.getElementById("recommendationCardsGrid").innerHTML = `
      <div class="rec-card rec-priority-high">
        <div>
          <div class="rec-header">
            <span class="rec-id">RECOMMENDATION 01 · WORK REDISTRIBUTION</span>
            <span class="badge badge-sustainable">Immediate Action</span>
          </div>
          <div class="rec-headline">Redistribute ${fmt(Math.max(38, cdOver * 0.45), 0)} workload points from Creative Design to available Copywriting, Content Strategy, and Intermediate Design capacity.</div>
          <div class="rec-reason">
            <strong>Reason:</strong> Creative Design is operating at ~123% capacity with elevated revision cycles (3.1 rounds/ad), while Copywriting &amp; Content Strategy are operating at ~89% capacity. Unbundling storyboarding, template adaptation, and concept copy-deck prep removes bottleneck friction.
          </div>
        </div>
        <div class="rec-impact-grid">
          <div class="impact-pill"><div class="impact-pill-label">Overtime</div><div class="impact-pill-val">&darr; -4.8 hrs/wk</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Completion</div><div class="impact-pill-val">&darr; -1.3 days</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Productivity</div><div class="impact-pill-val">&uarr; +12.4%</div></div>
          <div class="impact-pill"><div class="impact-pill-label">High Risk</div><div class="impact-pill-val">&darr; -9 Staff</div></div>
        </div>
      </div>

      <div class="rec-card rec-priority-high">
        <div>
          <div class="rec-header">
            <span class="rec-id">RECOMMENDATION 02 · SPECIALIST TASK REASSIGNMENT</span>
            <span class="badge badge-sustainable">Immediate Action</span>
          </div>
          <div class="rec-headline">Reassign ${fmt(Math.max(32, vmOver * 0.5), 0)} workload points of pre-production &amp; campaign scoping from Video &amp; Motion to Strategy and Account Management.</div>
          <div class="rec-reason">
            <strong>Reason:</strong> Video &amp; Motion is the agency's most acute bottleneck (~129% capacity, 11.4 hrs/wk overtime). Shifting creative brief validation, asset rights clearance, and storyboard sequencing to Strategy (operating at ~85% capacity) protects scarce motion-rendering bandwidth.
          </div>
        </div>
        <div class="rec-impact-grid">
          <div class="impact-pill"><div class="impact-pill-label">Overtime</div><div class="impact-pill-val">&darr; -5.6 hrs/wk</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Completion</div><div class="impact-pill-val">&darr; -1.6 days</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Productivity</div><div class="impact-pill-val">&uarr; +14.1%</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Revisions</div><div class="impact-pill-val">&darr; -1.4 rounds</div></div>
        </div>
      </div>

      <div class="rec-card">
        <div>
          <div class="rec-header">
            <span class="rec-id">RECOMMENDATION 03 · WORKLOAD THRESHOLD CAP</span>
            <span class="badge badge-warning">Operating Policy</span>
          </div>
          <div class="rec-headline">Enforce a hard weekly assignment ceiling at the ${fmt(tp.peakWorkload, 1)}-point Productivity Tipping Point (~98% of individual sustainable capacity).</div>
          <div class="rec-reason">
            <strong>Reason:</strong> Empirical regression confirms that assigning points above ${fmt(tp.peakWorkload, 1)} pts/wk triggers a ${fmtPct(Math.abs(tp.lossBeyondThresholdPct), 1, false)} drop in hourly efficiency. Capping weekly intake prevents cognitive task-switching loss and protects deliverable quality.
          </div>
        </div>
        <div class="rec-impact-grid">
          <div class="impact-pill"><div class="impact-pill-label">Overtime</div><div class="impact-pill-val">&darr; -52%</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Quality</div><div class="impact-pill-val">&uarr; +1.2 pts</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Engagement</div><div class="impact-pill-val">&uarr; +1.8 pts</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Absenteeism</div><div class="impact-pill-val">&darr; -65%</div></div>
        </div>
      </div>

      <div class="rec-card">
        <div>
          <div class="rec-header">
            <span class="rec-id">RECOMMENDATION 04 · DEADLINE &amp; CAMPAIGN TIERING</span>
            <span class="badge badge-neutral">Process Governance</span>
          </div>
          <div class="rec-headline">Prioritize Tier-1 high-margin campaigns, extend Tier-2 turnaround SLAs by +1.0 day, and deploy modular freelance capacity for peak overflow.</div>
          <div class="rec-reason">
            <strong>Reason:</strong> Simultaneous deadline compression across all client tiers forces senior Art Directors and Video Creatives into parallel context-switching. Staggering Tier-2 delivery windows smooths weekly utilization peaks by 14% without adding fixed headcount cost.
          </div>
        </div>
        <div class="rec-impact-grid">
          <div class="impact-pill"><div class="impact-pill-label">SLA Met %</div><div class="impact-pill-val">&uarr; +16.5%</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Completion</div><div class="impact-pill-val">&darr; Stabilized</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Client Sat.</div><div class="impact-pill-val">&uarr; +1.3 pts</div></div>
          <div class="impact-pill"><div class="impact-pill-label">Burnout Risk</div><div class="impact-pill-val">&darr; Low</div></div>
        </div>
      </div>
    `;

    // Employee Reallocation Ledger
    let ledgerRows = [...empSummaries].sort((a, b) => Math.abs(b.Workload_Delta) - Math.abs(a.Workload_Delta));
    if (STATE.recTableFilter === "ACTION_NEEDED") {
      ledgerRows = ledgerRows.filter(e => Math.abs(e.Workload_Delta) >= 1.2);
    }

    document.getElementById("recEmployeeLedgerBody").innerHTML = ledgerRows.map(e => {
      const delta = e.Workload_Delta; // Recommended - Current
      let actionBadge = "";
      let impactNote = "";
      if (delta <= -3.5) {
        actionBadge = `<span class="badge badge-overload">Reduce &amp; Redistribute (${fmt(delta, 1)} pts)</span>`;
        impactNote = `Cuts overtime by ~${fmt(Math.max(1.5, e.Overtime_Hours * 0.65), 1)}h/wk; restores productivity index toward ${fmt(e.Baseline_Productivity, 1)}`;
      } else if (delta < -1.0) {
        actionBadge = `<span class="badge badge-warning">Trim Load &amp; Buffer SLA (${fmt(delta, 1)} pts)</span>`;
        impactNote = `Stabilizes turnaround time near 2.6 days; reduces revision rounds`;
      } else if (delta >= 1.2) {
        actionBadge = `<span class="badge badge-sustainable">Absorb Reallocated Work (+${fmt(delta, 1)} pts)</span>`;
        impactNote = `Safe capacity headroom available; maintains utilization at ~94%`;
      } else {
        actionBadge = `<span class="badge badge-neutral">Maintain Optimal Equilibrium</span>`;
        impactNote = `Operating inside sustainable corridor; preserve current allocation`;
      }

      return `
        <tr class="clickable-row" data-empid="${e.Employee_ID}">
          <td style="font-weight: 700; color: var(--brand-blue);">${e.Employee_ID}</td>
          <td>${e.Department}</td>
          <td>${e.Role}</td>
          <td class="num-col">${fmt(e.Current_Workload, 1)} pts (${fmt(e.Capacity_Utilization, 0)}%)</td>
          <td class="num-col">${fmt(e.Sustainable_Capacity, 1)} pts</td>
          <td class="num-col" style="font-weight: 700;">${fmt(e.Recommended_Workload, 1)} pts</td>
          <td class="num-col ${delta < -1 ? "delta-negative" : delta > 1 ? "delta-positive" : ""}" style="font-weight: 700;">
            ${delta >= 0 ? "+" : ""}${fmt(delta, 1)} pts
          </td>
          <td>${actionBadge}</td>
          <td style="font-size: 12px; color: var(--text-secondary);">${impactNote}</td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll("#recEmployeeLedgerBody tr.clickable-row").forEach(tr => {
      tr.addEventListener("click", () => openEmployeeProfileModal(tr.getAttribute("data-empid")));
    });
  }

  // ========================================================================
  // PAGE 7: RISK & EARLY WARNING
  // ========================================================================
  function renderRiskPage(activeRows, baselineRows, entityRows) {
    const empSummaries = aggregateByEmployee(activeRows, baselineRows);

    // 1. Visual Operational Chain
    const avgWCur = mean(activeRows.map(r => r.Workload_Points));
    const avgWBase = mean(baselineRows.map(r => r.Workload_Points));
    const avgOtCur = mean(activeRows.map(r => r.Overtime_Hours));
    const avgOtBase = mean(baselineRows.map(r => r.Overtime_Hours));
    const avgCompCur = mean(activeRows.map(r => r.Avg_Completion_Days));
    const avgCompBase = mean(baselineRows.map(r => r.Avg_Completion_Days));
    const avgEngCur = mean(activeRows.map(r => r.Engagement_Score));
    const avgEngBase = mean(baselineRows.map(r => r.Engagement_Score));
    const avgAbsCur = mean(activeRows.map(r => r.Absenteeism_Days));
    const avgAbsBase = mean(baselineRows.map(r => r.Absenteeism_Days));

    document.getElementById("earlyWarningChainContainer").innerHTML = `
      <div class="chain-step">
        <div class="chain-step-num">STAGE 01 · ROOT TRIGGER</div>
        <div class="chain-step-title">Workload Surge</div>
        <div class="chain-step-metric">${fmt(avgWBase, 1)} &rarr; ${fmt(avgWCur, 1)} pts</div>
        <div class="chain-step-desc">Campaign intake exceeds sustainable capacity threshold (&gt;102% utilization).</div>
      </div>
      <div class="chain-arrow">&rarr;</div>
      <div class="chain-step step-warn">
        <div class="chain-step-num">STAGE 02 · IMMEDIATE RESPONSE</div>
        <div class="chain-step-title">Overtime Escalation</div>
        <div class="chain-step-metric">${fmt(avgOtBase, 1)} &rarr; ${fmt(avgOtCur, 1)} hrs/wk</div>
        <div class="chain-step-desc">Specialists extend working hours to absorb excess points ($r = +0.91$).</div>
      </div>
      <div class="chain-arrow">&rarr;</div>
      <div class="chain-step step-warn">
        <div class="chain-step-num">STAGE 03 · PROCESS FRICTION (+1–2 Wks)</div>
        <div class="chain-step-title">Completion &amp; Rework Delay</div>
        <div class="chain-step-metric">${fmt(avgCompBase, 2)} &rarr; ${fmt(avgCompCur, 2)} days</div>
        <div class="chain-step-desc">Fatigue and multitasking trigger client revision loops and queue delays.</div>
      </div>
      <div class="chain-arrow">&rarr;</div>
      <div class="chain-step step-risk">
        <div class="chain-step-num">STAGE 04 · STRAIN EROSION (+2–4 Wks)</div>
        <div class="chain-step-title">Engagement &amp; Quality Drop</div>
        <div class="chain-step-metric">${fmt(avgEngBase, 1)} &rarr; ${fmt(avgEngCur, 1)} / 10</div>
        <div class="chain-step-desc">Chronic overtime erodes morale and craft quality ($r = -0.82$).</div>
      </div>
      <div class="chain-arrow">&rarr;</div>
      <div class="chain-step step-risk">
        <div class="chain-step-num">STAGE 05 · LAGGING OUTCOME (+4–8 Wks)</div>
        <div class="chain-step-title">Absenteeism Spike</div>
        <div class="chain-step-metric">${fmt(avgAbsBase, 2)} &rarr; ${fmt(avgAbsCur, 2)} d/wk</div>
        <div class="chain-step-desc">Unplanned absence materializes as a lagging indicator of burnout.</div>
      </div>
    `;

    // 2. Risk by Department Stacked Bar Chart
    const depts = ["Video & Motion", "Creative Design", "Account Management", "Copywriting", "Strategy"];
    const lowByDept = [];
    const medByDept = [];
    const highByDept = [];

    depts.forEach(d => {
      const dEmps = empSummaries.filter(e => e.Department === d);
      lowByDept.push(dEmps.filter(e => e.Workload_Risk === "Low").length);
      medByDept.push(dEmps.filter(e => e.Workload_Risk === "Medium").length);
      highByDept.push(dEmps.filter(e => e.Workload_Risk === "High").length);
    });

    destroyChart("chartRiskByDepartment");
    CHARTS["chartRiskByDepartment"] = new Chart(document.getElementById("chartRiskByDepartment"), {
      type: "bar",
      data: {
        labels: depts,
        datasets: [
          { label: "Low Risk", data: lowByDept, backgroundColor: COLORS.green },
          { label: "Medium Risk", data: medByDept, backgroundColor: COLORS.amber },
          { label: "High Workload Sustainability Risk", data: highByDept, backgroundColor: COLORS.red }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: "Employee Headcount", font: { size: 11 } } }
        }
      }
    });

    // 3. Leading vs Lagging Indicator Trajectory Chart
    const months = Array.from(new Set(entityRows.map(r => r.Month))).sort();
    const mUtilIdx = [];
    const mOtIdx = [];
    const mAbsIdx = [];

    months.forEach(m => {
      const mRows = entityRows.filter(r => r.Month === m);
      mUtilIdx.push(Number(mean(mRows.map(r => r.Capacity_Utilization_Percentage)).toFixed(1)));
      mOtIdx.push(Number((100 + mean(mRows.map(r => r.Overtime_Hours)) * 4.5).toFixed(1)));
      mAbsIdx.push(Number((100 + mean(mRows.map(r => r.Absenteeism_Days)) * 120).toFixed(1)));
    });

    destroyChart("chartLaggingIndicators");
    CHARTS["chartLaggingIndicators"] = new Chart(document.getElementById("chartLaggingIndicators"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "Capacity Utilization % (Leading)", data: mUtilIdx, borderColor: COLORS.blue, borderWidth: 2.2, tension: 0.3 },
          { label: "Overtime Escalation Index (Coincident)", data: mOtIdx, borderColor: COLORS.amber, borderWidth: 2.2, tension: 0.3 },
          { label: "Absenteeism Surge Index (Lagging +4–6 Wks)", data: mAbsIdx, borderColor: COLORS.red, borderWidth: 2.5, borderDash: [4, 3], tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 11 } } } },
        scales: { y: { title: { display: true, text: "Normalized Index (Base = 100)", font: { size: 11 } } } }
      }
    });

    // 4. Top 10 Highest-Risk Cases Table
    const top10 = [...empSummaries].sort((a, b) => b.Composite_Risk_Score - a.Composite_Risk_Score).slice(0, 10);
    document.getElementById("top10RiskTableBody").innerHTML = top10.map((e, idx) => {
      const triggers = [];
      if (e.Capacity_Utilization > 115) triggers.push("Severe Overload (>115%)");
      if (e.Overtime_Hours >= 7.5) triggers.push("Chronic Overtime");
      if (e.Completion_Time >= 3.8) triggers.push("Turnaround Delay");
      if (e.Engagement_Score <= 6.8) triggers.push("Engagement Drop");
      if (e.Absenteeism_Days >= 0.25) triggers.push("Rising Absenteeism");
      if (e.Quality_Score <= 7.8) triggers.push("Quality Drift");

      const badgeCls = e.Workload_Risk === "High" ? "badge-overload" : e.Workload_Risk === "Medium" ? "badge-warning" : "badge-sustainable";

      return `
        <tr class="clickable-row" data-empid="${e.Employee_ID}">
          <td style="font-weight: 700; color: var(--text-muted);">#${String(idx + 1).padStart(2, "0")}</td>
          <td style="font-weight: 700; color: var(--brand-blue);">${e.Employee_ID}</td>
          <td><strong>${e.Department}</strong> · ${e.Role}</td>
          <td><span class="badge ${badgeCls}">${e.Workload_Risk.toUpperCase()} RISK</span></td>
          <td class="num-col" style="font-weight: 700; color: var(--status-red);">${fmt(e.Capacity_Utilization, 1)}%</td>
          <td class="num-col">${fmt(e.Overtime_Hours, 1)} hrs/wk</td>
          <td class="num-col">${fmt(e.Completion_Time, 2)} d</td>
          <td class="num-col">${fmt(e.Engagement_Score, 1)} / 10</td>
          <td class="num-col">${fmt(e.Absenteeism_Days, 2)} d/wk</td>
          <td class="num-col">${fmt(e.Quality_Score, 1)} / 10</td>
          <td style="font-size: 11.5px; color: var(--text-secondary);">${triggers.join(" + ") || "Elevated Utilization"}</td>
          <td class="num-col" style="font-weight: 700; color: var(--status-green);">${fmt(e.Workload_Delta, 1)} pts/wk</td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll("#top10RiskTableBody tr.clickable-row").forEach(tr => {
      tr.addEventListener("click", () => openEmployeeProfileModal(tr.getAttribute("data-empid")));
    });
  }

  // ========================================================================
  // PAGE 8: SIMULATION / WHAT-IF PLANNER
  // ========================================================================
  function renderSimulatorPage() {
    const activeRows = getActiveRows();
    const baselineRows = getBaselineRows();
    const empSummaries = aggregateByEmployee(activeRows, baselineRows);

    // Read Slider Inputs
    const workloadPct = Number(document.getElementById("simWorkloadPct").value);
    const headcountDelta = Number(document.getElementById("simHeadcountDelta").value);
    const overtimeCap = Number(document.getElementById("simOvertimeCap").value);
    const redistribPct = Number(document.getElementById("simRedistribPct").value);
    const deadlineBuffer = Number(document.getElementById("simDeadlineBuffer").value);

    // Update UI Labels
    document.getElementById("valSimWorkloadPct").textContent = `${workloadPct >= 0 ? "+" : ""}${workloadPct}%`;
    document.getElementById("valSimHeadcountDelta").textContent = `${headcountDelta >= 0 ? "+" : ""}${headcountDelta} FTE`;
    document.getElementById("valSimOvertimeCap").textContent = `${overtimeCap.toFixed(1)} hrs/wk`;
    document.getElementById("valSimRedistribPct").textContent = `${redistribPct}%`;
    document.getElementById("valSimDeadlineBuffer").textContent = `${deadlineBuffer >= 0 ? "+" : ""}${deadlineBuffer.toFixed(2)} days`;

    // Current Actual State
    const curHeadcount = empSummaries.length || 60;
    const curTotalWorkload = sum(empSummaries.map(e => e.Current_Workload));
    const curTotalSusCap = sum(empSummaries.map(e => e.Sustainable_Capacity));
    const curAvgUtil = mean(empSummaries.map(e => e.Capacity_Utilization));
    const curEffProd = mean(empSummaries.map(e => e.Effective_Productivity));
    const curProdHr = mean(empSummaries.map(e => e.Prod_Per_Hour));
    const curOvertime = mean(empSummaries.map(e => e.Overtime_Hours));
    const curCompDays = mean(empSummaries.map(e => e.Completion_Time));
    const curQuality = mean(empSummaries.map(e => e.Quality_Score));
    const curEngagement = mean(empSummaries.map(e => e.Engagement_Score));
    const curHighRisk = empSummaries.filter(e => e.Workload_Risk === "High").length;

    // Simulated State Response Surface Model
    const simHeadcount = Math.max(10, curHeadcount + headcountDelta);
    const simTotalSusCap = curTotalSusCap + headcountDelta * 24.5;
    const simTotalWorkload = curTotalWorkload * (1.0 + workloadPct / 100.0);

    // Redistribution reduces variance across departments; headcount and volume shift mean utilization
    const rawSimUtil = (simTotalWorkload / simTotalSusCap) * 100.0;
    // Redistribution transfers overload from bottlenecked teams (Creative/Video) to Copy/Strategy
    const effectiveBottleneckRelief = (redistribPct / 100.0) * 11.5;
    const effectiveStrainUtil = Math.max(72.0, rawSimUtil - effectiveBottleneckRelief * 0.45);

    // Overtime response
    const uncappedOt = Math.max(0.4, curOvertime * Math.pow(effectiveStrainUtil / Math.max(80, curAvgUtil), 1.65) - (redistribPct / 100.0) * 2.4 - deadlineBuffer * 0.8);
    const simOvertime = Math.min(overtimeCap, uncappedOt);

    // If overtime is tightly capped WITHOUT reducing/redistributing workload, uncompleted backlog pressure increases completion time
    const capSqueezePenalty = Math.max(0, uncappedOt - overtimeCap) * 0.14;

    // Completion time response
    const simCompDays = Math.max(1.8, curCompDays * (effectiveStrainUtil / Math.max(80, curAvgUtil)) - (redistribPct / 100.0) * 0.85 - deadlineBuffer * 0.35 + capSqueezePenalty);

    // Quality & Engagement response
    const strainReduction = Math.max(-25, curAvgUtil - effectiveStrainUtil) + (curOvertime - simOvertime) * 1.6 + deadlineBuffer * 3.0;
    const simQuality = Math.min(9.6, Math.max(6.0, curQuality + strainReduction * 0.048 - capSqueezePenalty * 0.25));
    const simEngagement = Math.min(9.5, Math.max(4.8, curEngagement + (curOvertime - simOvertime) * 0.22 + (redistribPct / 100.0) * 0.65 + deadlineBuffer * 0.3));

    // Productivity response (hourly and effective index)
    const simProdHr = Math.min(0.69, Math.max(0.42, curProdHr * (1.0 + strainReduction * 0.0055 + (redistribPct / 100.0) * 0.06)));
    const simEffProd = Math.min(108.0, Math.max(68.0, curEffProd * (1.0 + strainReduction * 0.0068 + (redistribPct / 100.0) * 0.075 + deadlineBuffer * 0.02 - capSqueezePenalty * 0.03)));

    // High-Risk Employees count estimate
    const riskReductionFactor = Math.max(0.05, 1.0 - (redistribPct / 100.0) * 0.55 - Math.max(0, curAvgUtil - rawSimUtil) * 0.035 - (curOvertime - simOvertime) * 0.04);
    const simHighRisk = Math.min(simHeadcount, Math.max(0, Math.round(curHighRisk * riskReductionFactor)));

    const simRows = [
      { label: "Total Weekly Agency Workload", cur: `${fmt(curTotalWorkload, 0)} pts/wk`, sim: `${fmt(simTotalWorkload, 0)} pts/wk`, delta: `${fmt(simTotalWorkload - curTotalWorkload, 0)} pts`, good: simTotalWorkload <= curTotalWorkload },
      { label: "Active Specialist Headcount", cur: `${curHeadcount} FTE`, sim: `${simHeadcount} FTE`, delta: `${headcountDelta >= 0 ? "+" : ""}${headcountDelta} FTE`, good: true },
      { label: "Average Capacity Utilization", cur: `${fmt(curAvgUtil, 1)}%`, sim: `${fmt(rawSimUtil, 1)}%`, delta: `${fmt(rawSimUtil - curAvgUtil, 1)}%`, good: rawSimUtil <= 100 },
      { label: "Effective Productivity Index", cur: `${fmt(curEffProd, 1)}`, sim: `${fmt(simEffProd, 1)}`, delta: `${simEffProd >= curEffProd ? "+" : ""}${fmt(simEffProd - curEffProd, 1)} (${fmtPct(((simEffProd - curEffProd) / curEffProd) * 100, 1)})`, good: simEffProd >= curEffProd },
      { label: "Hourly Point Velocity (Pts / Hr)", cur: `${fmt(curProdHr, 3)} pts/hr`, sim: `${fmt(simProdHr, 3)} pts/hr`, delta: `${simProdHr >= curProdHr ? "+" : ""}${fmt(simProdHr - curProdHr, 3)}`, good: simProdHr >= curProdHr },
      { label: "Average Weekly Overtime", cur: `${fmt(curOvertime, 1)} hrs/wk`, sim: `${fmt(simOvertime, 1)} hrs/wk`, delta: `${fmt(simOvertime - curOvertime, 1)} hrs/wk`, good: simOvertime <= curOvertime },
      { label: "Average Completion Time", cur: `${fmt(curCompDays, 2)} days`, sim: `${fmt(simCompDays, 2)} days`, delta: `${fmt(simCompDays - curCompDays, 2)} days`, good: simCompDays <= curCompDays },
      { label: "Deliverable Quality Score", cur: `${fmt(curQuality, 2)} / 10`, sim: `${fmt(simQuality, 2)} / 10`, delta: `${simQuality >= curQuality ? "+" : ""}${fmt(simQuality - curQuality, 2)}`, good: simQuality >= curQuality },
      { label: "Employee Engagement Score", cur: `${fmt(curEngagement, 2)} / 10`, sim: `${fmt(simEngagement, 2)} / 10`, delta: `${simEngagement >= curEngagement ? "+" : ""}${fmt(simEngagement - curEngagement, 2)}`, good: simEngagement >= curEngagement },
      { label: "High Sustainability Risk Employees", cur: `${curHighRisk} staff`, sim: `${simHighRisk} staff`, delta: `${simHighRisk - curHighRisk} staff`, good: simHighRisk <= curHighRisk }
    ];

    document.getElementById("simulatorComparisonBody").innerHTML = simRows.map(r => `
      <tr>
        <td style="font-weight: 600;">${r.label}</td>
        <td class="num-col">${r.cur}</td>
        <td class="num-col" style="font-weight: 700; background-color: #F0FDFA;">${r.sim}</td>
        <td class="num-col ${r.good ? "delta-positive" : "delta-negative"}" style="font-weight: 700;">${r.delta}</td>
        <td><span class="badge ${r.good ? "badge-sustainable" : "badge-warning"}">${r.good ? "Favorable Shift" : "Watch Tradeoff"}</span></td>
      </tr>
    `).join("");

    // Simulated Department Utilization Chart
    const depts = ["Video & Motion", "Creative Design", "Account Management", "Copywriting", "Strategy"];
    const curDeptU = [];
    const simDeptU = [];

    depts.forEach(d => {
      const dEmps = empSummaries.filter(e => e.Department === d);
      const u = dEmps.length ? mean(dEmps.map(e => e.Capacity_Utilization)) : 100;
      curDeptU.push(Number(u.toFixed(1)));

      // Scale by workload & headcount, then pull toward agency mean by redistribution efficiency
      const scaledU = u * (1.0 + workloadPct / 100.0) * (curHeadcount / simHeadcount);
      const rebalancedU = scaledU * (1.0 - (redistribPct / 100.0) * 0.65) + rawSimUtil * ((redistribPct / 100.0) * 0.65);
      simDeptU.push(Number(rebalancedU.toFixed(1)));
    });

    destroyChart("chartSimDeptUtil");
    CHARTS["chartSimDeptUtil"] = new Chart(document.getElementById("chartSimDeptUtil"), {
      type: "bar",
      data: {
        labels: depts,
        datasets: [
          { label: "Current Utilization (%)", data: curDeptU, backgroundColor: COLORS.slate, borderRadius: 3 },
          { label: "Simulated Utilization (%) — Model Estimate", data: simDeptU, backgroundColor: COLORS.teal, borderRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, suggestedMax: 140 } }
      }
    });

    // Multi-metric Impact Profile Chart
    destroyChart("chartSimImpactProfile");
    CHARTS["chartSimImpactProfile"] = new Chart(document.getElementById("chartSimImpactProfile"), {
      type: "bar",
      data: {
        labels: ["Effective Prod.", "Quality (x10)", "Engagement (x10)", "OvertimeHrs (x5)", "High-Risk Staff"],
        datasets: [
          {
            label: "Current State",
            data: [curEffProd, curQuality * 10, curEngagement * 10, curOvertime * 5, curHighRisk],
            backgroundColor: COLORS.blue,
            borderRadius: 3
          },
          {
            label: "Simulated Model Estimate",
            data: [simEffProd, simQuality * 10, simEngagement * 10, simOvertime * 5, simHighRisk],
            backgroundColor: COLORS.green,
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 11 } } } }
      }
    });
  }

  // ========================================================================
  // COO 30-SECOND EXECUTIVE BRIEFING MODAL
  // ========================================================================
  function renderCooBriefModal() {
    const entityRows = getEntityFilteredRows();
    const curRows = getCurrentRegimeRows();
    const baseRows = getBaselineRows();
    const tp = calculateProductivityTippingPoint(entityRows);
    const empSummaries = aggregateByEmployee(curRows, baseRows);

    const curUtil = mean(curRows.map(r => r.Capacity_Utilization_Percentage));
    const curEff = mean(curRows.map(r => r.Effective_Productivity_Index));
    const baseEff = mean(baseRows.map(r => r.Effective_Productivity_Index));
    const effDrop = baseEff > 0 ? ((curEff - baseEff) / baseEff) * 100.0 : 0;
    const highRiskCount = empSummaries.filter(e => e.Workload_Risk === "High").length;

    document.getElementById("cooBriefModalBody").innerHTML = `
      <div style="background-color: #F8FAFC; border: 1px solid var(--border-color); border-left: 4px solid var(--brand-navy); padding: 14px 18px; border-radius: 4px; margin-bottom: 18px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-blue);">CORE MANAGEMENT QUESTION ANSWERED</div>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-top: 4px;">
          Optimal advertising output and sustainable productivity are achieved at <strong>${fmt(tp.peakWorkload - 2.8, 1)}–${fmt(tp.peakWorkload, 1)} workload points per employee-week</strong> (92%–98% of individual sustainable capacity), where hourly velocity peaks at <strong>${fmt(tp.peakProdPerHr, 3)} pts/hr</strong> and deliverable quality remains above 9.0/10.
        </div>
      </div>

      <div class="grid-2" style="gap: 14px;">
        <div class="issue-item issue-critical">
          <div class="issue-title"><span>1. Are we overloaded?</span><span class="badge badge-overload">YES — SELECTIVELY</span></div>
          <div class="issue-desc">Agency-wide utilization in H1 2026 averages <strong>${fmt(curUtil, 1)}%</strong> of sustainable capacity, with weekly overtime averaging <strong>${fmt(mean(curRows.map(r => r.Overtime_Hours)), 1)} hrs/employee</strong>.</div>
        </div>

        <div class="issue-item issue-critical">
          <div class="issue-title"><span>2. Where is the overload concentrated?</span><span class="badge badge-overload">2 BOTTLENECKS</span></div>
          <div class="issue-desc"><strong>Video &amp; Motion (~129% utilization)</strong> and <strong>Creative Design (~123% utilization)</strong> carry the overload, whereas <strong>Copywriting (~89%)</strong> and <strong>Strategy (~85%)</strong> have unallocated capacity.</div>
        </div>

        <div class="issue-item issue-warning">
          <div class="issue-title"><span>3. When did productivity start declining?</span><span class="badge badge-warning">SEP–OCT 2025</span></div>
          <div class="issue-desc">Following the Q3 2025 campaign surge, working hours rose +21% while Effective Productivity decoupled and fell <strong>${fmtPct(effDrop, 1)}</strong> relative to the H1 2025 baseline.</div>
        </div>

        <div class="issue-item">
          <div class="issue-title"><span>4. What workload level is sustainable?</span><span class="badge badge-sustainable">${fmt(tp.peakWorkload, 1)} PTS PEAK</span></div>
          <div class="issue-desc">Empirical regression identifies the <strong>Productivity Tipping Point at ${fmt(tp.peakWorkload, 1)} points</strong>. Above ${fmt(tp.warningThreshold, 1)} points, hourly velocity drops by ${fmtPct(Math.abs(tp.lossBeyondThresholdPct), 1, false)}.</div>
        </div>

        <div class="issue-item issue-critical">
          <div class="issue-title"><span>5. Which teams/employees are at risk?</span><span class="badge badge-overload">${highRiskCount} HIGH-RISK STAFF</span></div>
          <div class="issue-desc"><strong>${highRiskCount} of 60 employees</strong> are classified in High Workload Sustainability Risk, concentrated among Motion Designers, Video Editors, and Graphic Designers.</div>
        </div>

        <div class="issue-item issue-warning">
          <div class="issue-title"><span>6. Why is productivity deteriorating?</span><span class="badge badge-warning">FATIGUE &amp; REWORK</span></div>
          <div class="issue-desc">Excessive workload triggers chronic overtime, which inflates client revision rounds (from 1.1 to 3.1/ad) and stretches completion time from 2.5 to 4.3 days.</div>
        </div>

        <div class="issue-item">
          <div class="issue-title"><span>7. Where can work be redistributed?</span><span class="badge badge-sustainable">~85 PTS/WK SHIFT</span></div>
          <div class="issue-desc">Approximately <strong>80–95 workload points/week</strong> of storyboarding, concept copy-decking, and campaign scoping can shift from Design/Video to Copywriting and Strategy.</div>
        </div>

        <div class="issue-item">
          <div class="issue-title"><span>8. What should management do next?</span><span class="badge badge-sustainable">3-STEP ACTION PLAN</span></div>
          <div class="issue-desc">(1) Rebalance ~85 pts/wk across teams, (2) Cap weekly assignments at ${fmt(tp.peakWorkload, 1)} pts, and (3) Add +0.75d SLA buffer on Tier-2 campaigns to cut overtime by ~50%.</div>
        </div>
      </div>
    `;
  }

  // Bootstrap Application on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    initFilterControls();
    renderAll();
  });
})();
