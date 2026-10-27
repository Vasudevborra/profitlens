import csv
import json
import math
import random
from datetime import datetime, timedelta

def generate_dataset():
    random.seed(42)
    
    master_path = r"C:\Users\Personal\.gemini\antigravity\scratch\creative-capacity-intelligence\employee_master.csv"
    employees = []
    with open(master_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            employees.append(row)
            
    # 78 weeks from Monday Jan 6, 2025 to Monday Jun 29, 2026
    start_date = datetime(2025, 1, 6)
    weeks = [start_date + timedelta(weeks=i) for i in range(78)]
    
    fieldnames = [
        'Employee_ID', 'Week_Start', 'Month', 'Quarter', 'Department', 'Role',
        'Experience_Months', 'Skill_Level', 'Ads_Assigned', 'Ads_Completed',
        'Workload_Points', 'Working_Hours', 'Overtime_Hours', 'Overtime_Days',
        'Absenteeism_Days', 'Avg_Completion_Days', 'Revision_Count',
        'Quality_Score', 'Client_Satisfaction', 'Engagement_Score',
        'Performance_Score', 'Deadline_Met_Percentage',
        'Sustainable_Capacity_Points', 'Capacity_Utilization_Percentage',
        'Workload_Risk', 'Productivity_Points_Per_Hour',
        'Effective_Productivity_Index', 'Historical_Baseline_Productivity',
        'Productivity_Change_Percentage'
    ]
    
    all_rows = []
    
    for emp in employees:
        emp_id = emp['Employee_ID'].strip()
        dept = emp['Department'].strip()
        role = emp['Role'].strip()
        start_exp = float(emp['Experience_Months_At_Start'])
        skill = emp['Skill_Level'].strip()
        sus_cap = float(emp['Sustainable_Capacity_Points'])
        
        if dept == 'Video & Motion':
            peak_multiplier = 1.30
        elif dept == 'Creative Design':
            peak_multiplier = 1.24
        elif dept == 'Account Management':
            peak_multiplier = 1.07
        elif dept == 'Copywriting':
            peak_multiplier = 0.89
        elif dept == 'Strategy':
            peak_multiplier = 0.85
        else:
            peak_multiplier = 1.0
            
        indiv_factor = 1.0 + random.uniform(-0.04, 0.04)
        indiv_skill_bonus = 0.03 if skill == 'Senior' else (0.0 if skill == 'Intermediate' else -0.02)
        
        temp_weeks = []
        
        for w_idx, w_date in enumerate(weeks):
            week_str = w_date.strftime('%Y-%m-%d')
            month_str = w_date.strftime('%Y-%m')
            quarter_str = f"{w_date.year}-Q{(w_date.month - 1)//3 + 1}"
            exp_months = round(start_exp + (w_idx * 7.0 / 30.4375), 1)
            
            # Timeline progression:
            # Weeks 0..30 (Jan - early Aug 2025): Baseline sustainable operations
            # Weeks 31..41 (mid Aug - Oct 2025): Client expansion & workload surge
            # Weeks 42..77 (Nov 2025 - Jun 2026): High-workload regime in bottlenecked departments
            if w_idx < 31:
                util_target = random.uniform(0.88, 0.98)
            elif w_idx < 42:
                prog = (w_idx - 31) / 11.0
                util_target = 0.94 + prog * (peak_multiplier - 0.94) + random.uniform(-0.03, 0.03)
            else:
                # Seasonal/campaign wave in Q4 2025 and Q1-Q2 2026
                wave = 0.03 * math.sin((w_idx - 42) / 4.0)
                util_target = peak_multiplier + wave + random.uniform(-0.04, 0.05)
                
            workload_points = round(max(11.0, sus_cap * util_target * indiv_factor + random.gauss(0, 0.7)), 1)
            capacity_util = round((workload_points / sus_cap) * 100.0, 1)
            
            pts_per_ad = 2.5 if skill == 'Senior' else (1.9 if skill == 'Intermediate' else 1.4)
            ads_assigned = max(2, int(round(workload_points / pts_per_ad + random.uniform(-0.4, 0.4))))
            
            if capacity_util > 120:
                comp_ratio = random.uniform(0.78, 0.89)
            elif capacity_util > 106:
                comp_ratio = random.uniform(0.88, 0.95)
            else:
                comp_ratio = random.uniform(0.96, 1.0)
            ads_completed = max(1, min(ads_assigned, int(round(ads_assigned * comp_ratio))))
            
            # Working hours & Overtime
            # Notice the key productivity tipping point behavior:
            # Up to ~100% capacity (around 24-26 pts), hours stay near 39-41.5 and productivity per hour increases with flow.
            # Above 102% capacity (>26.5 pts), working hours and overtime surge disproportionately while output per hour drops!
            excess_pts = max(0.0, workload_points - sus_cap * 0.98)
            if excess_pts > 0:
                # Non-linear overtime penalty due to context switching & fatigue
                ot_raw = (excess_pts ** 1.22) * random.uniform(1.35, 1.62)
                if w_idx > 44 and capacity_util > 112:
                    ot_raw += (w_idx - 44) * 0.11
            else:
                ot_raw = max(0.0, random.gauss(0.6, 0.6))
                
            overtime_hours = round(min(26.0, max(0.0, ot_raw)), 1)
            base_hours = round(random.uniform(38.5, 40.2), 1) if overtime_hours == 0 else 40.0
            working_hours = round(base_hours + overtime_hours, 1)
            overtime_days = min(5, max(0, int(round(overtime_hours / 3.1))))
            
            overload_ratio = max(0.0, (capacity_util - 100.0) / 100.0)
            chronic_fatigue = max(0.0, (w_idx - 36) / 42.0) if (w_idx > 36 and capacity_util > 106) else 0.0
            
            # Productivity Points Per Hour
            # Directly computed as Workload_Points / Working_Hours, shaped so the empirical curve peaks around 25-26.5 points
            # Wait: if workload_points increases from 16 to 25 while working_hours stays ~40, prod_per_hr rises from 0.40 to ~0.63!
            # Then above 26 points, overtime surges faster than workload points (or effective output slows), pulling prod_per_hr down!
            # Let's make sure when excess_pts > 1.5, working_hours grows fast enough that workload_points / working_hours bends downward above ~26 points!
            if workload_points > 26.2:
                extra_above_peak = workload_points - 26.2
                # Fatigue & coordination drag adds hours
                drag_hours = (extra_above_peak ** 1.35) * 1.45 + chronic_fatigue * 4.5
                working_hours = round(max(working_hours, 40.5 + drag_hours + random.uniform(-0.8, 0.8)), 1)
                overtime_hours = round(max(0.0, working_hours - 40.0), 1)
                overtime_days = min(5, max(0, int(round(overtime_hours / 3.1))))
                
            prod_per_hr = round(workload_points / working_hours, 3)
            
            # Completion time (days)
            avg_comp_days = round(min(6.8, max(1.8, 2.45 + overload_ratio * 4.6 + chronic_fatigue * 0.95 + random.gauss(0, 0.22))), 2)
            
            # Revisions
            rev_count = round(min(5.8, max(0.4, 1.05 + overload_ratio * 4.8 + chronic_fatigue * 0.75 + random.gauss(0, 0.18))), 1)
            
            # Quality Score (1-10)
            quality_score = round(min(9.8, max(5.6, 9.15 + indiv_skill_bonus * 5 - overload_ratio * 3.8 - chronic_fatigue * 0.8 + random.gauss(0, 0.18))), 1)
            
            # Client Satisfaction (1-10)
            client_sat = round(min(9.8, max(5.4, 9.20 - overload_ratio * 3.9 - max(0, rev_count - 1.2) * 0.35 + random.gauss(0, 0.2))), 1)
            
            # Engagement Score (1-10)
            engagement_score = round(min(9.6, max(4.2, 8.85 - (overtime_hours / 22.0) * 3.4 - chronic_fatigue * 1.55 + random.gauss(0, 0.22))), 1)
            
            # Absenteeism Days (lagging indicator of chronic overload & low engagement)
            if chronic_fatigue > 0.25 and (engagement_score < 6.8 or overtime_hours > 9.0):
                r_val = random.random()
                if r_val < 0.42:
                    absenteeism_days = 0.0
                elif r_val < 0.72:
                    absenteeism_days = 0.5
                elif r_val < 0.91:
                    absenteeism_days = 1.0
                else:
                    absenteeism_days = 1.5
            else:
                absenteeism_days = 0.5 if random.random() < 0.055 else 0.0
                
            # Deadline Met %
            deadline_met = round(min(100.0, max(58.0, 96.8 - overload_ratio * 48.0 - chronic_fatigue * 11.5 + random.gauss(0, 1.8))), 1)
            
            # Performance Score (0-100)
            perf_score = round(min(99.0, max(48.0, quality_score * 4.6 + deadline_met * 0.35 + engagement_score * 1.9 + random.gauss(0, 1.2))), 1)
            
            # Effective Productivity Index (Normalized around ~95-102 in healthy state, penalizing revisions, quality drop, and missed deadlines)
            quality_factor = (quality_score / 9.1) ** 0.45
            rework_penalty = 1.0 / (1.0 + 0.16 * max(0.0, rev_count - 1.15))
            deadline_factor = (deadline_met / 96.0) ** 0.35
            eff_prod_index = round(prod_per_hr * 172.0 * quality_factor * rework_penalty * deadline_factor, 1)
            
            temp_weeks.append({
                'Employee_ID': emp_id,
                'Week_Start': week_str,
                'Month': month_str,
                'Quarter': quarter_str,
                'Department': dept,
                'Role': role,
                'Experience_Months': exp_months,
                'Skill_Level': skill,
                'Ads_Assigned': ads_assigned,
                'Ads_Completed': ads_completed,
                'Workload_Points': workload_points,
                'Working_Hours': working_hours,
                'Overtime_Hours': overtime_hours,
                'Overtime_Days': overtime_days,
                'Absenteeism_Days': absenteeism_days,
                'Avg_Completion_Days': avg_comp_days,
                'Revision_Count': rev_count,
                'Quality_Score': quality_score,
                'Client_Satisfaction': client_sat,
                'Engagement_Score': engagement_score,
                'Performance_Score': perf_score,
                'Deadline_Met_Percentage': deadline_met,
                'Sustainable_Capacity_Points': sus_cap,
                'Capacity_Utilization_Percentage': capacity_util,
                'Productivity_Points_Per_Hour': prod_per_hr,
                'Effective_Productivity_Index': eff_prod_index,
                'w_idx': w_idx
            })
            
        baseline_vals = [r['Effective_Productivity_Index'] for r in temp_weeks if r['w_idx'] < 26]
        baseline_eff = round(sum(baseline_vals) / len(baseline_vals), 1)
        
        for r in temp_weeks:
            eff_idx = r['Effective_Productivity_Index']
            prod_change_pct = round(((eff_idx - baseline_eff) / baseline_eff) * 100.0, 1)
            
            cap_u = r['Capacity_Utilization_Percentage']
            ot_h = r['Overtime_Hours']
            eng_s = r['Engagement_Score']
            rev_c = r['Revision_Count']
            abs_d = r['Absenteeism_Days']
            
            if (cap_u > 114.0 and (ot_h >= 6.5 or rev_c >= 2.4 or eng_s <= 6.8 or abs_d >= 0.5)) or cap_u >= 122.0:
                risk = 'High'
            elif cap_u >= 102.0 or ot_h >= 3.8 or eng_s <= 7.3 or rev_c >= 1.9:
                risk = 'Medium'
            else:
                risk = 'Low'
                
            r['Historical_Baseline_Productivity'] = baseline_eff
            r['Productivity_Change_Percentage'] = prod_change_pct
            r['Workload_Risk'] = risk
            del r['w_idx']
            all_rows.append(r)
            
    csv_path1 = r"C:\Users\Personal\.gemini\antigravity\scratch\creative-capacity-intelligence\Advertising_Agency_Creative_Capacity_Historical_Data.csv"
    csv_path2 = r"C:\Users\Personal\Downloads\Advertising_Agency_Creative_Capacity_Historical_Data.csv"
    
    for path in [csv_path1, csv_path2]:
        with open(path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)
            
    # Also write data.js so the frontend has zero-latency access
    js_path = r"C:\Users\Personal\.gemini\antigravity\scratch\creative-capacity-intelligence\data.js"
    with open(js_path, mode='w', encoding='utf-8') as f:
        f.write("// Auto-generated historical dataset for Creative Capacity Intelligence\n")
        f.write("window.EMPLOYEE_MASTER = ")
        json.dump(employees, f)
        f.write(";\nwindow.AGENCY_DATA = ")
        json.dump(all_rows, f)
        f.write(";\n")
        
    print(f"Generated {len(all_rows)} rows successfully.")

if __name__ == '__main__':
    generate_dataset()
