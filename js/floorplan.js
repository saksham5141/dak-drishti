/**
 * DakDrishti 4.0 - Industry 4.0 Post Office Digital Twin & Floorplan
 * Real-time Architectural Visualizer with Dynamic Counter Rebalancing
 */

import { store } from './state.js';

export class DigitalTwinVisualizer {
  constructor(containerElement) {
    this.container = containerElement;
    this.init();
  }

  init() {
    this.render();
    store.subscribe(() => {
      this.updateCountersState();
      this.updateKpiCards();
    });
  }

  getKpiCards() {
    const totalQueue = store.counters.reduce((s, c) => s + c.queueCount, 0);
    const totalServed = store.counters.reduce((s, c) => s + c.servedCountToday, 0);
    const avgTatMins = (store.counters.reduce((s, c) => s + c.avgServiceTimeSec, 0) / store.counters.length / 60).toFixed(1);
    const slaOk = store.counters.filter(c => c.queueCount <= 6).length;
    const slaScore = ((slaOk / store.counters.length) * 100).toFixed(0);

    return `
      <div id="twin-kpi-row" class="grid-cols-4" style="margin-bottom: 20px;">
        <div class="kpi-card" style="--kpi-color: var(--post-red); --kpi-bg: rgba(211,47,47,0.1);">
          <div class="kpi-header">
            <span class="kpi-label">Total Queue Depth</span>
            <div class="kpi-icon" style="background: var(--kpi-bg); color: var(--kpi-color);">👥</div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value" id="kpi-total-queue">${totalQueue}</span>
            <span class="kpi-unit">Citizens</span>
          </div>
          <div class="kpi-trend ${totalQueue > 20 ? 'trend-up' : 'trend-stable'}">
            ${totalQueue > 20 ? '⚠️ High Load' : '✅ Normal Load'}
          </div>
        </div>

        <div class="kpi-card" style="--kpi-color: #10B981; --kpi-bg: rgba(16,185,129,0.1);">
          <div class="kpi-header">
            <span class="kpi-label">Tokens Served Today</span>
            <div class="kpi-icon" style="background: var(--kpi-bg); color: var(--kpi-color);">🎫</div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value" id="kpi-total-served">${totalServed}</span>
            <span class="kpi-unit">Tokens</span>
          </div>
          <div class="kpi-trend trend-down">↑ Active Shift Progress</div>
        </div>

        <div class="kpi-card" style="--kpi-color: #F59E0B; --kpi-bg: rgba(245,158,11,0.1);">
          <div class="kpi-header">
            <span class="kpi-label">Avg. Service Time</span>
            <div class="kpi-icon" style="background: var(--kpi-bg); color: var(--kpi-color);">⏱️</div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value" id="kpi-avg-tat">${avgTatMins}</span>
            <span class="kpi-unit">Minutes</span>
          </div>
          <div class="kpi-trend trend-stable">Target: &lt; 7.0 Mins</div>
        </div>

        <div class="kpi-card" style="--kpi-color: #8B5CF6; --kpi-bg: rgba(139,92,246,0.1);">
          <div class="kpi-header">
            <span class="kpi-label">SLA Compliance</span>
            <div class="kpi-icon" style="background: var(--kpi-bg); color: var(--kpi-color);">📊</div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value" id="kpi-sla-score">${slaScore}%</span>
            <span class="kpi-unit">Score</span>
          </div>
          <div class="kpi-trend ${parseInt(slaScore) >= 90 ? 'trend-down' : 'trend-up'}">
            ${slaOk}/${store.counters.length} Counters Within SLA
          </div>
        </div>
      </div>
    `;
  }

  updateKpiCards() {
    const totalQueue = store.counters.reduce((s, c) => s + c.queueCount, 0);
    const totalServed = store.counters.reduce((s, c) => s + c.servedCountToday, 0);
    const avgTatMins = (store.counters.reduce((s, c) => s + c.avgServiceTimeSec, 0) / store.counters.length / 60).toFixed(1);
    const slaOk = store.counters.filter(c => c.queueCount <= 6).length;
    const slaScore = ((slaOk / store.counters.length) * 100).toFixed(0);

    const el = (id) => document.getElementById(id);
    if (el('kpi-total-queue')) el('kpi-total-queue').innerText = totalQueue;
    if (el('kpi-total-served')) el('kpi-total-served').innerText = totalServed;
    if (el('kpi-avg-tat')) el('kpi-avg-tat').innerText = avgTatMins;
    if (el('kpi-sla-score')) el('kpi-sla-score').innerText = slaScore + '%';
  }

  render() {
    this.container.innerHTML = `
      <div class="twin-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 800;">
            <span style="color: var(--post-red);">🏛️</span> Post Office Floorplan Digital Twin (Industry 4.0)
          </h3>
          <p style="font-size: 0.78rem; color: var(--text-muted);">
            Real-time IoT & AI Vision Spatial Occupancy Mesh • Connaught Place HPO (110002)
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="btn-trigger-rebalance" class="btn btn-warning btn-sm">
            ⚡ 1-Click Auto Rebalancer
          </button>
          <span class="badge badge-green" style="font-family: var(--font-mono);">
            🟢 SENSORS ACTIVE (14 IoT NODES)
          </span>
        </div>
      </div>

      ${this.getKpiCards()}

      <div class="twin-stage">
        <!-- Top Backoffice Area (Sorting, Strong Room, SPM Cabin) -->
        <div style="display: grid; grid-template-columns: 240px 1fr 240px; gap: 16px;">
          <!-- Sorting & Parcel Bay -->
          <div class="zone-box" style="background: rgba(30, 41, 59, 0.04); border-top: 3px solid #64748B;">
            <div class="zone-header">
              <span>📦 Sorting & Parcel Bay</span>
              <span class="badge badge-blue">Bagging</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
              <div>• Dispatched Bags: <strong>42 Bags</strong></div>
              <div>• Registered Inbound: <strong>1,240 items</strong></div>
              <div>• Sorting Staff: <strong>3 Operators</strong></div>
            </div>
          </div>

          <!-- Staff Service Corridor & Security -->
          <div class="zone-box" style="display: flex; align-items: center; justify-content: space-around; background: rgba(30, 41, 59, 0.02);">
            <div style="text-align: center;">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">SECURE STAFF CORRIDOR</div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-success); margin-top: 2px;">
                🔒 Access Restricted • RFID Scanned
              </div>
            </div>
          </div>

          <!-- Postmaster SPM Cabin -->
          <div class="zone-box" style="border-top: 3px solid var(--post-red);">
            <div class="zone-header">
              <span>👔 Postmaster Cabin</span>
              <span class="badge badge-green">On Duty</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">
              <div>Postmaster: <strong>Smt. S. Goyal</strong></div>
              <div style="margin-top: 4px; color: var(--color-info);">● Monitoring Live Stream</div>
            </div>
          </div>
        </div>

        <!-- Middle Main Service Counter Pods -->
        <div class="floorplan-zones">
          <!-- Left: Self-Service Kiosks & Aadhaar Form Desk -->
          <div class="zone-box" style="border-left: 3px solid #8B5CF6;">
            <div class="zone-header">
              <span>📱 Self-Service Zone</span>
              <span class="badge badge-purple">Kiosks</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 6px;">
              <div style="background: var(--bg-surface); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div style="font-size: 0.75rem; font-weight: 700;">E-Token Dispenser Kiosk #1</div>
                <div style="font-size: 0.68rem; color: var(--color-success);">🟢 Active • 182 tokens issued</div>
              </div>
              <div style="background: var(--bg-surface); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div style="font-size: 0.75rem; font-weight: 700;">Postal Rate Calculator Screen</div>
                <div style="font-size: 0.68rem; color: var(--color-info);">ℹ️ Touch Kiosk Active</div>
              </div>
              <div style="background: var(--bg-surface); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div style="font-size: 0.75rem; font-weight: 700;">Aadhaar / POSB Form Table</div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">2 Citizens filling forms</div>
              </div>
            </div>
          </div>

          <!-- Center: 4 Counter Service Pods -->
          <div class="zone-box" style="border-top: 3px solid var(--post-gold);">
            <div class="zone-header">
              <span>🏛️ Live Counter Service Counters (1 to 4)</span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">CAM 01-04 ACTIVE</span>
            </div>
            <div id="twin-counter-pods" class="counter-pods-grid">
              <!-- Rendered Dynamically -->
            </div>
          </div>

          <!-- Right: Public Waiting Lobby & Display Screen -->
          <div class="zone-box" style="border-right: 3px solid #06B6D4;">
            <div class="zone-header">
              <span>🪑 Waiting Lobby</span>
              <span class="badge badge-blue">Capacity: 30</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">
              Seated Citizens: <strong>0 persons</strong><br/>
              Average Lobby Dwell: <strong>0.0 mins</strong>
            </div>
            <div class="avatar-cluster">
              <!-- Populated dynamically as citizens arrive -->
            </div>
            <div style="margin-top: 10px; padding: 6px; background: #0B192C; border-radius: 4px; color: #FFB74D; font-family: var(--font-mono); font-size: 0.7rem; text-align: center;">
              📺 DIGITAL DISPLAY BOARD: READY — AWAITING TOKENS
            </div>
          </div>
        </div>

        <!-- Bottom: Public Main Entrance & Security Door -->
        <div style="background: rgba(30, 41, 59, 0.04); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">🚪</span>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700;">MAIN PUBLIC ENTRANCE & RAMP ACCESS</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Divyangjan Accessible • Sanitizer Station • Thermal Scan</div>
            </div>
          </div>
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-success); font-family: var(--font-mono);">
            INFLOW: 0.0 CITIZENS / MIN
          </div>
        </div>
      </div>

      <!-- Rebalance Modal Container -->
      <div id="rebalance-modal-placeholder"></div>
    `;

    this.attachEvents();
    this.updateCountersState();
    this.updateKpiCards();
  }

  updateCountersState() {
    const grid = document.getElementById('twin-counter-pods');
    if (!grid) return;

    grid.innerHTML = store.counters.map(counter => {
      const isCongested = counter.queueCount >= 7;
      const isIdle = !counter.operatorPresent || counter.status === 'idle';
      const statusClass = isCongested ? 'status-congested' : isIdle ? 'status-idle' : 'status-serving';
      const statusLabel = isCongested ? 'CONGESTED' : isIdle ? 'UNATTENDED' : 'SERVING';
      const badgeColor = isCongested ? 'badge-red' : isIdle ? 'badge-amber' : 'badge-green';

      const dwellMins = Math.floor(counter.servingCustomerDwellSec / 60);
      const dwellSecs = counter.servingCustomerDwellSec % 60;

      return `
        <div class="counter-pod ${statusClass}" data-counter-id="${counter.id}">
          <div>
            <div class="pod-title">
              <span>${counter.code}</span>
              <span class="badge ${badgeColor}">${statusLabel}</span>
            </div>
            <div class="pod-service">${counter.service}</div>
          </div>

          <div style="margin: 10px 0; font-size: 0.75rem;">
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Serving Token:</span>
              <strong style="color: var(--post-red); font-family: var(--font-mono); font-size: 0.85rem;">
                ${counter.servingToken}
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-top: 2px;">
              <span>TAT Dwell:</span>
              <strong style="font-family: var(--font-mono);">${dwellMins}m ${dwellSecs}s</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-top: 2px;">
              <span>Operator:</span>
              <span>${counter.operatorName}</span>
            </div>
          </div>

          <div class="pod-queue-meter">
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 700;">
              <span>Queue: ${counter.queueCount} persons</span>
              <span>Target &lt; 5</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill ${isCongested ? 'meter-red' : counter.queueCount > 3 ? 'meter-amber' : 'meter-green'}" 
                   style="width: ${Math.min(100, counter.queueCount * 12)}%;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  attachEvents() {
    const rebalanceBtn = document.getElementById('btn-trigger-rebalance');
    if (rebalanceBtn) {
      rebalanceBtn.addEventListener('click', () => {
        this.openRebalanceModal();
      });
    }
  }

  openRebalanceModal() {
    const placeholder = document.getElementById('rebalance-modal-placeholder');
    if (!placeholder) return;

    placeholder.innerHTML = `
      <div class="modal-overlay active" id="rebalance-modal">
        <div class="modal-content" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--post-gold);">⚡</span> Industry 4.0 AI Dynamic Load Rebalancer
            </h3>
            <button id="close-modal-btn" class="control-btn">&times;</button>
          </div>

          <div class="alert-banner" style="margin-bottom: 16px;">
            <div>
              <strong>AI Recommendation Engine:</strong><br/>
              Detected heavy congestion at <strong>Counter 3 (POSB Banking: 9 in queue)</strong>. Suggest reallocating <strong>Counter 2 (Parcel)</strong> to accept Banking transactions as an auxiliary desk.
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
            <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-tertiary);">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                Option 1: Reassign Counter 2 to Banking Overflow (Recommended)
              </div>
              <p style="font-size: 0.76rem; color: var(--text-secondary);">
                Immediately routes 4 waiting POSB tokens to Counter 2. Estimated average wait time reduction: <strong>4.2 minutes (58%)</strong>.
              </p>
              <button id="btn-reassign-c2" class="btn btn-primary btn-sm" style="margin-top: 8px;">
                Execute 1-Click Reassignment
              </button>
            </div>

            <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-tertiary);">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                Option 2: Open Backup Auxiliary Counter 5
              </div>
              <p style="font-size: 0.76rem; color: var(--text-secondary);">
                Activates reserve counter with available floor supervisor. Requires 3 mins station setup.
              </p>
              <button id="btn-open-c5" class="btn btn-secondary btn-sm" style="margin-top: 8px;">
                Request Auxiliary Desk
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button id="cancel-modal-btn" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById('rebalance-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const reassignC2Btn = document.getElementById('btn-reassign-c2');
    const openC5Btn = document.getElementById('btn-open-c5');

    const closeModal = () => {
      if (modal) modal.remove();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    reassignC2Btn?.addEventListener('click', () => {
      store.rebalanceCounters(2, 'banking');
      closeModal();
    });

    openC5Btn?.addEventListener('click', () => {
      store.addAlert({
        severity: 'info',
        title: 'Auxiliary Counter 5 Requested',
        description: 'Duty supervisor notified to initiate Counter 5 station login.',
        counterId: null
      });
      closeModal();
    });
  }
}
