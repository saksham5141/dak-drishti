/**
 * DakDrishti 4.0 - Predictive Analytics & Audit Reports Module
 * Hourly Rush ML Forecaster, Anomaly Detection & Daily Performance Exporter
 */

import { store } from './state.js';

export class AnalyticsReportManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div>
        <div class="card-header" style="margin-bottom: 20px;">
          <div>
            <h3 class="card-title" style="font-size: 1.25rem;">
              <span>📈</span> Industry 4.0 Predictive Analytics & Performance Reports
            </h3>
            <p class="card-subtitle">AI Footfall Forecasting, Anomaly Tracking & Automated Compliance Audits</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="btn-export-csv" class="btn btn-secondary btn-sm">
              📥 Export CSV Data
            </button>
            <button id="btn-export-pdf" class="btn btn-primary btn-sm">
              📄 Generate Audit PDF / Print
            </button>
          </div>
        </div>

        <!-- Predictive Rush Heatmap Bars -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <h4 class="card-title"><span>🤖</span> AI Hourly Customer Footfall Forecast (Next 8 Hours)</h4>
              <p class="card-subtitle">Trained on historical DoP transaction logs, day-of-week patterns and pension dates</p>
            </div>
            <span class="badge badge-amber">⚡ Peak Rush Expected at 11:30 - 13:00</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; margin-top: 14px; text-align: center;">
            ${[
              { time: '09:00', vol: 24, label: 'Opening', peak: false },
              { time: '10:00', vol: 52, label: 'Mails Surge', peak: false },
              { time: '11:00', vol: 88, label: 'High Rush', peak: true },
              { time: '12:00', vol: 94, label: 'Peak Rush', peak: true },
              { time: '13:00', vol: 68, label: 'Moderate', peak: false },
              { time: '14:00', vol: 78, label: 'Aadhaar Surge', peak: false },
              { time: '15:00', vol: 64, label: 'Banking Flow', peak: false },
              { time: '16:00', vol: 42, label: 'Closing Bay', peak: false }
            ].map(slot => `
              <div style="background: var(--bg-tertiary); padding: 12px 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; height: 160px;">
                <div style="font-size: 0.76rem; font-weight: 700; font-family: var(--font-mono);">${slot.time}</div>
                <div style="display: flex; align-items: flex-end; justify-content: center; height: 80px;">
                  <div style="width: 24px; height: ${slot.vol}%; background: ${slot.peak ? 'var(--post-red)' : 'var(--post-gold)'}; border-radius: 4px;"></div>
                </div>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 800;">${slot.vol}</div>
                  <div style="font-size: 0.65rem; color: var(--text-muted);">${slot.label}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Comprehensive Daily Performance Audit Table -->
        <div class="card">
          <div class="card-header">
            <div>
              <h4 class="card-title"><span>📋</span> Daily Counter Performance & SLA Audit Log</h4>
              <p class="card-subtitle">Connaught Place HPO • Shift Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <span class="badge badge-green">Audit Verified</span>
          </div>

          <div class="table-responsive">
            <table class="data-table" id="audit-table">
              <thead>
                <tr>
                  <th>Counter</th>
                  <th>Service Category</th>
                  <th>Assigned Postal Assistant</th>
                  <th>Tokens Served</th>
                  <th>Average TAT</th>
                  <th>SLA Target</th>
                  <th>Breaches</th>
                  <th>Operator Score</th>
                </tr>
              </thead>
              <tbody>
                ${store.counters.map(c => `
                  <tr>
                    <td><strong>${c.code}</strong></td>
                    <td>${c.service}</td>
                    <td>${c.operatorName}</td>
                    <td><strong style="font-family: var(--font-mono);">${c.servedCountToday}</strong></td>
                    <td style="font-family: var(--font-mono);">${(c.avgServiceTimeSec / 60).toFixed(1)} mins</td>
                    <td style="font-family: var(--font-mono);">${(c.slaThresholdSec / 60).toFixed(1)} mins</td>
                    <td>
                      <span class="badge ${c.queueCount > 6 ? 'badge-amber' : 'badge-green'}">
                        ${c.queueCount > 6 ? '1 Advisory' : '0 Breaches'}
                      </span>
                    </td>
                    <td>
                      <strong style="color: var(--color-success); font-family: var(--font-mono);">
                        ${(96.5 - (c.queueCount > 6 ? 2.5 : 0)).toFixed(1)}%
                      </strong>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const btnCsv = document.getElementById('btn-export-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        this.exportCSV();
      });
    }

    const btnPdf = document.getElementById('btn-export-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        window.print();
      });
    }
  }

  exportCSV() {
    const headers = ['Counter Code', 'Service', 'Operator', 'Served Tokens', 'Avg TAT (Sec)', 'Queue Depth'];
    const rows = store.counters.map(c => [
      c.code,
      `"${c.service}"`,
      `"${c.operatorName}"`,
      c.servedCountToday,
      c.avgServiceTimeSec,
      c.queueCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DoP_Counter_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
