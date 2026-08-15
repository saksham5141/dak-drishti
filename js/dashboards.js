/**
 * DakDrishti 4.0 - Multi-Tier Administrative Command Hierarchy Dashboards
 * Tier 1: Post Office (SPM/Counter) | Tier 2: HPO | Tier 3: Divisional (SSPO) | Tier 4: Regional (CPMG)
 */

import { store, HIERARCHY_DATA } from './state.js';
import { speechService } from './speech.js';

export class DashboardHierarchyManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.selectedCounterId = 1;
    this.init();
  }

  init() {
    this.render();
    store.subscribe(() => {
      this.updateLiveElements();
    });
  }

  render() {
    const tier = store.currentTier;
    switch (tier) {
      case 'tier-1':
        this.renderTier1();
        break;
      case 'tier-2':
        this.renderTier2();
        break;
      case 'tier-3':
        this.renderTier3();
        break;
      case 'tier-4':
        this.renderTier4();
        break;
      default:
        this.renderTier1();
    }
  }

  // =========================================================================
  // TIER 1: Post Office / Sub-Postmaster (SPM) Operational Console
  // =========================================================================
  renderTier1() {
    const activeCounter = store.counters.find(c => c.id === this.selectedCounterId) || store.counters[0];
    const waitingTokens = store.tokens.filter(t => t.counterId === activeCounter.id && t.status === 'WAITING');
    const completedTokens = store.tokens.filter(t => t.counterId === activeCounter.id && t.status === 'COMPLETED').slice(0, 5);
    const servingToken = store.tokens.find(t => t.counterId === activeCounter.id && t.status === 'SERVING');

    this.container.innerHTML = `
      <div>
        <!-- Hall Digital Signage Token Display Board -->
        <div class="display-board-screen">
          <div class="display-board-header">
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: #FFB74D; letter-spacing: 0.08em; text-transform: uppercase;">
                DEPARTMENT OF POSTS • TOKEN CALL SYSTEM
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; margin-top: 2px;">
                डाकघर टोकन डिस्प्ले बोर्ड • Connaught Place HPO
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: #94A3B8; font-family: var(--font-mono);">
                DATE: ${new Date().toLocaleDateString()}
              </div>
              <div class="badge badge-green" style="margin-top: 4px;">● AUDIO CHIME SYNCED</div>
            </div>
          </div>

          <div class="display-tokens-grid" id="display-tokens-grid">
            ${store.counters.map(c => `
              <div class="display-token-cell ${c.status === 'serving' ? 'calling-now' : ''}">
                <div class="cell-counter-tag">${c.code}</div>
                <div class="cell-token-num">${c.servingToken}</div>
                <div class="cell-service-name">${c.service}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Operator Counter Workstation & Live Queue -->
        <div class="counter-operator-desk">
          <!-- Left: Counter Selection & Shift Controls -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><span>👤</span> Operator Console</h3>
              <span class="badge badge-green">Shift: 09:00 - 17:00</span>
            </div>

            <div class="form-group">
              <label class="form-label">Active Counter Desk</label>
              <select id="operator-counter-select" class="form-select">
                ${store.counters.map(c => `
                  <option value="${c.id}" ${c.id === this.selectedCounterId ? 'selected' : ''}>
                    ${c.code} - ${c.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div style="background: var(--bg-tertiary); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
              <div style="font-size: 0.78rem; color: var(--text-muted);">Assigned Operator</div>
              <div style="font-size: 0.95rem; font-weight: 700; margin-top: 2px;">${activeCounter.operatorName}</div>
              <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                Category: <strong>${activeCounter.category.toUpperCase()}</strong>
              </div>
            </div>

            <!-- Call Token Button with Voice Announcement -->
            <button id="btn-call-next-token" class="btn btn-primary btn-lg" style="width: 100%; margin-bottom: 8px;">
              📢 Call Next Token (Hindi & English Voice)
            </button>

            <!-- Re-announce Token in Hindi -->
            <button id="btn-announce-hindi" class="btn btn-secondary" style="width: 100%; margin-bottom: 10px; border-color: #F59E0B; background: #FEF3C7; color: #92400E; font-weight: 700;">
              🇮🇳 Re-announce in Hindi (हिंदी में टोकन पुकारें)
            </button>

            <button id="btn-complete-service" class="btn btn-success" style="width: 100%; margin-bottom: 10px;">
              ✅ Complete Current Token (${activeCounter.servingToken})
            </button>

            <!-- Test Vision Operator Unattended Toggle -->
            <button id="btn-toggle-presence" class="btn btn-secondary btn-sm" style="width: 100%;">
              ${activeCounter.operatorPresent ? '⏸️ Simulate Operator Away (Step Away)' : '▶️ Resume Operator at Desk'}
            </button>
          </div>

          <!-- Right: Active Queue & Token Flow for this Counter -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">
                  <span>📋</span> Live Queue for ${activeCounter.code} (${waitingTokens.length} Waiting)
                </h3>
                <p class="card-subtitle">Target SLA: Under ${Math.floor(activeCounter.slaThresholdSec / 60)} minutes per citizen</p>
              </div>
              <button class="btn btn-warning btn-sm" id="btn-reassign-quick">⚡ Rebalance Queue</button>
            </div>

            <div class="queue-queue-list">
              <!-- Currently Serving -->
              <div class="queue-token-item serving">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span class="badge badge-green">NOW SERVING</span>
                  <div>
                    <strong style="font-size: 1.1rem; color: var(--color-success); font-family: var(--font-mono);">
                      ${activeCounter.servingToken}
                    </strong>
                    <div style="font-size: 0.74rem; color: var(--text-secondary);">
                      Dwell: <strong>${Math.floor(activeCounter.servingCustomerDwellSec / 60)}m ${activeCounter.servingCustomerDwellSec % 60}s</strong>
                    </div>
                  </div>
                </div>
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-success);">In Service</div>
              </div>

              <!-- Waiting Queue List -->
              ${waitingTokens.length === 0 ? `
                <div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 0.85rem;">
                  No citizens currently waiting.
                </div>
              ` : waitingTokens.map((t, idx) => `
                <div class="queue-token-item">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); width: 24px;">#${idx + 1}</span>
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="font-family: var(--font-mono); font-size: 0.95rem;">${t.id}</strong>
                        ${t.priority ? '<span class="badge badge-amber">⚡ Priority</span>' : ''}
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${t.citizenName} • ${t.mobile}</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.78rem; font-family: var(--font-mono); font-weight: 700; color: ${t.waitSec > 300 ? 'var(--color-danger)' : 'var(--text-primary)'};">Wait: ${Math.floor(t.waitSec / 60)}m ${t.waitSec % 60}s</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">Issued: ${t.time}</div>
                  </div>
                </div>
              `).join('')}

              <!-- Recently Completed / Resolved Tokens -->
              ${completedTokens.length > 0 ? `
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                  <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 8px;">✅ Recently Resolved</div>
                  ${completedTokens.map(t => `
                    <div class="queue-token-item" style="opacity: 0.75; background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.2);">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1rem;">✅</span>
                        <div>
                          <strong style="font-family: var(--font-mono); font-size: 0.9rem; text-decoration: line-through; color: var(--text-muted);">${t.id}</strong>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${t.citizenName}</div>
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <span class="badge" style="background: rgba(16,185,129,0.15); color: #059669; font-size: 0.7rem;">Resolved</span>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${t.time}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachTier1Events();
  }

  attachTier1Events() {
    const select = document.getElementById('operator-counter-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.selectedCounterId = Number(e.target.value);
        this.renderTier1();
      });
    }

    const btnCall = document.getElementById('btn-call-next-token');
    if (btnCall) {
      btnCall.addEventListener('click', () => {
        const calledToken = store.callNextToken(this.selectedCounterId);
        if (calledToken) {
          speechService.announceToken(calledToken.id, this.selectedCounterId, `C-0${this.selectedCounterId}`);
        } else {
          alert('No more waiting tokens in this queue!');
        }
      });
    }

    const btnAnnounceHindi = document.getElementById('btn-announce-hindi');
    if (btnAnnounceHindi) {
      btnAnnounceHindi.addEventListener('click', () => {
        const counter = store.counters.find(c => c.id === this.selectedCounterId);
        if (counter && counter.servingToken && counter.servingToken !== 'None') {
          speechService.announceTokenInHindi(counter.servingToken, this.selectedCounterId);
        } else {
          alert('No token currently being served at this desk. Call next token first!');
        }
      });
    }

    const btnComplete = document.getElementById('btn-complete-service');
    if (btnComplete) {
      btnComplete.addEventListener('click', () => {
        const counter = store.counters.find(c => c.id === this.selectedCounterId);
        if (!counter) return;
        if (counter.servingToken === 'None' || !counter.servingToken) {
          alert('No token is currently being served at this counter.');
          return;
        }
        // Mark current SERVING token as COMPLETED in store.tokens[]
        const servingTok = store.tokens.find(t => t.counterId === this.selectedCounterId && t.status === 'SERVING');
        if (servingTok) {
          servingTok.status = 'COMPLETED';
          servingTok.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          servingTok.time = servingTok.completedAt;
        }
        // Reset counter state
        counter.servedCountToday = (counter.servedCountToday || 0) + 1;
        counter.servingToken = 'None';
        counter.status = 'idle';
        counter.servingCustomerDwellSec = 0;
        // Persist to MySQL
        fetch('/api/tokens/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ counterId: this.selectedCounterId })
        }).catch(() => {});
        store.notify('SERVICE_COMPLETED', counter);
        this.renderTier1();
      });
    }

    const btnPresence = document.getElementById('btn-toggle-presence');
    if (btnPresence) {
      btnPresence.addEventListener('click', () => {
        const counter = store.counters.find(c => c.id === this.selectedCounterId);
        if (counter) {
          counter.operatorPresent = !counter.operatorPresent;
          counter.idleDurationSec = 0;
          this.renderTier1();
        }
      });
    }

    const btnReassign = document.getElementById('btn-reassign-quick');
    if (btnReassign) {
      btnReassign.addEventListener('click', () => {
        store.rebalanceCounters(2, 'banking');
      });
    }
  }

  // =========================================================================
  // TIER 2: Sub-Division / Head Post Office (HPO) Aggregated Monitor
  // =========================================================================
  renderTier2() {
    this.container.innerHTML = `
      <div>
        <div class="card-header" style="margin-bottom: 20px;">
          <div>
            <h3 class="card-title" style="font-size: 1.25rem;">
              <span>🏢</span> Tier 2: Sub-Division & Head Post Office (HPO) Aggregated Monitor
            </h3>
            <p class="card-subtitle">Monitoring 14 Sub-Post Offices across New Delhi Central Sub-Division</p>
          </div>
          <span class="badge badge-green">Live Telemetry Synchronized</span>
        </div>

        <div class="grid-cols-4" style="margin-bottom: 24px;">
          <div class="kpi-card" style="--kpi-color: #3B82F6;">
            <div class="kpi-header">
              <span class="kpi-label">Sub-Offices Monitored</span>
              <div class="kpi-icon">🏢</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">14</span>
              <span class="kpi-unit">Offices</span>
            </div>
            <div class="kpi-trend trend-stable">100% Online Feeds</div>
          </div>

          <div class="kpi-card" style="--kpi-color: #10B981;">
            <div class="kpi-header">
              <span class="kpi-label">Avg Turnaround Time</span>
              <div class="kpi-icon">⏱️</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">5.4</span>
              <span class="kpi-unit">Minutes</span>
            </div>
            <div class="kpi-trend trend-down">↓ 1.2m vs yesterday</div>
          </div>

          <div class="kpi-card" style="--kpi-color: #F59E0B;">
            <div class="kpi-header">
              <span class="kpi-label">Active Serving Counters</span>
              <div class="kpi-icon">💻</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">48 / 52</span>
              <span class="kpi-unit">Manned</span>
            </div>
            <div class="kpi-trend trend-stable">92.3% Staffing</div>
          </div>

          <div class="kpi-card" style="--kpi-color: #D32F2F;">
            <div class="kpi-header">
              <span class="kpi-label">Citizens Served Today</span>
              <div class="kpi-icon">👥</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">3,842</span>
              <span class="kpi-unit">Tokens</span>
            </div>
            <div class="kpi-trend trend-down">94.8% SLA Target Met</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>📊</span> Sub-Post Office Performance & Congestion Matrix</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Post Office Name</th>
                  <th>Sub-Postmaster (SPM)</th>
                  <th>Total Counters</th>
                  <th>Avg TAT (Mins)</th>
                  <th>Current Waiting</th>
                  <th>SLA Compliance</th>
                  <th>Health Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Connaught Place HPO (110002)</strong></td>
                  <td>Smt. Sunita Goyal</td>
                  <td>12 Active</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">5.2 min</td>
                  <td>24 Citizens</td>
                  <td><span class="badge badge-green">94.2%</span></td>
                  <td><span class="badge badge-green">🟢 Optimal</span></td>
                </tr>
                <tr>
                  <td><strong>Barakhamba Road PO (110001)</strong></td>
                  <td>Shri P. C. Joshi</td>
                  <td>4 Active</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">3.8 min</td>
                  <td>5 Citizens</td>
                  <td><span class="badge badge-green">98.1%</span></td>
                  <td><span class="badge badge-green">🟢 Optimal</span></td>
                </tr>
                <tr>
                  <td><strong>Janpath PO (110001)</strong></td>
                  <td>Shri Anil Sharma</td>
                  <td>3 Active</td>
                  <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-danger);">9.4 min</td>
                  <td>19 Citizens</td>
                  <td><span class="badge badge-red">82.4%</span></td>
                  <td><span class="badge badge-red">🔴 High Congestion</span></td>
                </tr>
                <tr>
                  <td><strong>Pragati Maidan PO (110002)</strong></td>
                  <td>Smt. Rekha Rani</td>
                  <td>5 Active</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">4.6 min</td>
                  <td>8 Citizens</td>
                  <td><span class="badge badge-green">96.0%</span></td>
                  <td><span class="badge badge-green">🟢 Optimal</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TIER 3: Divisional Office (SSPO) Strategy & Allocation Command
  // =========================================================================
  renderTier3() {
    this.container.innerHTML = `
      <div>
        <div class="card-header" style="margin-bottom: 20px;">
          <div>
            <h3 class="card-title" style="font-size: 1.25rem;">
              <span>🎖️</span> Tier 3: Senior Superintendent of Post Offices (SSPO) Divisional Command
            </h3>
            <p class="card-subtitle">New Delhi Central Division • 3 HPOs, 48 SPOs, 184 Total Counters</p>
          </div>
          <span class="badge badge-red">SSPO Command Center</span>
        </div>

        <div class="grid-cols-3" style="margin-bottom: 24px;">
          <div class="card" style="border-left: 4px solid var(--post-red);">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Division SLA Compliance</h4>
            <div style="font-size: 2.2rem; font-weight: 900; color: var(--color-success); font-family: var(--font-mono);">
              95.6%
            </div>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
              Target: ≥ 90% within 7 minutes threshold
            </p>
          </div>

          <div class="card" style="border-left: 4px solid var(--post-gold);">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">AI Load Balance Triggers</h4>
            <div style="font-size: 2.2rem; font-weight: 900; color: var(--post-gold); font-family: var(--font-mono);">
              18 Events
            </div>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
              Proactively averted 42 queue bottlenecks today
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #3B82F6;">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Public CSAT Delight Score</h4>
            <div style="font-size: 2.2rem; font-weight: 900; color: #3B82F6; font-family: var(--font-mono);">
              4.7 / 5.0
            </div>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
              Based on 1,420 automated kiosk ratings
            </p>
          </div>
        </div>

        <div class="grid-cols-2">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><span>🤖</span> AI Resource Reallocation Recommendations</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.82rem;">
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--post-red);">
                <strong>Janpath PO:</strong> Redeploy 1 Postal Assistant from sorting to Aadhaar biometric update desk (Surge forecast between 14:00 - 16:00).
              </div>
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--color-success);">
                <strong>Parliament Street PO:</strong> Optimal counter distribution. No action required.
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><span>🛡️</span> Divisional Service Breakdown</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.84rem;">
              <div style="display: flex; justify-content: space-between;">
                <span>Speed Post & Mails</span>
                <strong>42% (8,420 items)</strong>
              </div>
              <div class="meter-track"><div class="meter-fill meter-green" style="width: 42%;"></div></div>

              <div style="display: flex; justify-content: space-between;">
                <span>POSB Savings & IPPB Banking</span>
                <strong>34% (6,810 transactions)</strong>
              </div>
              <div class="meter-track"><div class="meter-fill meter-amber" style="width: 34%;"></div></div>

              <div style="display: flex; justify-content: space-between;">
                <span>Aadhaar & Citizen Services</span>
                <strong>24% (4,820 services)</strong>
              </div>
              <div class="meter-track"><div class="meter-fill meter-green" style="width: 24%;"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TIER 4: Regional & Circle Directorate (CPMG) Performance & Macro Radar
  // =========================================================================
  renderTier4() {
    this.container.innerHTML = `
      <div>
        <div class="card-header" style="margin-bottom: 20px;">
          <div>
            <h3 class="card-title" style="font-size: 1.25rem;">
              <span>🇮🇳</span> Tier 4: Chief Postmaster General (CPMG) Circle Directorate Radar
            </h3>
            <p class="card-subtitle">Delhi Postal Circle • Macro Monitoring of 1,420 Counters Across 382 Post Offices</p>
          </div>
          <span class="badge badge-purple">National Dashboard Level</span>
        </div>

        <div class="grid-cols-4" style="margin-bottom: 24px;">
          <div class="kpi-card" style="--kpi-color: #D32F2F;">
            <div class="kpi-header">
              <span class="kpi-label">Total Daily Footfall</span>
              <div class="kpi-icon">🇮🇳</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">1,48,290</span>
              <span class="kpi-unit">Citizens</span>
            </div>
            <div class="kpi-trend trend-down">↑ 8.4% vs last week</div>
          </div>

          <div class="kpi-card" style="--kpi-color: #10B981;">
            <div class="kpi-header">
              <span class="kpi-label">Circle SLA Adherence</span>
              <div class="kpi-icon">📈</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">96.2%</span>
              <span class="kpi-unit">Compliant</span>
            </div>
            <div class="kpi-trend trend-down">Rank #2 in India</div>
          </div>

          <div class="kpi-card" style="--kpi-color: #F57C00;">
            <div class="kpi-header">
              <span class="kpi-label">Postal Revenue Recorded</span>
              <div class="kpi-icon">₹</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">₹ 4.82 Cr</span>
              <span class="kpi-unit">Today</span>
            </div>
            <div class="kpi-trend trend-down">↑ 12.1% MoM</div>
          </div>

          <div class="kpi-card" style="--kpi-color: #3B82F6;">
            <div class="kpi-header">
              <span class="kpi-label">AI CCTV Feeds Online</span>
              <div class="kpi-icon">📹</div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-value">1,392</span>
              <span class="kpi-unit">/ 1,420</span>
            </div>
            <div class="kpi-trend trend-stable">98.0% Edge Node Uptime</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>🏛️</span> Circle Division Benchmark Rankings</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Division Name</th>
                  <th>Superintendent (SSPO/SPO)</th>
                  <th>Active Counters</th>
                  <th>Daily Volume</th>
                  <th>Avg TAT</th>
                  <th>SLA Score</th>
                  <th>National Percentile</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>New Delhi Central Division</strong></td>
                  <td>Shri Rajesh Kumar, SSPO</td>
                  <td>184 Counters</td>
                  <td>38,400 Txns</td>
                  <td style="font-family: var(--font-mono);">4.9 mins</td>
                  <td><span class="badge badge-green">97.2%</span></td>
                  <td><strong style="color: var(--color-success);">99.4th</strong></td>
                </tr>
                <tr>
                  <td><strong>South Delhi Division</strong></td>
                  <td>Dr. Meenakshi Rao, SSPO</td>
                  <td>236 Counters</td>
                  <td>48,900 Txns</td>
                  <td style="font-family: var(--font-mono);">5.3 mins</td>
                  <td><span class="badge badge-green">95.8%</span></td>
                  <td><strong style="color: var(--color-success);">98.1th</strong></td>
                </tr>
                <tr>
                  <td><strong>East Delhi Division</strong></td>
                  <td>Shri A. K. Verma, SPO</td>
                  <td>198 Counters</td>
                  <td>34,200 Txns</td>
                  <td style="font-family: var(--font-mono);">5.8 mins</td>
                  <td><span class="badge badge-green">94.1%</span></td>
                  <td><strong style="color: var(--color-info);">95.6th</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  updateLiveElements() {
    if (store.currentTier === 'tier-1') {
      const grid = document.getElementById('display-tokens-grid');
      if (grid) {
        grid.innerHTML = store.counters.map(c => `
          <div class="display-token-cell ${c.status === 'serving' ? 'calling-now' : ''}">
            <div class="cell-counter-tag">${c.code}</div>
            <div class="cell-token-num">${c.servingToken}</div>
            <div class="cell-service-name">${c.service}</div>
          </div>
        `).join('');
      }
    }
  }
}
