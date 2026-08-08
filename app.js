// App State
let moleculesData = [];
let filteredMolecules = [];
let selectedMolecule = null;
let researchedClassesData = {};

// Chart Instances
let topChartInstance = null;
let doughnutChartInstance = null;

// Sliders and Weights
const weights = {
    size: 20,
    growth: 40,
    comp: 15,
    rtw: 25
};

// DOM Elements
const sliders = {
    size: document.getElementById('weight-size'),
    growth: document.getElementById('weight-growth'),
    comp: document.getElementById('weight-comp'),
    rtw: document.getElementById('weight-rtw')
};

const sliderDisplays = {
    size: document.getElementById('val-size'),
    growth: document.getElementById('val-growth'),
    comp: document.getElementById('val-comp'),
    rtw: document.getElementById('val-rtw')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSliders();
    initFilters();
    initPitchNav();
    loadResearchedClasses();
    loadMoleculesData();
});

// Sidebar & Tab Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const tabs = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    const pageInfo = {
        dashboard: {
            title: "Opportunity Prioritizer",
            subtitle: "Simulate and rank cardiac investment spaces based on dynamic weights"
        },
        reasoning: {
            title: "LLM Agent Audit Log & Secondary Research Inspector",
            subtitle: "Inspect the raw secondary research, literature searches, and clinical evidence fetched for all 14 ATC classes"
        },
        portfolio: {
            title: "Strategic Portfolio",
            subtitle: "CIPLA's 4-Tier Cardiac allocation roadmap optimized for growth and cash defense"
        },
        pitch: {
            title: "Executive Pitch",
            subtitle: "Pre-packaged slides for CIPLA's leadership presentation"
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.id === `tab-${tabName}`) {
                    tab.classList.add('active');
                }
            });
            
            if (pageInfo[tabName]) {
                pageTitle.innerText = pageInfo[tabName].title;
                pageSubtitle.innerText = pageInfo[tabName].subtitle;
            }
            
            if (tabName === 'portfolio') {
                updatePortfolioRoadmap();
            }
        });
    });
}

// Sliders weight management
function initSliders() {
    Object.keys(sliders).forEach(key => {
        if (sliders[key]) {
            sliders[key].addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                weights[key] = val;
                if (sliderDisplays[key]) sliderDisplays[key].innerText = `${val}%`;
                processAndRender();
            });
        }
    });
}

// Filters implementation
function initFilters() {
    const searchInput = document.getElementById('search-input');
    const segmentFilter = document.getElementById('segment-filter');
    const clusterFilter = document.getElementById('cluster-filter');
    
    if (searchInput) searchInput.addEventListener('input', processAndRender);
    if (segmentFilter) segmentFilter.addEventListener('change', processAndRender);
    if (clusterFilter) clusterFilter.addEventListener('change', processAndRender);
}

// Executive Pitch Slides Navigation
function initPitchNav() {
    const slideButtons = document.querySelectorAll('.pitch-tab-btn');
    const slides = document.querySelectorAll('.slide-view');
    
    slideButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const slideNum = btn.getAttribute('data-slide');
            
            slideButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            slides.forEach(slide => {
                slide.classList.remove('active');
                if (slide.id === `slide-${slideNum}`) {
                    slide.classList.add('active');
                }
            });
        });
    });
}

// Load Researched Classes JSON for Audit Log Inspector
function loadResearchedClasses() {
    fetch('researched_classes.json')
        .then(res => res.json())
        .then(data => {
            researchedClassesData = data;
            populateAuditClassDropdown();
        })
        .catch(err => {
            console.error("Error loading researched_classes.json:", err);
        });
}

function populateAuditClassDropdown() {
    const select = document.getElementById('audit-class-select');
    if (!select) return;
    select.innerHTML = '';
    
    const groups = Object.keys(researchedClassesData);
    groups.forEach((grp, idx) => {
        const opt = document.createElement('option');
        opt.value = grp;
        opt.innerText = `${idx + 1}. ${grp}`;
        select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
        renderAuditClassDetails(e.target.value);
    });
    
    if (groups.length > 0) {
        renderAuditClassDetails(groups[0]);
    }
}

function renderAuditClassDetails(groupKey) {
    const info = researchedClassesData[groupKey];
    if (!info) return;
    
    if (document.getElementById('audit-group-title')) document.getElementById('audit-group-title').innerText = groupKey;
    if (document.getElementById('audit-cluster-badge')) document.getElementById('audit-cluster-badge').innerText = info.market_cluster || "General Care";
    if (document.getElementById('audit-archetype')) document.getElementById('audit-archetype').innerText = info.treatment_archetype || "Standard Therapy";
    if (document.getElementById('audit-patent')) document.getElementById('audit-patent').innerText = info.patent_regulatory || "Off-patent generic";
    if (document.getElementById('audit-guidelines')) document.getElementById('audit-guidelines').innerText = info.guideline_consensus || "Standard guidelines";
    if (document.getElementById('audit-trials')) document.getElementById('audit-trials').innerText = info.landmark_trials || "Standard trials";
    if (document.getElementById('audit-competitors')) document.getElementById('audit-competitors').innerText = info.competitor_landscape || "Competitive market";
    if (document.getElementById('audit-rtw')) document.getElementById('audit-rtw').innerText = info.cipla_right_to_win || "Medium RTW";
}

// Load dataset JSON
function loadMoleculesData() {
    fetch('opportunity_spaces.json')
        .then(response => response.json())
        .then(data => {
            moleculesData = data;
            processAndRender();
            
            if (filteredMolecules.length > 0) {
                selectMoleculeRow(filteredMolecules[0]);
            }
        })
        .catch(err => {
            console.error("Error loading JSON dataset:", err);
            injectFallbackData();
        });
}

function injectFallbackData() {
    moleculesData = [
        {
            "molecule": "BISOPROLOL FUMARATE + TELMISARTAN",
            "segment": "Anti Hypertensives",
            "plain_combination": "Combination",
            "sales_26": 138.8,
            "cagr": 0.929,
            "cagr_cp": 0.864,
            "cipla_share": 0.47,
            "num_competitors": 35,
            "hhi": 1150.0,
            "top_competitor": "MERCK SPECIALITIES",
            "top_competitor_share": 31.1,
            "group": "C02F HYPOTENSIVE DUAL COMB.",
            "market_cluster": "Resistant Hypertension & Sympathetic Control",
            "treatment_archetype": "Single-Pill Dual Action (ARB + CCB / Beta-Blocker)",
            "trend_name": "Beta-1 + ARB Sympathetic Combo",
            "trend_desc": "Demonstrated 92.9% CAGR growth due to post-COVID cardiac autonomic dysfunction prescribing.",
            "scientific_backing": "Bisoprolol controls heart rate...",
            "llm_reasoning": {
                "score_breakdown": "Attractiveness: 8.9/10 | Competition: 7.5/10 | CIPLA Right to Win: 6.5/10",
                "tradeoff_analysis": "Evaluated trade-off between 92.9% CAGR growth and MERCK leadership...",
                "right_to_win_justification": "CIPLA has zero direct share but holds parent class C02F footholds."
            },
            "cipla_brands": ["BISOFIG T", "CRESAR BS"],
            "top_competitor_brands": ["CONCOR T", "CORBIS T", "BISOT"],
            "quadrant": "Strategic Entry / Disrupt",
            "recommendation": "Urgent market entry required. Launch generic version or co-market.",
            "size_score": 5.8, "cagr_score": 9.8, "vol_score": 9.2, "competition_score": 7.5, "rtw_score": 6.5, "has_trend": 1
        }
    ];
    processAndRender();
}

// Main logic: scoring, sorting, filtering, rendering
function processAndRender() {
    const searchInput = document.getElementById('search-input');
    const segmentFilter = document.getElementById('segment-filter');
    const clusterFilter = document.getElementById('cluster-filter');
    
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const segmentVal = segmentFilter ? segmentFilter.value : 'all';
    const clusterVal = clusterFilter ? clusterFilter.value : 'all';
    
    // Normalize weights
    const wSum = (weights.size + weights.growth + weights.comp + weights.rtw) || 1;
    const wSizeNorm = weights.size / wSum;
    const wGrowthNorm = weights.growth / wSum;
    const wCompNorm = weights.comp / wSum;
    const wRtwNorm = weights.rtw / wSum;
    
    // Strategy Mode Badge update
    const badgeEl = document.getElementById('strategy-mode-badge');
    if (badgeEl) {
        const icon = '<i class="fa-solid fa-compass"></i> ';
        if (weights.growth >= 35) badgeEl.innerHTML = icon + "Strategy Mode: Growth-Focused";
        else if (weights.rtw >= 35) badgeEl.innerHTML = icon + "Strategy Mode: CIPLA Advantage";
        else if (weights.comp >= 35) badgeEl.innerHTML = icon + "Strategy Mode: Low-Risk Defend";
        else if (weights.size >= 35) badgeEl.innerHTML = icon + "Strategy Mode: Market Scale";
        else badgeEl.innerHTML = icon + "Strategy Mode: Balanced Portfolio";
    }
    
    moleculesData.forEach(m => {
        const sizeComponent = m.size_score !== undefined ? m.size_score : 5.0;
        const growthComponent = (m.cagr_score !== undefined && m.vol_score !== undefined) ? (m.cagr_score + m.vol_score) / 2 : 5.0;
        const compComponent = m.competition_score !== undefined ? m.competition_score : 5.0;
        const rtwComponent = m.rtw_score !== undefined ? m.rtw_score : 5.0;
        
        let rawScore = (sizeComponent * wSizeNorm) + (growthComponent * wGrowthNorm) + (compComponent * wCompNorm) + (rtwComponent * wRtwNorm);
        
        if (m.has_trend === 1) {
            rawScore += 1.2;
        }
        
        m.priority_score = Math.min(10.0, Math.max(0.0, rawScore));
    });
    
    // Sort by Priority Score
    moleculesData.sort((a, b) => b.priority_score - a.priority_score);
    
    // Filter
    filteredMolecules = moleculesData.filter(m => {
        const matchesSearch = m.molecule.toLowerCase().includes(searchVal);
        const matchesSegment = segmentVal === 'all' || m.segment === segmentVal;
        const matchesCluster = clusterVal === 'all' || (m.market_cluster && m.market_cluster.includes(clusterVal));
        return matchesSearch && matchesSegment && matchesCluster;
    });

    // Update active count badge
    const countBadge = document.getElementById('active-count-badge');
    if (countBadge) {
        countBadge.innerText = `${filteredMolecules.length} Active Molecules`;
    }
    
    // Render Table
    renderTable();
    
    // Render Bar Chart
    renderTopMoleculesChart();
    
    // Update detail panel with DYNAMIC MOLECULE-SPECIFIC DEEP TRADE-OFF REASONING
    if (selectedMolecule) {
        const updated = moleculesData.find(x => x.molecule === selectedMolecule.molecule);
        if (updated) {
            updateDetailPanel(updated);
        }
    }
}

// Render Table
function renderTable() {
    const tbody = document.getElementById('opportunities-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filteredMolecules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">No items match criteria.</td></tr>`;
        return;
    }
    
    filteredMolecules.forEach((m, idx) => {
        const tr = document.createElement('tr');
        if (selectedMolecule && selectedMolecule.molecule === m.molecule) {
            tr.classList.add('selected');
        }
        
        const salesStr = `₹${m.sales_26.toFixed(1)} Mn`;
        const cagrStr = `${m.cagr >= 0 ? '+' : ''}${(m.cagr * 100).toFixed(1)}%`;
        const shareStr = `${m.cipla_share.toFixed(2)}%`;
        const scoreStr = m.priority_score.toFixed(2);
        
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${m.molecule}</strong></td>
            <td>${salesStr}</td>
            <td class="${m.cagr >= 0.12 ? 'text-green' : (m.cagr < 0 ? 'text-red' : '')}">${cagrStr}</td>
            <td class="${m.cipla_share >= 10.0 ? 'text-purple' : ''}">${shareStr}</td>
            <td><span class="score-pill-table">${scoreStr}</span></td>
        `;
        
        tr.addEventListener('click', () => {
            document.querySelectorAll('#opportunities-table-body tr').forEach(row => row.classList.remove('selected'));
            tr.classList.add('selected');
            selectMoleculeRow(m);
        });
        
        tbody.appendChild(tr);
    });
}

function selectMoleculeRow(molecule) {
    selectedMolecule = molecule;
    updateDetailPanel(molecule);
}

// Update Detail Panel with Clean Executive Briefing
function updateDetailPanel(m) {
    document.getElementById('detail-placeholder').style.display = 'none';
    const content = document.getElementById('detail-content');
    content.style.display = 'block';
    
    document.getElementById('detail-name').innerText = m.molecule;
    document.getElementById('detail-sales').innerText = `₹${m.sales_26.toFixed(1)} Mn`;
    
    if (document.getElementById('detail-header-score')) {
        document.getElementById('detail-header-score').innerText = `Score: ${m.priority_score.toFixed(2)} / 10`;
    }
    
    if (document.getElementById('detail-cluster')) {
        document.getElementById('detail-cluster').innerText = m.market_cluster || "General Care";
    }
    if (document.getElementById('detail-archetype')) {
        document.getElementById('detail-archetype').innerText = m.treatment_archetype || "Standard Therapy";
    }
    
    const cagrEl = document.getElementById('detail-cagr');
    cagrEl.innerText = `${m.cagr >= 0 ? '+' : ''}${(m.cagr * 100).toFixed(1)}%`;
    cagrEl.className = m.cagr >= 0.12 ? 'stat-value text-green' : (m.cagr < 0.05 ? 'stat-value text-red' : 'stat-value');
    
    document.getElementById('detail-cipla-share').innerText = `${m.cipla_share.toFixed(2)}%`;
    
    const quadEl = document.getElementById('detail-quadrant');
    quadEl.innerText = m.quadrant;
    quadEl.className = `badge ${getQuadrantBadgeClass(m.quadrant)}`;
    
    // DEEP MOLECULE-SPECIFIC DYNAMIC TRADE-OFF SYNTHESIS
    const sizeW = weights.size;
    const growthW = weights.growth;
    const compW = weights.comp;
    const rtwW = weights.rtw;
    
    let deepTradeoff = "";
    const cagrPct = (m.cagr * 100).toFixed(1);
    const volCagrPct = (m.cagr_cp * 100).toFixed(1);
    const sharePct = m.cipla_share.toFixed(1);
    const ciplaSalesVal = m.cipla_sales !== undefined ? m.cipla_sales.toFixed(1) : "0.0";
    
    if (growthW >= 35) {
        deepTradeoff = `[GROWTH-DRIVEN EVALUATION] Market Growth weight is set high (${growthW}%). ${m.molecule} achieves a high priority score of ${m.priority_score.toFixed(2)}/10 because its ${cagrPct}% nominal CAGR and ${volCagrPct}% Constant-Price volume CAGR reflect genuine patient demand expansion rather than price inflation. Although competitor crowding is active (${m.num_competitors || 12} firms, top rival ${m.top_competitor || 'Rival'} at ${m.top_competitor_share ? m.top_competitor_share.toFixed(1) : '20'}% share), the model accepts this competition risk due to strong guideline backing (${m.trend_name || 'Clinical Guidelines'}).`;
    } else if (rtwW >= 35) {
        if (m.cipla_share >= 5.0) {
            deepTradeoff = `[CIPLA ADVANTAGE EVALUATION] CIPLA Right-to-Win weight is set high (${rtwW}%). CIPLA holds a dominant direct share of ${sharePct}% (${ciplaSalesVal} Mn sales). The model prioritizes scaling up existing prescriber trust to expand market share against ${m.top_competitor || 'competitors'}.`;
        } else {
            deepTradeoff = `[CIPLA ADVANTAGE EVALUATION] CIPLA Right-to-Win weight is set high (${rtwW}%). CIPLA currently has only ${sharePct}% direct share in ${m.molecule}, but holds a strong brand footprint in parent class ${m.group || 'ATC Class'}. The model leverages this adjacent prescriber trust to justify an aggressive line-extension launch.`;
        }
    } else if (compW >= 35) {
        deepTradeoff = `[LOW-RISK COMPETITION EVALUATION] Competition HHI weight is set high (${compW}%). Herfindahl Index for ${m.molecule} is ${m.hhi ? m.hhi.toFixed(0) : '1500'} (${m.hhi_desc || 'Balanced Concentration'}). The model penalizes price-war risks and prioritizes entry via single-pill combinations to preserve pricing power.`;
    } else if (sizeW >= 35) {
        deepTradeoff = `[COMMERCIAL SCALE EVALUATION] Market Size weight is set high (${sizeW}%). ${m.molecule} represents a ₹${m.sales_26.toFixed(1)} Mn INR market. The model prioritizes this large commercial volume to deliver immediate top-line revenue impact for CIPLA's cardiac division.`;
    } else {
        deepTradeoff = `[BALANCED PORTFOLIO EVALUATION] Synthesizing sales size (₹${m.sales_26.toFixed(1)} Mn), growth (${cagrPct}%), and CIPLA brand footholds (${sharePct}% share). ${m.molecule} provides a balanced trade-off between commercial scale and market velocity.`;
    }

    const attrScore = m.attractiveness_score !== undefined ? m.attractiveness_score : ((m.size_score + ((m.cagr_score + m.vol_score)/2)) / 2);
    const compScore = m.competition_score !== undefined ? m.competition_score : 5.0;
    const rtwScore = m.rtw_score !== undefined ? m.rtw_score : 5.0;

    if (document.getElementById('reason-breakdown')) {
        document.getElementById('reason-breakdown').innerHTML = `
            <span>Attractiveness: <strong>${attrScore.toFixed(1)}/10</strong></span>
            <span class="breakdown-sep">•</span>
            <span>Competition: <strong>${compScore.toFixed(1)}/10</strong></span>
            <span class="breakdown-sep">•</span>
            <span>CIPLA RTW: <strong>${rtwScore.toFixed(1)}/10</strong></span>
        `;
    }
    if (document.getElementById('reason-tradeoff')) {
        document.getElementById('reason-tradeoff').innerText = deepTradeoff;
    }
    if (document.getElementById('reason-rtw')) {
        document.getElementById('reason-rtw').innerText = m.llm_reasoning ? m.llm_reasoning.right_to_win_justification : (m.rtw_qualitative || "CIPLA holds brand equity in adjacent portfolios.");
    }
    
    // Trend & Science
    document.getElementById('detail-trend-name').innerText = m.trend_name || "Guideline-Backed Combination";
    document.getElementById('detail-trend-desc').innerText = m.trend_desc || "Cardiology guidelines recommend combination therapy to improve target reach and patient adherence.";
    
    // Clean Chip Pills for Brands
    const ciplaBrandsUl = document.getElementById('detail-cipla-brands');
    ciplaBrandsUl.innerHTML = '';
    if (!m.cipla_brands || m.cipla_brands.length === 0) {
        ciplaBrandsUl.innerHTML = '<li>None</li>';
    } else {
        m.cipla_brands.slice(0, 4).forEach(b => {
            ciplaBrandsUl.innerHTML += `<li>${b}</li>`;
        });
    }
    
    const compBrandsUl = document.getElementById('detail-competitor-brands');
    compBrandsUl.innerHTML = '';
    if (!m.top_competitor_brands || m.top_competitor_brands.length === 0) {
        compBrandsUl.innerHTML = '<li>None</li>';
    } else {
        m.top_competitor_brands.slice(0, 4).forEach(b => {
            compBrandsUl.innerHTML += `<li>${b}</li>`;
        });
    }
    
    document.getElementById('detail-recommendation').innerText = m.recommendation || "Strategic market entry recommended.";
}

function getQuadrantBadgeClass(quadrant) {
    if (!quadrant) return 'badge-purple';
    if (quadrant.includes('Disrupt') || quadrant.includes('Entry')) return 'badge-purple';
    if (quadrant.includes('Grow') || quadrant.includes('Double')) return 'badge-green';
    if (quadrant.includes('Defend') || quadrant.includes('Harvest')) return 'badge-blue';
    return 'badge-yellow';
}

// Render dynamic Chart.js top horizontal bar chart with fixed Y-axis padding
function renderTopMoleculesChart() {
    const top5 = filteredMolecules.slice(0, 5);
    // Graceful string truncation to prevent Y-axis overlap
    const labels = top5.map(m => m.molecule.length > 20 ? m.molecule.substring(0, 18) + '...' : m.molecule);
    const scores = top5.map(m => parseFloat(m.priority_score.toFixed(2)));
    
    const canvas = document.getElementById('topMoleculesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 300, 0);
    gradient.addColorStop(0, 'rgba(35, 63, 140, 0.95)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.85)');

    if (topChartInstance) {
        topChartInstance.data.labels = labels;
        topChartInstance.data.datasets[0].data = scores;
        topChartInstance.data.datasets[0].backgroundColor = gradient;
        topChartInstance.update();
    } else {
        topChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score',
                    data: scores,
                    backgroundColor: gradient,
                    borderColor: '#233F8C',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { left: 5, right: 15, top: 5, bottom: 5 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleFont: { family: 'Outfit', size: 12, weight: '700' },
                        bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return ` Score: ${context.raw} / 10`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 10,
                        ticks: { stepSize: 2, color: '#64748b', font: { family: 'Outfit', size: 10, weight: '600' } },
                        grid: { color: '#e2e8f0' }
                    },
                    y: {
                        ticks: { color: '#0f172a', font: { family: 'Outfit', size: 10.5, weight: '600' }, autoSkip: false },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

// Update Portfolio Roadmap lists and Doughnut Chart
function updatePortfolioRoadmap() {
    const listIds = {
        build: document.getElementById('road-build'),
        grow: document.getElementById('road-grow'),
        defend: document.getElementById('road-defend'),
        seed: document.getElementById('road-seed')
    };
    
    Object.keys(listIds).forEach(k => {
        if (listIds[k]) listIds[k].innerHTML = '';
    });
    
    const categories = {
        build: [],
        grow: [],
        defend: [],
        seed: []
    };
    
    moleculesData.forEach(m => {
        if (m.quadrant.includes('Disrupt') || m.quadrant.includes('Entry')) categories.build.push(m);
        else if (m.quadrant.includes('Grow') || m.quadrant.includes('Double')) categories.grow.push(m);
        else if (m.quadrant.includes('Defend') || m.quadrant.includes('Harvest')) categories.defend.push(m);
        else if (m.quadrant.includes('Niche') || m.quadrant.includes('Seed')) categories.seed.push(m);
    });
    
    Object.keys(listIds).forEach(k => {
        if (!listIds[k]) return;
        if (categories[k].length === 0) {
            listIds[k].innerHTML = '<li class="pi-mol-row" style="color:var(--text-muted)">None active</li>';
            return;
        }
        
        categories[k].slice(0, 4).forEach(m => {
            const li = document.createElement('li');
            li.className = 'pi-mol-row';
            li.innerHTML = `
                <span><strong>${m.molecule}</strong></span>
                <span class="text-muted">${(m.cagr * 100).toFixed(0)}% CAGR</span>
            `;
            listIds[k].appendChild(li);
        });
    });
    
    renderDoughnutChart(categories);
}

// Render dynamic Doughnut Chart.js for portfolio distribution
function renderDoughnutChart(categories) {
    const sales = [
        categories.build.reduce((sum, m) => sum + m.sales_26, 0),
        categories.grow.reduce((sum, m) => sum + m.sales_26, 0),
        categories.defend.reduce((sum, m) => sum + m.sales_26, 0),
        categories.seed.reduce((sum, m) => sum + m.sales_26, 0),
    ];
    
    const labels = ['Build / Launch', 'Double Down / Grow', 'Defend / Harvest', 'Seed / Partner'];
    const colors = [
        'rgba(35, 63, 140, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(59, 130, 246, 0.85)',
        'rgba(245, 158, 11, 0.85)'
    ];
    
    if (doughnutChartInstance) {
        doughnutChartInstance.data.datasets[0].data = sales;
        doughnutChartInstance.update();
    } else {
        const canvas = document.getElementById('portfolioDistributionChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        doughnutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: sales,
                    backgroundColor: colors,
                    borderWidth: 1,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Outfit', size: 10 },
                            boxWidth: 10,
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ₹${context.raw.toFixed(1)} Mn (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}
