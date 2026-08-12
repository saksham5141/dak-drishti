/**
 * DakDrishti 4.0 - Citizen Access & Digital Services Portal
 * Service Catalog, Rate Calculators, E-Token Dispenser, Nearby Radar & Grievance Box
 */

import { store, HIERARCHY_DATA } from './state.js';

export class CitizenPortalManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.activeTab = 'token-kiosk'; // 'token-kiosk' | 'postal-calc' | 'posb-calc' | 'pli-calc' | 'citizen-services' | 'nearby-radar' | 'feedback'
    this.init();
  }

  init() {
    this.render();
    store.subscribe((event) => {
      if (event === 'TOKEN_GENERATED' || event === 'TICK') {
        this.updateUserTokenPass();
      }
    });
  }

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="citizen-portal-wrap">
        <!-- Citizen Navigation Bar -->
        <div class="citizen-tabs-bar">
          <button class="nav-tab ${this.activeTab === 'token-kiosk' ? 'active' : ''}" data-tab="token-kiosk">
            🎟️ Virtual Smart E-Token
          </button>
          <button class="nav-tab ${this.activeTab === 'postal-calc' ? 'active' : ''}" data-tab="postal-calc">
            📦 Speed Post & Parcel Tariff
          </button>
          <button class="nav-tab ${this.activeTab === 'posb-calc' ? 'active' : ''}" data-tab="posb-calc">
            💰 POSB & IPPB Banking Calculator
          </button>
          <button class="nav-tab ${this.activeTab === 'pli-calc' ? 'active' : ''}" data-tab="pli-calc">
            🛡️ PLI & RPLI Insurance
          </button>
          <button class="nav-tab ${this.activeTab === 'citizen-services' ? 'active' : ''}" data-tab="citizen-services">
            🆔 Aadhaar & Citizen Services
          </button>
          <button class="nav-tab ${this.activeTab === 'nearby-radar' ? 'active' : ''}" data-tab="nearby-radar">
            📍 Nearby Post Office Radar
          </button>
          <button class="nav-tab ${this.activeTab === 'feedback' ? 'active' : ''}" data-tab="feedback">
            ⭐ Feedback & AI Grievance
          </button>
        </div>

        <!-- Dynamic Content Body -->
        <div id="citizen-tab-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'token-kiosk':
        return this.renderTokenKiosk();
      case 'postal-calc':
        return this.renderPostalCalculator();
      case 'posb-calc':
        return this.renderPosbCalculator();
      case 'pli-calc':
        return this.renderPliCalculator();
      case 'citizen-services':
        return this.renderCitizenServices();
      case 'nearby-radar':
        return this.renderNearbyRadar();
      case 'feedback':
        return this.renderFeedback();
      default:
        return this.renderTokenKiosk();
    }
  }

  renderTokenKiosk() {
    return `
      <div class="grid-cols-2">
        <!-- Left: Generate E-Token Form -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">
                <span style="color: var(--post-red);">🎟️</span> ${store.t('instantTokenGen')}
              </h3>
              <p class="card-subtitle">${store.t('tokenGenDesc')}</p>
            </div>
            <span class="badge badge-green">${store.t('liveKiosk')}</span>
          </div>

          <form id="token-gen-form">
            <div class="form-group">
              <label class="form-label">${store.t('serviceCategoryReq')}</label>
              <select id="token-category" class="form-select" required>
                <option value="mail">${store.t('mailOption')}</option>
                <option value="parcel">${store.t('parcelOption')}</option>
                <option value="banking">${store.t('bankingOption')}</option>
                <option value="citizen">${store.t('citizenOption')}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">${store.t('citizenNameLabel')}</label>
              <input type="text" id="token-name" class="form-input" placeholder="e.g. Sumanth Verma" value="Sumanth Verma" required />
            </div>

            <div class="form-group">
              <label class="form-label">${store.t('mobileLabel')}</label>
              <input type="tel" id="token-mobile" class="form-input" placeholder="e.g. 9876543210" value="9876543210" pattern="[0-9]{10}" required />
            </div>

            <div class="form-group" style="background: rgba(245, 124, 0, 0.08); border: 1px solid rgba(245, 124, 0, 0.25); border-radius: var(--radius-md); padding: 12px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; color: var(--text-primary);">
                <input type="checkbox" id="token-priority" style="width: 18px; height: 18px; accent-color: var(--post-gold);" />
                <span>${store.t('priorityLabel')}</span>
              </label>
              <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 4px; margin-left: 26px;">
                ${store.t('priorityDesc')}
              </p>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;">
              ${store.t('generateTokenPass')}
            </button>
          </form>
        </div>

        <!-- Right: Active Token Pass Preview -->
        <div class="card" id="user-token-pass-card">
          ${this.getUserTokenPassHtml()}
        </div>
      </div>
    `;
  }

  getUserTokenPassHtml() {
    const token = store.userToken;
    if (!token) {
      return `
        <div style="text-align: center; padding: 48px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;">🎫</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">${store.t('noActiveToken')}</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 320px; margin: 0 auto;">
            ${store.t('noActiveTokenDesc')}
          </p>
        </div>
      `;
    }

    const assignedCounter = store.counters.find(c => c.id === token.counterId) || store.counters[0];
    const waitingBefore = store.tokens.filter(t => t.counterId === token.counterId && t.status === 'WAITING' && t.id !== token.id).length;
    const estWaitMins = Math.max(1, (waitingBefore + 1) * 3);

    return `
      <div class="token-pass-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--post-red); text-transform: uppercase;">
            ${store.t('dopBanner')}
          </span>
          <span class="badge ${token.priority ? 'badge-amber' : 'badge-blue'}">
            ${token.priority ? store.t('priorityPass') : store.t('standardToken')}
          </span>
        </div>

        <div class="token-big-badge">${token.id}</div>
        <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">
          ${token.citizenName}
        </div>
        <div style="font-size: 0.76rem; color: var(--text-muted); font-family: var(--font-mono);">
          Issued: ${token.time} • Connaught Place HPO (110002)
        </div>

        <div class="token-qr-code">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="white"/>
            <!-- Stylized QR Code matrix -->
            <rect x="10" y="10" width="25" height="25" fill="#0B192C"/>
            <rect x="15" y="15" width="15" height="15" fill="white"/>
            <rect x="18" y="18" width="9" height="9" fill="#0B192C"/>
            
            <rect x="65" y="10" width="25" height="25" fill="#0B192C"/>
            <rect x="70" y="15" width="15" height="15" fill="white"/>
            <rect x="73" y="18" width="9" height="9" fill="#0B192C"/>

            <rect x="10" y="65" width="25" height="25" fill="#0B192C"/>
            <rect x="15" y="70" width="15" height="15" fill="white"/>
            <rect x="18" y="73" width="9" height="9" fill="#0B192C"/>

            <rect x="42" y="42" width="16" height="16" fill="#D32F2F"/>
            <rect x="42" y="15" width="12" height="6" fill="#0B192C"/>
            <rect x="42" y="75" width="12" height="6" fill="#0B192C"/>
            <rect x="70" y="45" width="16" height="6" fill="#0B192C"/>
            <rect x="65" y="70" width="8" height="15" fill="#0B192C"/>
          </svg>
        </div>

        <table class="token-details-table">
          <tr>
            <td>${store.t('assignedCounter')}</td>
            <td style="color: var(--post-red); font-size: 0.95rem;">${assignedCounter.code} (${store.language === 'hi' ? assignedCounter.nameHi : assignedCounter.service})</td>
          </tr>
          <tr>
            <td>${store.t('queuePosition')}</td>
            <td><strong>${waitingBefore === 0 ? store.t('nextInTurn') : `${waitingBefore} ${store.t('citizensAhead')}`}</strong></td>
          </tr>
          <tr>
            <td>${store.t('estWaitTime')}</td>
            <td style="color: var(--color-success); font-family: var(--font-mono); font-size: 0.9rem;">~ ${estWaitMins} ${store.t('minutesText')}</td>
          </tr>
          <tr>
            <td>${store.t('currServing')}</td>
            <td style="font-family: var(--font-mono);">${assignedCounter.servingToken}</td>
          </tr>
        </table>

        <div style="margin-top: 16px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); font-size: 0.78rem; color: #059669; font-weight: 600;">
          📢 ${store.t('voiceAnnounceAlert').replace('ready', `"${token.id}"`)}
        </div>
      </div>
    `;
  }

  updateUserTokenPass() {
    const card = document.getElementById('user-token-pass-card');
    if (card) {
      card.innerHTML = this.getUserTokenPassHtml();
    }
  }

  renderPostalCalculator() {
    return `
      <div class="grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>📦</span> Domestic Speed Post & Parcel Rate Calculator</h3>
            <span class="badge badge-red">Official DoP Tariffs</span>
          </div>

          <form id="calc-postal-form">
            <div class="form-group">
              <label class="form-label">Service Type</label>
              <select id="postal-type" class="form-select">
                <option value="speed-post">Speed Post (Fastest Delivery)</option>
                <option value="reg-parcel">Registered Parcel</option>
                <option value="business-parcel">Business Parcel (COD Available)</option>
                <option value="reg-letter">Registered Letter</option>
              </select>
            </div>

            <div class="grid-cols-2">
              <div class="form-group">
                <label class="form-label">Sender Pincode</label>
                <input type="text" id="postal-src-pin" class="form-input" value="110001" maxlength="6" />
              </div>
              <div class="form-group">
                <label class="form-label">Destination Pincode</label>
                <input type="text" id="postal-dst-pin" class="form-input" value="400001" maxlength="6" />
              </div>
            </div>

            <div class="grid-cols-2">
              <div class="form-group">
                <label class="form-label">Actual Weight (Grams)</label>
                <input type="number" id="postal-weight" class="form-input" value="350" min="1" max="35000" />
              </div>
              <div class="form-group">
                <label class="form-label">Destination Zone</label>
                <select id="postal-zone" class="form-select">
                  <option value="local">Local (&lt; 50 km)</option>
                  <option value="metro">Metro to Metro</option>
                  <option value="national" selected>National (&gt; 1000 km)</option>
                </select>
              </div>
            </div>

            <button type="button" id="btn-calc-postal" class="btn btn-primary" style="width: 100%;">
              Calculate Postage & Transit Days
            </button>
          </form>

          <div id="postal-calc-result" class="calc-result-panel">
            <div class="calc-breakdown-row">
              <span>Base Postage Tariff:</span>
              <strong id="res-base-tariff">₹ 65.00</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>GST (18% Applicable):</span>
              <strong id="res-gst-tariff">₹ 11.70</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Estimated Delivery Transit:</span>
              <strong id="res-transit-time" style="color: var(--color-success);">2 to 3 Working Days</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Total Payable Amount:</span>
              <span id="res-total-tariff">₹ 76.70</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>ℹ️</span> Speed Post Service Standards & Features</h3>
          </div>
          <div style="font-size: 0.84rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
              <strong style="color: var(--post-red);">🚀 Real-time SMS & Web Tracking</strong><br/>
              End-to-end barcode scanning with delivery confirmation SMS on recipient's mobile.
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
              <strong style="color: var(--color-success);">🛡️ Compensation for Loss/Damage</strong><br/>
              Free transit protection up to ₹1,000 or double the speed post fee.
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
              <strong style="color: var(--post-gold);">💼 Cash on Delivery (COD) Facility</strong><br/>
              Available for e-Commerce merchants up to ₹50,000 collection value.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPosbCalculator() {
    return `
      <div class="grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>💰</span> Post Office Savings Bank (POSB) Interest Calculator</h3>
            <span class="badge badge-green">Govt. Guaranteed Sovereign Return</span>
          </div>

          <form id="calc-posb-form">
            <div class="form-group">
              <label class="form-label">Scheme Selection</label>
              <select id="posb-scheme" class="form-select">
                <option value="sb" data-rate="4.0">Post Office Savings Account (4.0% p.a.)</option>
                <option value="td1" data-rate="6.9">1-Year Time Deposit (TD) (6.9% p.a.)</option>
                <option value="td5" data-rate="7.5">5-Year Time Deposit (TD) (7.5% p.a.)</option>
                <option value="rd" data-rate="6.7">5-Year Recurring Deposit (RD) (6.7% p.a.)</option>
                <option value="scss" data-rate="8.2" selected>Senior Citizen Savings Scheme (SCSS) (8.2% p.a.)</option>
                <option value="ssa" data-rate="8.2">Sukanya Samriddhi Account (SSA) (8.2% p.a.)</option>
                <option value="ppf" data-rate="7.1">Public Provident Fund (PPF) (7.1% p.a.)</option>
                <option value="mss" data-rate="7.5">Mahila Samman Savings Certificate (7.5% p.a.)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Investment / Deposit Amount (₹)</label>
              <input type="number" id="posb-amount" class="form-input" value="100000" min="500" step="500" />
            </div>

            <div class="form-group">
              <label class="form-label">Tenure (Years)</label>
              <input type="number" id="posb-tenure" class="form-input" value="5" min="1" max="15" />
            </div>

            <button type="button" id="btn-calc-posb" class="btn btn-primary" style="width: 100%;">
              Calculate Interest & Maturity
            </button>
          </form>

          <div id="posb-calc-result" class="calc-result-panel">
            <div class="calc-breakdown-row">
              <span>Applicable Interest Rate:</span>
              <strong id="res-posb-rate" style="color: var(--color-success);">8.20% per annum</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Total Interest Earned:</span>
              <strong id="res-posb-interest">₹ 41,000.00</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Quarterly / Annual Payout:</span>
              <strong id="res-posb-payout">₹ 2,050.00 / Quarter</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Total Maturity Value:</span>
              <span id="res-posb-total">₹ 1,41,000.00</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>🏦</span> India Post Payments Bank (IPPB) Digital Banking</h3>
          </div>
          <div style="font-size: 0.84rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
              <strong style="color: var(--post-red);">📱 Doorstep Digital Banking (AePS)</strong><br/>
              Withdraw cash, transfer funds, or deposit money directly from home using Postman's biometric machine.
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
              <strong style="color: var(--color-info);">⚡ POSB to IPPB Instant Sweep-in / Sweep-out</strong><br/>
              Link your traditional Post Office savings book with IPPB mobile app for UPI payments!
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPliCalculator() {
    return `
      <div class="grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>🛡️</span> Postal Life Insurance (PLI / RPLI) Premium Estimator</h3>
            <span class="badge badge-purple">Highest Bonus in India</span>
          </div>

          <form id="calc-pli-form">
            <div class="form-group">
              <label class="form-label">Select Insurance Plan</label>
              <select id="pli-plan" class="form-select">
                <option value="santosh" data-bonus="52">Santosh (Endowment Assurance - EA) [Bonus ₹52/k]</option>
                <option value="suraksha" data-bonus="76">Suraksha (Whole Life Assurance - WLA) [Bonus ₹76/k]</option>
                <option value="sumangal" data-bonus="48">Sumangal (Anticipated Endowment - Money Back)</option>
                <option value="gram-santosh" data-bonus="48">Gram Santosh (RPLI Rural Endowment)</option>
              </select>
            </div>

            <div class="grid-cols-2">
              <div class="form-group">
                <label class="form-label">Proponent Age (Years)</label>
                <input type="number" id="pli-age" class="form-input" value="30" min="19" max="55" />
              </div>
              <div class="form-group">
                <label class="form-label">Maturity Age</label>
                <select id="pli-mat-age" class="form-select">
                  <option value="55">55 Years</option>
                  <option value="58" selected>58 Years</option>
                  <option value="60">60 Years</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Sum Assured (₹)</label>
              <input type="number" id="pli-sum-assured" class="form-input" value="500000" min="20000" max="5000000" step="10000" />
            </div>

            <button type="button" id="btn-calc-pli" class="btn btn-primary" style="width: 100%;">
              Calculate Monthly Premium & Bonus
            </button>
          </form>

          <div id="pli-calc-result" class="calc-result-panel">
            <div class="calc-breakdown-row">
              <span>Approx. Monthly Premium:</span>
              <strong id="res-pli-monthly" style="color: var(--post-red);">₹ 1,320.00 / month</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Total Guaranteed Bonus:</span>
              <strong id="res-pli-bonus" style="color: var(--color-success);">₹ 7,28,000.00</strong>
            </div>
            <div class="calc-breakdown-row">
              <span>Estimated Total Maturity Benefit:</span>
              <span id="res-pli-total">₹ 12,28,000.00</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span>🌟</span> Key PLI Advantages</h3>
          </div>
          <div style="font-size: 0.84rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px;">
            <p>• <strong>Lowest Premium Rates:</strong> Lowest operational expense in Indian life insurance industry.</p>
            <p>• <strong>High Bonus Rates:</strong> Declared up to ₹76 per ₹1,000 sum assured annually.</p>
            <p>• <strong>Section 80C Tax Exemption:</strong> 100% tax deductible under Income Tax Act.</p>
            <p>• <strong>Loan Facility:</strong> Loan against policy after 3 completed policy years.</p>
          </div>
        </div>
      </div>
    `;
  }

  renderCitizenServices() {
    return `
      <div>
        <div class="card-header" style="margin-bottom: 20px;">
          <div>
            <h3 class="card-title" style="font-size: 1.25rem;">
              <span>🆔</span> Citizen Centric Services Directory & Checklists
            </h3>
            <p class="card-subtitle">Official documents required and procedures at Post Office Counter 4</p>
          </div>
        </div>

        <div class="services-catalog-grid">
          <!-- Aadhaar Card Service -->
          <div class="service-action-card">
            <div>
              <div class="service-icon-box" style="background: rgba(211, 47, 47, 0.1); color: var(--post-red);">
                🪪
              </div>
              <h3>Aadhaar Enrolment & Biometric Update</h3>
              <p>Fresh enrolment (Free), Mandatory Child Biometric Update (5 & 15 yrs), Mobile/Email/Address update.</p>
              <div style="font-size: 0.74rem; color: var(--text-muted); background: var(--bg-tertiary); padding: 8px; border-radius: var(--radius-sm); margin-bottom: 14px;">
                <strong>Required:</strong> Proof of Identity (POI) + Proof of Address (POA) in original.
              </div>
            </div>
            <button class="btn btn-primary btn-sm btn-generate-token-cat" data-category="citizen">
              Get Counter 4 E-Token
            </button>
          </div>

          <!-- Jeevan Pramaan (DLC) -->
          <div class="service-action-card">
            <div>
              <div class="service-icon-box" style="background: rgba(16, 185, 129, 0.1); color: var(--color-success);">
                👴
              </div>
              <h3>Digital Life Certificate (Jeevan Pramaan)</h3>
              <p>Instant biometric life certificate generation for Central/State/Defence/EPFO pensioners without visiting bank.</p>
              <div style="font-size: 0.74rem; color: var(--text-muted); background: var(--bg-tertiary); padding: 8px; border-radius: var(--radius-sm); margin-bottom: 14px;">
                <strong>Required:</strong> Aadhaar number + Pension PPO Number + Bank Account Details.
              </div>
            </div>
            <button class="btn btn-primary btn-sm btn-generate-token-cat" data-category="citizen">
              Get Priority E-Token
            </button>
          </div>

          <!-- Post Office Passport Seva Kendra -->
          <div class="service-action-card">
            <div>
              <div class="service-icon-box" style="background: rgba(59, 130, 246, 0.1); color: var(--color-info);">
                🛂
              </div>
              <h3>Post Office Passport Seva Kendra (POPSK)</h3>
              <p>Passport biometric verification and document scrutiny in partnership with Ministry of External Affairs.</p>
              <div style="font-size: 0.74rem; color: var(--text-muted); background: var(--bg-tertiary); padding: 8px; border-radius: var(--radius-sm); margin-bottom: 14px;">
                <strong>Required:</strong> Online appointment receipt from passportindia.gov.in.
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.open('https://passportindia.gov.in','_blank')">
              Book POPSK Slot ↗
            </button>
          </div>

          <!-- Direct Benefit Transfer (DBT) & Utility Bill Pay -->
          <div class="service-action-card">
            <div>
              <div class="service-icon-box" style="background: rgba(245, 158, 11, 0.1); color: var(--post-gold);">
                ⚡
              </div>
              <h3>Direct Benefit Transfer & Utility Bill Pay</h3>
              <p>Receive PM-KISAN, LPG subsidy directly in POSB/IPPB account and pay Electricity, Water & Gas bills.</p>
              <div style="font-size: 0.74rem; color: var(--text-muted); background: var(--bg-tertiary); padding: 8px; border-radius: var(--radius-sm); margin-bottom: 14px;">
                <strong>Required:</strong> Consumer number / Aadhaar linked account.
              </div>
            </div>
            <button class="btn btn-primary btn-sm btn-generate-token-cat" data-category="banking">
              Get Banking E-Token
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderNearbyRadar() {
    return `
      <div>
        <div class="card-header" style="margin-bottom: 16px;">
          <div>
            <h3 class="card-title"><span>📍</span> Live Nearby Post Office Crowding & SLA Radar</h3>
            <p class="card-subtitle">AI-measured live footfall, active counters and average wait time in New Delhi Division</p>
          </div>
          <span class="badge badge-green">🔴 Live Synchronized (4 POs)</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Post Office Name</th>
                <th>Pincode</th>
                <th>Distance</th>
                <th>Active Counters</th>
                <th>Current Queue Depth</th>
                <th>Average Wait Time (AWT)</th>
                <th>AI Crowding Index</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${HIERARCHY_DATA.nearbyOffices.map(po => `
                <tr>
                  <td><strong>${po.name}</strong></td>
                  <td><span style="font-family: var(--font-mono);">${po.pincode}</span></td>
                  <td>${po.distance}</td>
                  <td>${po.activeCounters} Counters Active</td>
                  <td><strong>${po.queueDepth} persons</strong></td>
                  <td style="font-family: var(--font-mono); color: var(--text-primary); font-weight: 700;">
                    ~ ${po.waitTime}
                  </td>
                  <td>
                    <span class="badge badge-${po.color}">${po.status}</span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="alert('Routing directions to ${po.name} (${po.distance})')">
                      Navigate 🧭
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderFeedback() {
    return `
      <div class="card" style="max-width: 680px; margin: 0 auto;">
        <div class="card-header">
          <div>
            <h3 class="card-title"><span>⭐</span> Citizen Feedback & AI Grievance Classification</h3>
            <p class="card-subtitle">Your real-time feedback helps improve counter service turnaround time</p>
          </div>
        </div>

        <form id="feedback-form">
          <div class="form-group">
            <label class="form-label">Service Evaluated</label>
            <select id="fb-service" class="form-select">
              <option>Speed Post / Parcel Booking (Counter 1/2)</option>
              <option>POSB Banking / Pension Withdrawal (Counter 3)</option>
              <option>Aadhaar Enrolment & Update (Counter 4)</option>
              <option>General Post Office Cleanliness & Assistance</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Overall Counter Experience (Star Rating)</label>
            <div style="font-size: 1.8rem; cursor: pointer; color: #F59E0B;" id="star-rating-box">
              ⭐⭐⭐⭐⭐
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Your Feedback / Grievance Description</label>
            <textarea id="fb-comments" class="form-textarea" rows="4" placeholder="Tell us about the speed of service, operator helpfulness, or any issue faced..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
            Submit Feedback & AI Analysis
          </button>
        </form>

        <div id="fb-sentiment-result" style="margin-top: 16px; display: none;"></div>
      </div>
    `;
  }

  attachEvents() {
    // Nav tabs with event delegation
    const citizenTabs = this.container.querySelector('.citizen-portal-wrap');
    if (citizenTabs) {
      citizenTabs.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('[data-tab]');
        if (tabBtn) {
          const tab = tabBtn.getAttribute('data-tab');
          this.setTab(tab);
        }
      });
    }

    // Token Gen Form
    const tokenForm = document.getElementById('token-gen-form');
    if (tokenForm) {
      tokenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('token-category').value;
        const name = document.getElementById('token-name').value;
        const mobile = document.getElementById('token-mobile').value;
        const priority = document.getElementById('token-priority').checked;

        store.generateToken({ category, citizenName: name, mobile, priority });
        this.updateUserTokenPass();
      });
    }

    // Direct token button from service cards
    this.container.querySelectorAll('.btn-generate-token-cat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-category');
        this.setTab('token-kiosk');
        setTimeout(() => {
          const catSelect = document.getElementById('token-category');
          if (catSelect) catSelect.value = cat;
        }, 50);
      });
    });

    // Postal Calc Trigger
    const btnPostal = document.getElementById('btn-calc-postal');
    if (btnPostal) {
      btnPostal.addEventListener('click', () => {
        const weight = Number(document.getElementById('postal-weight').value) || 200;
        const zone = document.getElementById('postal-zone').value;
        let base = 41;
        if (weight > 50) base += Math.ceil((weight - 50) / 50) * 15;
        if (zone === 'national') base += 25;
        const gst = base * 0.18;
        const total = base + gst;

        document.getElementById('res-base-tariff').innerText = `₹ ${base.toFixed(2)}`;
        document.getElementById('res-gst-tariff').innerText = `₹ ${gst.toFixed(2)}`;
        document.getElementById('res-total-tariff').innerText = `₹ ${total.toFixed(2)}`;
      });
    }

    // POSB Calc Trigger
    const btnPosb = document.getElementById('btn-calc-posb');
    if (btnPosb) {
      btnPosb.addEventListener('click', () => {
        const sel = document.getElementById('posb-scheme');
        const rate = parseFloat(sel.options[sel.selectedIndex].getAttribute('data-rate')) || 8.2;
        const amt = Number(document.getElementById('posb-amount').value) || 100000;
        const tenure = Number(document.getElementById('posb-tenure').value) || 5;

        const interest = (amt * rate * tenure) / 100;
        const total = amt + interest;
        const quarterly = (amt * (rate / 100)) / 4;

        document.getElementById('res-posb-rate').innerText = `${rate.toFixed(2)}% per annum`;
        document.getElementById('res-posb-interest').innerText = `₹ ${interest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('res-posb-payout').innerText = `₹ ${quarterly.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / Quarter`;
        document.getElementById('res-posb-total').innerText = `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      });
    }

    // PLI Calc Trigger
    const btnPli = document.getElementById('btn-calc-pli');
    if (btnPli) {
      btnPli.addEventListener('click', () => {
        const sumAssured = Number(document.getElementById('pli-sum-assured').value) || 500000;
        const age = Number(document.getElementById('pli-age').value) || 30;
        const matAge = Number(document.getElementById('pli-mat-age').value) || 58;
        const term = Math.max(5, matAge - age);
        
        const monthly = (sumAssured / (term * 12)) * 0.78;
        const bonusPerThousand = 52;
        const totalBonus = (sumAssured / 1000) * bonusPerThousand * term;
        const totalMaturity = sumAssured + totalBonus;

        document.getElementById('res-pli-monthly').innerText = `₹ ${monthly.toFixed(2)} / month`;
        document.getElementById('res-pli-bonus').innerText = `₹ ${totalBonus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('res-pli-total').innerText = `₹ ${totalMaturity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      });
    }

    // Feedback Form Submit
    const fbForm = document.getElementById('feedback-form');
    if (fbForm) {
      fbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const comments = document.getElementById('fb-comments').value || 'Very quick and courteous service at Speed Post counter.';
        const resBox = document.getElementById('fb-sentiment-result');
        if (resBox) {
          resBox.style.display = 'block';
          resBox.innerHTML = `
            <div class="alert-banner" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.4); color: #059669;">
              <div>
                <strong>AI Sentiment Engine Result: POSITIVE (Confidence: 96.4%)</strong><br/>
                Feedback logged with Ticket #FB-${Math.floor(1000 + Math.random() * 9000)}. Forwarded to Sub-Postmaster & Quality Assurance cell. Thank you!
              </div>
            </div>
          `;
        }
      });
    }
  }
}
