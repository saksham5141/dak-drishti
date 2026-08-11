/**
 * DakDrishti 4.0 - Main Application Coordinator & Entrypoint
 * Department of Posts, Ministry of Communications, Govt. of India
 */

import { store, HIERARCHY_DATA } from './state.js';
import { VisionIntelligenceEngine } from './vision.js';
import { DigitalTwinVisualizer } from './floorplan.js';
import { CitizenPortalManager } from './citizen.js';
import { DashboardHierarchyManager } from './dashboards.js';
import { AnalyticsReportManager } from './analytics.js';

class DakDrishtiApp {
  constructor() {
    this.activeSection = 'digital-twin'; // 'digital-twin' | 'vision-live' | 'citizen' | 'dashboards' | 'analytics'
    this.visionEngine = null;
    this.digitalTwin = null;
    this.citizenPortal = null;
    this.dashboards = null;
    this.analytics = null;
    this.simInterval = null;
  }

  init() {
    this.renderShell();
    this.initVisionEngine();
    this.renderSectionContent();
    this.attachGlobalEvents();
    this.startSimulationClock();
    this.listenToState();
  }

  renderShell() {
    const root = document.getElementById('app');
    if (!root) return;

    root.innerHTML = `
      <div class="app-container">
        <!-- Top App Bar -->
        <header class="top-header">
          <div class="brand-section">
            <div class="brand-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" fill="white"/>
              </svg>
            </div>
            <div class="brand-title">
              <h1>
                डाक सेवा दृष्टि <span style="font-weight: 400; font-size: 0.95rem; color: var(--text-secondary);">| DakDrishti</span>
                <span class="badge-i4">Industry 4.0 AI</span>
              </h1>
              <p>
                <span>Department of Posts</span> • <span>Ministry of Communications, Govt. of India</span>
              </p>
            </div>
          </div>

          <!-- Main Navigation Tabs -->
          <nav class="main-nav">
            <button class="nav-tab active" data-section="digital-twin">
              🏛️ Digital Twin & Floorplan
            </button>
            <button class="nav-tab" data-section="vision-live">
              📹 AI Vision & CCTV HUD
            </button>
            <button class="nav-tab" data-section="citizen">
              👥 Citizen Access & E-Tokens
            </button>
            <button class="nav-tab" data-section="dashboards">
              📊 Multi-Tier Hierarchy Command
            </button>
            <button class="nav-tab" data-section="analytics">
              📈 Predictive Analytics & Reports
            </button>
          </nav>

          <!-- Top Header Controls -->
          <div class="header-controls">
            <div id="mysql-status-badge" class="live-indicator" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #3B82F6;">
              <span id="mysql-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #3B82F6;"></span>
              <span id="mysql-status-text">MySQL DB Sync</span>
            </div>

            <div class="live-indicator">
              <div class="pulse-dot"></div>
              <span>EDGE AI ONLINE</span>
            </div>

            <button id="theme-toggle-btn" class="control-btn" title="Toggle Dark/Light Mode">
              🌓
            </button>
          </div>
        </header>

        <!-- Hierarchy Context Switcher Bar -->
        <div class="context-bar">
          <div class="context-location">
            <span style="font-size: 1.1rem;">📍</span>
            <div class="hierarchy-breadcrumb">
              <span>Delhi Circle</span> /
              <span>New Delhi Central Div</span> /
              <span class="active-node">Connaught Place HPO (110002)</span>
            </div>
          </div>

          <div class="tier-select-wrapper">
            <button id="btn-fresh-shift" class="btn btn-secondary btn-sm" style="border-color: var(--border-hover); font-weight: 700;">
              ✨ Start Fresh Shift (Reset)
            </button>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-left: 8px;">ADMIN TIER VIEW:</span>
            <select id="global-tier-select" class="tier-select">
              <option value="tier-1" ${store.currentTier === 'tier-1' ? 'selected' : ''}>Tier 1: Post Office / SPM Console</option>
              <option value="tier-2" ${store.currentTier === 'tier-2' ? 'selected' : ''}>Tier 2: Sub-Division / HPO Aggregated</option>
              <option value="tier-3" ${store.currentTier === 'tier-3' ? 'selected' : ''}>Tier 3: Divisional Office (SSPO Command)</option>
              <option value="tier-4" ${store.currentTier === 'tier-4' ? 'selected' : ''}>Tier 4: Regional / Circle Directorate (CPMG)</option>
            </select>
          </div>
        </div>

        <!-- Global Alert Ticker Banner -->
        <div style="padding: 10px 28px 0 28px;">
          <div id="global-alert-ticker" class="alert-banner info" style="margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>📢</span>
              <span id="ticker-text">
                <strong>Real-time Vision Status:</strong> 4 Service Counters online. Average turnaround time: <strong>5.2 mins</strong> (Target SLA &lt; 7.0 mins).
              </span>
            </div>
            <span class="badge badge-green" style="font-family: var(--font-mono);">SLA: 94.2%</span>
          </div>
        </div>

        <!-- Main Dynamic Body Area -->
        <main class="app-main" id="main-view-container">
          <!-- Rendered Dynamically -->
        </main>

        <!-- Footer -->
        <footer class="app-footer">
          <div>
            <strong>DakDrishti 4.0</strong> — Measurement & Monitoring of Counter Services Platform • Department of Posts
          </div>
          <div>
            Built with Industry 4.0 AI Edge Vision & Spatial Digital Twin Architecture
          </div>
        </footer>
      </div>
    `;
  }

  initVisionEngine() {
    // Hidden video and background canvas
    const hiddenVideo = document.createElement('video');
    hiddenVideo.playsInline = true;
    hiddenVideo.muted = true;
    hiddenVideo.className = 'cctv-video-hidden';
    document.body.appendChild(hiddenVideo);
  }

  renderSectionContent() {
    const main = document.getElementById('main-view-container');
    if (!main) return;

    if (this.activeSection === 'digital-twin') {
      main.innerHTML = `
        <div class="twin-container" id="twin-mount-point"></div>
      `;
      const mount = document.getElementById('twin-mount-point');
      this.digitalTwin = new DigitalTwinVisualizer(mount);
    } else if (this.activeSection === 'vision-live') {
      this.renderVisionLiveSection(main);
    } else if (this.activeSection === 'citizen') {
      main.innerHTML = `
        <div id="citizen-mount-point"></div>
      `;
      const mount = document.getElementById('citizen-mount-point');
      this.citizenPortal = new CitizenPortalManager(mount);
    } else if (this.activeSection === 'dashboards') {
      main.innerHTML = `
        <div id="dashboards-mount-point"></div>
      `;
      const mount = document.getElementById('dashboards-mount-point');
      this.dashboards = new DashboardHierarchyManager(mount);
    } else if (this.activeSection === 'analytics') {
      main.innerHTML = `
        <div id="analytics-mount-point"></div>
      `;
      const mount = document.getElementById('analytics-mount-point');
      this.analytics = new AnalyticsReportManager(mount);
    }
  }

  renderVisionLiveSection(main) {
    main.innerHTML = `
      <div>
        <div class="card-header" style="margin-bottom: 16px;">
          <div>
            <h3 class="card-title">
              <span style="color: var(--post-red);">📹</span> AI Vision & Multi-CCTV Counter Intelligence Hub
            </h3>
            <p class="card-subtitle">
              Live Edge Image Processing: Real-time Customer Detection, Queue Depth, Dwell Clocks & Anomaly Radar
            </p>
          </div>
          <span class="badge badge-green" style="font-family: var(--font-mono);">
            ● 30 FPS • YOLO/TF.js INFERENCE STREAM
          </span>
        </div>

        <div class="vision-container">
          <!-- Left: CCTV Screen & Controls -->
          <div>
            <div class="cctv-stage">
              <canvas id="vision-canvas" class="cctv-canvas"></canvas>
              
              <div class="cctv-overlay-ui">
                <div class="cctv-top-bar">
                  <div class="cctv-meta-tag">
                    <span class="cctv-rec-badge">
                      <span class="cctv-rec-dot"></span> REC
                    </span>
                    <span id="cctv-cam-tag">CAM 01 - SPEED POST</span>
                    <span id="cctv-live-clock">11:25:40</span>
                  </div>

                  <div class="cctv-meta-tag" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4);">
                    <span style="color: #34D399;">● AI OCCUPANCY: ACTIVE</span>
                  </div>
                </div>

                <div class="cctv-bottom-bar">
                  <div class="cctv-stats-pill">
                    <div class="cctv-stat-item">
                      <span>Queue Length</span>
                      <span id="hud-queue-count">6 Persons</span>
                    </div>
                    <div class="cctv-stat-item">
                      <span>Serving TAT</span>
                      <span id="hud-dwell-time">2m 25s</span>
                    </div>
                    <div class="cctv-stat-item">
                      <span>Operator</span>
                      <span id="hud-operator-status" style="color: #34D399;">Present</span>
                    </div>
                    <div class="cctv-stat-item">
                      <span>SLA Risk</span>
                      <span id="hud-sla-risk" style="color: #38BDF8;">Low (5.2m)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Camera Switcher & Vision Filter Toggles -->
            <div class="cctv-controls-strip">
              <div class="camera-selector-tabs">
                <button class="cam-tab active" data-cam="1">Cam 1: Speed Post</button>
                <button class="cam-tab" data-cam="2">Cam 2: Parcels</button>
                <button class="cam-tab" data-cam="3">Cam 3: Banking</button>
                <button class="cam-tab" data-cam="4">Cam 4: Citizen/Aadhaar</button>
                <button class="cam-tab" data-cam="webcam" style="border-color: var(--post-gold); color: var(--post-gold);">
                  📷 Live Webcam
                </button>
              </div>

              <div class="vision-toggles">
                <button id="toggle-bboxes-btn" class="toggle-chip active">
                  <span>🟩 AI Bounding Boxes</span>
                </button>
                <button id="toggle-heatmap-btn" class="toggle-chip">
                  <span>🔥 Density Heatmap</span>
                </button>
                <button id="toggle-queuezone-btn" class="toggle-chip active">
                  <span>📐 Queue ROI Zone</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right: AI Live Alerts & Real-time Anomaly Stream -->
          <div class="vision-sidebar-panel">
            <div class="card">
              <div class="card-header">
                <h4 class="card-title" style="font-size: 0.95rem;">
                  <span>🚨</span> Real-time AI Event Stream
                </h4>
                <span class="badge badge-red" id="active-alert-count">3 Alerts</span>
              </div>

              <div class="alert-feed-list" id="alert-feed-container">
                ${store.alerts.map(a => `
                  <div class="ai-alert-card ${a.severity}">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                        <strong style="font-size: 0.78rem; color: var(--text-primary);">${a.title}</strong>
                        <span class="alert-time">${a.timestamp}</span>
                      </div>
                      <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.4;">
                        ${a.description}
                      </p>
                      ${a.suggestedAction ? `
                        <div style="font-size: 0.68rem; color: var(--post-gold); font-weight: 600; margin-top: 4px;">
                          👉 ${a.suggestedAction}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.86rem; font-weight: 700; margin-bottom: 8px;">
                💡 Test AI Edge Alerts
              </h4>
              <p style="font-size: 0.74rem; color: var(--text-secondary); margin-bottom: 10px;">
                Trigger simulated anomalies to test automated SPM notifications:
              </p>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="btn btn-secondary btn-sm" id="btn-sim-rush">
                  ⚡ Simulate Sudden Queue Surge (+5 persons)
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-sim-unmanned">
                  ⚠️ Simulate Operator Leaving Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById('vision-canvas');
    const video = document.querySelector('.cctv-video-hidden');
    if (canvas && video) {
      if (this.visionEngine) this.visionEngine.stop();
      this.visionEngine = new VisionIntelligenceEngine(canvas, video);
      this.visionEngine.start();
    }

    this.attachVisionEvents();
  }

  attachVisionEvents() {
    // Camera Tabs
    document.querySelectorAll('.cam-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cam-tab').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const cam = e.currentTarget.getAttribute('data-cam');
        if (this.visionEngine) {
          this.visionEngine.setCamera(cam === 'webcam' ? 'webcam' : Number(cam));
          const tag = document.getElementById('cctv-cam-tag');
          if (tag) {
            const labels = {
              '1': 'CAM 01 - SPEED POST',
              '2': 'CAM 02 - PARCELS & COD',
              '3': 'CAM 03 - POSB BANKING',
              '4': 'CAM 04 - AADHAAR & CITIZEN',
              'webcam': 'LIVE WEBCAM STREAM'
            };
            tag.innerText = labels[cam] || 'CCTV STREAM';
          }
        }
      });
    });

    // Vision Toggles
    const btnBox = document.getElementById('toggle-bboxes-btn');
    if (btnBox) {
      btnBox.addEventListener('click', (e) => {
        const state = this.visionEngine.toggleBoundingBoxes();
        e.currentTarget.classList.toggle('active', state);
      });
    }

    const btnHeat = document.getElementById('toggle-heatmap-btn');
    if (btnHeat) {
      btnHeat.addEventListener('click', (e) => {
        const state = this.visionEngine.toggleHeatmap();
        e.currentTarget.classList.toggle('active', state);
      });
    }

    const btnZone = document.getElementById('toggle-queuezone-btn');
    if (btnZone) {
      btnZone.addEventListener('click', (e) => {
        const state = this.visionEngine.toggleQueueZone();
        e.currentTarget.classList.toggle('active', state);
      });
    }

    // Sim Surge
    const btnRush = document.getElementById('btn-sim-rush');
    if (btnRush) {
      btnRush.addEventListener('click', () => {
        const c3 = store.counters.find(c => c.id === 3);
        if (c3) {
          c3.queueCount += 5;
          store.addAlert({
            severity: 'high',
            title: '🚨 Extreme Queue Surge: Counter 3 (POSB Banking)',
            description: `Queue suddenly spiked to ${c3.queueCount} citizens. Average wait time predicted > 12 mins.`,
            counterId: 3,
            suggestedAction: 'Deploy 1 auxiliary counter operator immediately.'
          });
        }
      });
    }

    // Sim Unmanned
    const btnUnmanned = document.getElementById('btn-sim-unmanned');
    if (btnUnmanned) {
      btnUnmanned.addEventListener('click', () => {
        if (this.visionEngine) {
          this.visionEngine.toggleOperatorPresence(this.visionEngine.activeCamera === 'webcam' ? 1 : this.visionEngine.activeCamera);
        }
      });
    }
  }

  attachGlobalEvents() {
    // Fresh Shift Reset button
    const freshBtn = document.getElementById('btn-fresh-shift');
    if (freshBtn) {
      freshBtn.addEventListener('click', () => {
        if (confirm('Start a fresh post office shift? This will clear active queues and reset counters to ready.')) {
          store.resetShift();
          this.renderSectionContent();
        }
      });
    }

    // Robust Tab Navigation with Event Delegation
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
      mainNav.addEventListener('click', (e) => {
        const tab = e.target.closest('.nav-tab');
        if (!tab) return;
        document.querySelectorAll('.main-nav .nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeSection = tab.getAttribute('data-section');
        this.renderSectionContent();
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        store.toggleTheme();
      });
    }

    // Tier dropdown
    const tierSelect = document.getElementById('global-tier-select');
    if (tierSelect) {
      tierSelect.addEventListener('change', (e) => {
        store.setTier(e.target.value);
        if (this.activeSection !== 'dashboards') {
          // Switch to dashboards tab automatically
          this.activeSection = 'dashboards';
          document.querySelectorAll('.main-nav .nav-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-section') === 'dashboards');
          });
          this.renderSectionContent();
        } else if (this.dashboards) {
          this.dashboards.render();
        }
      });
    }
  }

  listenToState() {
    store.subscribe((event, data) => {
      if (event === 'HEALTH_UPDATED') {
        const badge = document.getElementById('mysql-status-badge');
        const dot = document.getElementById('mysql-status-dot');
        const text = document.getElementById('mysql-status-text');
        if (badge && text && dot) {
          if (data.mysql_connected) {
            badge.style.background = 'rgba(16, 185, 129, 0.12)';
            badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            badge.style.color = '#10B981';
            dot.style.background = '#10B981';
            text.innerText = `MySQL: ${data.db_name}`;
          } else {
            badge.style.background = 'rgba(245, 158, 11, 0.12)';
            badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            badge.style.color = '#F59E0B';
            dot.style.background = '#F59E0B';
            text.innerText = 'MySQL: Resilient Sync';
          }
        }
      } else if (event === 'ALERT_ADDED') {
        const feed = document.getElementById('alert-feed-container');
        const count = document.getElementById('active-alert-count');
        if (feed) {
          feed.innerHTML = store.alerts.map(a => `
            <div class="ai-alert-card ${a.severity}">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                  <strong style="font-size: 0.78rem; color: var(--text-primary);">${a.title}</strong>
                  <span class="alert-time">${a.timestamp}</span>
                </div>
                <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.4;">
                  ${a.description}
                </p>
                ${a.suggestedAction ? `
                  <div style="font-size: 0.68rem; color: var(--post-gold); font-weight: 600; margin-top: 4px;">
                    👉 ${a.suggestedAction}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('');
        }
        if (count) {
          count.innerText = `${store.alerts.length} Alerts`;
        }
      }
    });
  }

  startSimulationClock() {
    if (this.simInterval) clearInterval(this.simInterval);
    this.simInterval = setInterval(() => {
      store.tickSimulation();

      // Update live CCTV clocks if visible
      const clock = document.getElementById('cctv-live-clock');
      if (clock) {
        clock.innerText = new Date().toLocaleTimeString();
      }

      // Update HUD values
      const activeCamId = this.visionEngine ? (this.visionEngine.activeCamera === 'webcam' ? 1 : this.visionEngine.activeCamera) : 1;
      const counter = store.counters.find(c => c.id === activeCamId) || store.counters[0];

      const qEl = document.getElementById('hud-queue-count');
      const dEl = document.getElementById('hud-dwell-time');
      const oEl = document.getElementById('hud-operator-status');

      if (qEl) qEl.innerText = `${counter.queueCount} Persons`;
      if (dEl) {
        const mins = Math.floor(counter.servingCustomerDwellSec / 60);
        const secs = counter.servingCustomerDwellSec % 60;
        dEl.innerText = `${mins}m ${secs}s`;
      }
      if (oEl) {
        oEl.innerText = counter.operatorPresent ? 'Present' : 'Unattended';
        oEl.style.color = counter.operatorPresent ? '#34D399' : '#EF4444';
      }
    }, 1000);
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DakDrishtiApp();
  app.init();
});
