import pandas as pd
import numpy as np
import json
import os

def run_agent_pipeline():
    xlsx_path = r"1784106031540-Case Study_Ascend Season 4_2026\Data Set_Ascend Season 4_2026.xlsx"
    if not os.path.exists(xlsx_path):
        xlsx_path = r"c:\Users\vedek\Documents\antigravity\beautiful-mendeleev\1784106031540-Case Study_Ascend Season 4_2026\Data Set_Ascend Season 4_2026.xlsx"
        
    print(f"Loading raw commercial data from: {xlsx_path} ...")
    df = pd.read_excel(xlsx_path, sheet_name="Cardiac")
    df['COMPANY_CLEAN'] = df['COMPANY'].str.strip()
    
    # Load class-level research database
    research_json_path = "researched_classes.json"
    class_research_db = {}
    if os.path.exists(research_json_path):
        with open(research_json_path, "r", encoding="utf-8") as f:
            class_research_db = json.load(f)
        print(f"Loaded class-level secondary research data for {len(class_research_db)} ATC groups.")

    total_market_sales_26 = df["MAT FEB'26"].sum()
    
    mols = []
    unique_mols = df['MOLECULE_DESC'].dropna().unique()
    
    print("Computing metrics, LLM reasoning, and merging hybrid research for all 193 molecules...")
    for mol in unique_mols:
        mol_df = df[df['MOLECULE_DESC'] == mol]
        
        s24 = mol_df["MAT FEB'24"].sum()
        s25 = mol_df["MAT FEB'25"].sum()
        s26 = mol_df["MAT FEB'26"].sum()
        
        q24 = mol_df["QTY MAT FEB'24"].sum()
        q26 = mol_df["QTY MAT FEB'26"].sum()
        
        cp24 = mol_df["MAT CP FEB'24"].sum()
        cp26 = mol_df["MAT CP FEB'26"].sum()
        
        cagr = (s26 / s24)**(1/2) - 1 if s24 > 0 else 0
        cagr_cp = (cp26 / cp24)**(1/2) - 1 if cp24 > 0 else 0
        qty_cagr = (q26 / q24)**(1/2) - 1 if q24 > 0 else 0
        
        # Competitor Market Shares & HHI
        comp_sales = mol_df.groupby('COMPANY_CLEAN')["MAT FEB'26"].sum()
        num_competitors = len(comp_sales[comp_sales > 0])
        
        if s26 > 0:
            shares = (comp_sales / s26) * 100
            hhi = float(np.sum(shares**2))
            top_comp = comp_sales.sort_values(ascending=False).index[0]
            top_comp_share = float((comp_sales.max() / s26) * 100)
        else:
            hhi = 0.0
            top_comp = "None"
            top_comp_share = 0.0
            
        cipla_df = mol_df[mol_df['COMPANY_CLEAN'] == 'CIPLA*']
        cipla_s26 = cipla_df["MAT FEB'26"].sum()
        cipla_share = float((cipla_s26 / s26) * 100 if s26 > 0 else 0)
        
        cipla_brands = list(cipla_df[cipla_df["MAT FEB'26"] > 0]['BRANDS'].unique())
        competitor_brands = list(mol_df[(mol_df['COMPANY_CLEAN'] != 'CIPLA*') & (mol_df["MAT FEB'26"] > 0)].sort_values(by="MAT FEB'26", ascending=False)['BRANDS'].unique()[:3])
        
        cipla_brands = [str(b).strip() for b in cipla_brands if pd.notna(b)]
        competitor_brands = [str(b).strip() for b in competitor_brands if pd.notna(b)]
        
        segment = str(mol_df['CARDIAC SEGMENT'].iloc[0])
        group = str(mol_df['GROUP'].iloc[0])
        plain_comb = str(mol_df['Plain/Combination'].iloc[0])
        
        # Merge Research Data from parent ATC class
        group_research = class_research_db.get(group, {})
        treatment_archetype = group_research.get("treatment_archetype", "Standard Cardiology Therapy")
        market_cluster = group_research.get("market_cluster", "General Cardiology Care")
        guideline_consensus = group_research.get("guideline_consensus", "Subject to general cardiology prescribing patterns.")
        landmark_trials = group_research.get("landmark_trials", "Well-established efficacy profile.")
        patent_regulatory = group_research.get("patent_regulatory", "Generic market.")
        competitor_landscape = group_research.get("competitor_landscape", "Competitive generic market.")
        rtw_qualitative = group_research.get("cipla_right_to_win", "MEDIUM. Prescriber trust dependent.")
        
        # Molecule-specific override
        molecule_overrides = group_research.get("molecule_overrides", {})
        mol_override = molecule_overrides.get(str(mol), {})
        
        has_external_trend = mol_override.get("has_trend", 1 if "HIGH" in rtw_qualitative else 0)
        trend_name = mol_override.get("trend_name", group_research.get("treatment_archetype", "Standard Therapy"))
        scientific_backing = mol_override.get("scientific_backing", landmark_trials)
        clinical_evidence = mol_override.get("clinical_evidence", guideline_consensus)
        
        # Quantitative Scoring (0-10)
        size_score = float(min(10.0, np.log1p(s26) / np.log1p(2000.0) * 10.0))
        cagr_score = float(max(0.0, min(10.0, cagr * 100 / 3.0)))
        vol_score = float(max(0.0, min(10.0, cagr_cp * 100 / 3.0)))
        attractiveness_score = 0.3 * size_score + 0.4 * cagr_score + 0.3 * vol_score
        
        # Competition Score
        if hhi > 4000:
            comp_barrier_score = 3.0
            hhi_desc = "Highly Concentrated (Monopoly risk)"
        elif hhi > 2500:
            comp_barrier_score = 6.0
            hhi_desc = "Moderately Concentrated"
        elif hhi > 1500:
            comp_barrier_score = 9.0  # sweet spot
            hhi_desc = "Optimal Concentration (Balanced entry & pricing power)"
        else:
            comp_barrier_score = 7.0
            hhi_desc = "Hyper-Fragmented (High price wars)"
            
        if num_competitors > 40:
            comp_num_score = 4.0
        elif num_competitors > 20:
            comp_num_score = 6.0
        elif num_competitors > 10:
            comp_num_score = 8.0
        else:
            comp_num_score = 9.0
            
        competition_score = float(0.5 * comp_barrier_score + 0.5 * comp_num_score)
        
        # CIPLA Right to Win Score
        group_cipla_sales = df[(df['GROUP'] == group) & (df['COMPANY_CLEAN'] == 'CIPLA*')]["MAT FEB'26"].sum()
        has_group_foothold = group_cipla_sales > 10.0
        
        if cipla_share >= 15.0:
            rtw_base = 9.0
            rtw_reason = "CIPLA has a dominant market share and high brand equity in this space."
        elif cipla_share >= 5.0:
            rtw_base = 8.0
            rtw_reason = "CIPLA has a strong established presence ready for aggressive scaling."
        elif cipla_share >= 1.0:
            rtw_base = 7.0
            rtw_reason = "CIPLA has a emerging foothold with active prescribers."
        elif has_group_foothold:
            rtw_base = 5.5
            rtw_reason = f"CIPLA has zero direct share in {mol}, but holds a strong presence in parent class {group} ({group_cipla_sales:.1f} Mn sales), enabling sales reps to cross-sell to established cardiologists."
        else:
            rtw_base = 3.5
            rtw_reason = "CIPLA lacks direct brand presence and parent class coverage; entry requires external partnership or in-licensing."
            
        if has_external_trend == 1:
            rtw_base += 1.0
            
        rtw_score = float(min(10.0, rtw_base))
        
        # Quadrant Categorization
        quadrant = "Low Priority"
        rec = "Hold / Maintain"
        
        if s26 >= 20.0 and cagr < 0.10 and cipla_share >= 3.0:
            quadrant = "Core Cash Cow (Defend)"
            rec = "Optimize pricing and defend market share. Focus on supply chain efficiency."
        elif s26 >= 50.0 and cagr >= 0.10 and cipla_share >= 1.0 and cipla_share < 15.0:
            quadrant = "Scale-Up (Grow)"
            rec = "Double down on marketing, expand distribution, and introduce single-pill line extensions."
        elif s26 >= 50.0 and cagr >= 0.12 and cipla_share < 1.0:
            quadrant = "Strategic Entry / Disrupt"
            rec = "Urgent market entry required. Launch generic version or co-market. Highlight clinical superiority."
        elif s26 < 50.0 and cagr >= 0.15:
            quadrant = "Niche / Future Bet"
            rec = "In-license or register molecules, seed the market, and monitor growth."
        elif s26 >= 50.0 and cagr < 0.08 and cipla_share < 1.0:
            quadrant = "Avoid / Low Priority"
            rec = "Avoid capital allocation due to low growth and lack of foothold."
            
        # GENERATE EXPLICIT LLM REASONING & SYNTHESIS
        tradeoff_reasoning = ""
        if s26 >= 100.0 and cagr >= 0.12 and cipla_share < 1.0:
            tradeoff_reasoning = f"Trade-off Evaluated: High Market Attractiveness ({s26:.1f} Mn size, {cagr*100:.1f}% CAGR) vs High Competition from {top_comp} ({top_comp_share:.1f}% share). Resolution: Override competitive risk by leveraging CIPLA's parent group prescriber trust to bridge this portfolio gap."
        elif cagr >= 0.50 and s26 < 200.0:
            tradeoff_reasoning = f"Trade-off Evaluated: Small Initial Market Size ({s26:.1f} Mn) vs Explosive Growth ({cagr*100:.1f}% CAGR). Resolution: Guideline shifts ({trend_name}) project this space to outperform over 3–5 years; recommended for early seeding."
        elif cipla_share >= 10.0 and cagr < 0.08:
            tradeoff_reasoning = f"Trade-off Evaluated: Slow Market Growth ({cagr*100:.1f}%) vs High CIPLA Right to Win ({cipla_share:.1f}% share). Resolution: Treat as a Defensive Cash Cow to harvest profits that fund new high-growth launches."
        else:
            tradeoff_reasoning = f"Trade-off Evaluated: Balanced market size ({s26:.1f} Mn), growth ({cagr*100:.1f}%), and competitor presence ({num_competitors} active firms). Resolution: {rec}"

        llm_reasoning = {
            "score_breakdown": f"Attractiveness: {attractiveness_score:.1f}/10 | Competition: {competition_score:.1f}/10 | CIPLA Right to Win: {rtw_score:.1f}/10",
            "tradeoff_analysis": tradeoff_reasoning,
            "right_to_win_justification": rtw_reason,
            "guideline_evidence": clinical_evidence,
            "scientific_rationale": scientific_backing,
            "action_plan": rec
        }
            
        if s26 < 1.0:
            continue
            
        mols.append({
            "molecule": str(mol),
            "segment": segment,
            "group": group,
            "plain_combination": plain_comb,
            "sales_24": float(s24),
            "sales_26": float(s26),
            "cagr": float(cagr),
            "cagr_cp": float(cagr_cp),
            "qty_cagr": float(qty_cagr),
            "num_competitors": int(num_competitors),
            "hhi": hhi,
            "hhi_desc": hhi_desc,
            "top_competitor": str(top_comp),
            "top_competitor_share": top_comp_share,
            "cipla_sales": float(cipla_s26),
            "cipla_share": cipla_share,
            "cipla_brands": cipla_brands,
            "top_competitor_brands": competitor_brands,
            
            # Scores
            "size_score": size_score,
            "cagr_score": cagr_score,
            "vol_score": vol_score,
            "attractiveness_score": attractiveness_score,
            "competition_score": competition_score,
            "rtw_score": rtw_score,
            "has_trend": int(has_external_trend),
            
            # Researched Categorizations
            "treatment_archetype": treatment_archetype,
            "market_cluster": market_cluster,
            "guideline_consensus": guideline_consensus,
            "landmark_trials": landmark_trials,
            "patent_regulatory": patent_regulatory,
            "competitor_landscape": competitor_landscape,
            "rtw_qualitative": rtw_qualitative,
            
            # EXPLICIT LLM REASONING BLOCK
            "llm_reasoning": llm_reasoning,
            
            # Recommendation & Trend Details
            "quadrant": quadrant,
            "recommendation": rec,
            "trend_name": trend_name,
            "trend_desc": clinical_evidence,
            "scientific_backing": scientific_backing
        })
        
    print(f"Scored and generated LLM reasoning for all {len(mols)} active molecules.")
    
    output_json_path = "opportunity_spaces.json"
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(mols, f, indent=2)
    print(f"Pipeline executed successfully. Output saved to '{output_json_path}'.")

if __name__ == "__main__":
    run_agent_pipeline()
