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
import { captchaManager } from './captcha.js';
import { speechService } from './speech.js';


class DakDrishtiApp {
  constructor() {
    this.activeSection = 'digital-twin'; // 'digital-twin' | 'vision-live' | 'citizen' | 'dashboards' | 'analytics'
    this.visionEngine = null;
    this.digitalTwin = null;
    this.citizenPortal = null;
    this.dashboards = null;
    this.analytics = null;
    this.simInterval = null;

    // Login / Verification Flow State
    this.loginPhase = 'role-select'; // 'role-select' | 'credentials' | 'otp'
    this.selectedRole = null; // 'customer' | 'employee'
    this.resendTimer = { customer: 0, employee: 0 };
    this.timerIntervals = { customer: null, employee: null };
    this.tempCitizenData = null;
    this.tempEmployeeData = null;
  }

  init() {
    // Unlock Audio & Speech Voices on first user gesture
    const unlockAudio = () => {
      speechService.initAudioContext();
      speechService.loadVoices();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    this.listenToState();
    this.renderShell();
  }

  startResendTimer(role) {
    this.resendTimer[role] = 30;
    if (this.timerIntervals[role]) {
      clearInterval(this.timerIntervals[role]);
    }
    const label = role === 'employee' ? 'PIN' : 'OTP';
    this.timerIntervals[role] = setInterval(() => {
      this.resendTimer[role]--;
      if (this.resendTimer[role] <= 0) {
        clearInterval(this.timerIntervals[role]);
        this.timerIntervals[role] = null;
      }
      if (store.userRole === null) {
        const btn = document.getElementById(`${role}-resend-btn`);
        if (btn) {
          if (this.resendTimer[role] > 0) {
            btn.disabled = true;
            btn.innerText = `Resend ${label} (${this.resendTimer[role]}s)`;
          } else {
            btn.disabled = false;
            btn.innerText = `Resend ${label} 🔄`;
          }
        }
      }
    }, 1000);
  }

  renderShell() {
    const root = document.getElementById('app');
    if (!root) return;

    if (store.userRole === null) {
      this.renderLoginGateway(root);
      this.attachLoginEvents();
      if (this.simInterval) {
        clearInterval(this.simInterval);
        this.simInterval = null;
      }
      if (this.visionEngine) {
        this.visionEngine.stop();
        this.visionEngine = null;
      }
    } else if (store.userRole === 'customer') {
      this.renderCitizenShell(root);
      this.attachCitizenShellEvents();
      this.startSimulationClock();
    } else if (store.userRole === 'employee') {
      this.renderAdminShell(root);
      this.initVisionEngine();
      this.renderSectionContent();
      this.attachGlobalEvents();
      this.startSimulationClock();
    }
  }

  renderLoginGateway(root) {
    let mainContentHtml = '';

    if (this.loginPhase === 'role-select') {
      mainContentHtml = `
        <div class="role-select-grid">
          <div class="role-select-label">${store.t('selectYourRole')}</div>
          
          <div class="role-card role-citizen" data-role="customer">
            <div class="role-card-icon">👥</div>
            <div class="role-card-info">
              <h3>${store.t('iAmCitizen')}</h3>
              <p>${store.t('citizenRoleDesc')}</p>
              <div class="role-card-features">
                <span class="feature-tag">E-Tokens</span>
                <span class="feature-tag">Live Queue</span>
              </div>
            </div>
            <div class="role-card-arrow">➔</div>
          </div>

          <div class="role-card role-employee" data-role="employee">
            <div class="role-card-icon">👮</div>
            <div class="role-card-info">
              <h3>${store.t('iAmEmployee')}</h3>
              <p>${store.t('employeeRoleDesc')}</p>
              <div class="role-card-features">
                <span class="feature-tag">AI Vision</span>
                <span class="feature-tag">Digital Twin</span>
              </div>
            </div>
            <div class="role-card-arrow">➔</div>
          </div>
        </div>
      `;
    } else if (this.loginPhase === 'register') {
      mainContentHtml = `
        <div class="login-single-card-wrapper">
          <a href="#" class="login-back-link" id="back-to-roles">← Back</a>
          <div class="login-card customer-card">
            <div class="login-card-header">
              <div class="login-card-icon">📝</div>
              <div class="login-card-title">
                <h2>${store.language === 'hi' ? 'नया खाता पंजीकरण' : 'Create New Account'}</h2>
                <p>${store.language === 'hi' ? 'डाक सेवा पोर्टल पंजीकरण' : 'Register for India Post Services'}</p>
              </div>
            </div>
            <form id="user-register-form" class="login-form">
              <div id="register-error-msg" class="login-error-msg" style="display: none; text-align: center;"></div>
              <div id="register-success-msg" class="login-error-msg" style="display: none; text-align: center; background: #DCFCE7; color: #15803D; border-color: #86EFAC;"></div>

              <div class="form-group">
                <label for="reg-full-name">Full Name <span class="required-star">*</span></label>
                <input type="text" id="reg-full-name" class="form-input" placeholder="Full Name" required>
              </div>

              <div class="form-group">
                <label for="reg-contact">Email or Mobile Number <span class="required-star">*</span></label>
                <input type="text" id="reg-contact" class="form-input" placeholder="Email or Mobile Number" required>
              </div>

              <div class="form-group">
                <label for="reg-password">Password <span class="required-star">*</span></label>
                <input type="password" id="reg-password" class="form-input" placeholder="Password" required>
              </div>

              <div class="form-group">
                <label for="reg-confirm-password">Confirm Password <span class="required-star">*</span></label>
                <input type="password" id="reg-confirm-password" class="form-input" placeholder="Confirm Password" required>
              </div>

              <div class="captcha-container">
                <div class="captcha-label">
                  <span>🛡️ Security Verification (CAPTCHA) <span class="required-star">*</span></span>
                </div>
                <div class="captcha-widget-row">
                  <div class="captcha-canvas-wrapper">
                    <canvas id="register-captcha-canvas" class="captcha-canvas" width="170" height="48"></canvas>
                  </div>
                  <div class="captcha-action-btns">
                    <button type="button" class="captcha-icon-btn" id="register-captcha-refresh" title="Refresh CAPTCHA">🔄</button>
                    <button type="button" class="captcha-icon-btn" id="register-captcha-audio" title="Listen CAPTCHA">🔊</button>
                  </div>
                </div>
                <input type="text" id="register-captcha-input" class="form-input captcha-input" placeholder="Enter CAPTCHA Code" required autocomplete="off">
              </div>

              <button type="submit" class="btn btn-login">
                ${store.language === 'hi' ? 'खाता बनाएं 📝' : 'Create Account 📝'}
              </button>

              <div style="text-align: center; margin-top: 14px;">
                <a href="#" id="goto-login-link" style="color: var(--post-red-dark); font-weight: 700; font-size: 0.88rem; text-decoration: none;">
                  ${store.language === 'hi' ? 'पहले से पंजीकृत हैं? लॉगिन करें 🚪' : 'Already have an account? Log in here 🚪'}
                </a>
              </div>
            </form>
          </div>
        </div>
      `;
    } else if (this.loginPhase === 'credentials') {
      if (this.selectedRole === 'customer') {
        mainContentHtml = `
          <div class="login-single-card-wrapper">
            <a href="#" class="login-back-link" id="back-to-roles">← Back</a>
            <div class="login-card customer-card">
              <div class="login-card-header">
                <div class="login-card-icon">👥</div>
                <div class="login-card-title">
                  <h2>${store.t('citizenPortal')}</h2>
                  <p>Book E-Tokens, check queue sizes & leave feedback</p>
                </div>
              </div>
              <form id="citizen-login-form" class="login-form">
                <div id="citizen-login-error" class="login-error-msg" style="display: none; text-align: center;"></div>
                <div class="form-group">
                  <label for="citizen-name">${store.t('citizenName')} <span class="required-star">*</span></label>
                  <input type="text" id="citizen-name" class="form-input" placeholder="Full Name" required>
                </div>
                <div class="form-group">
                  <label for="citizen-mobile">Email or Mobile Number <span class="required-star">*</span></label>
                  <input type="text" id="citizen-mobile" class="form-input" placeholder="Email or Mobile Number" required>
                </div>
                <div class="form-group">
                  <label style="font-weight: 700; font-size: 0.85rem;">Select OTP Delivery Method</label>
                  <div style="display: flex; gap: 8px; margin-top: 5px;">
                    <label style="flex: 1; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 4px; cursor: pointer; background: #FFFFFF; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <input type="radio" name="otpChannelSelect" value="sms" checked> 📱 SMS
                    </label>
                    <label style="flex: 1; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 4px; cursor: pointer; background: #FFFFFF; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <input type="radio" name="otpChannelSelect" value="email"> 📧 Email
                    </label>
                    <label style="flex: 1; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 4px; cursor: pointer; background: #FFFFFF; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <input type="radio" name="otpChannelSelect" value="voice"> 📞 Voice Call
                    </label>
                  </div>
                </div>

                <div class="captcha-container">
                  <div class="captcha-label">
                    <span>🛡️ Security Verification (CAPTCHA) <span class="required-star">*</span></span>
                  </div>
                  <div class="captcha-widget-row">
                    <div class="captcha-canvas-wrapper">
                      <canvas id="citizen-captcha-canvas" class="captcha-canvas" width="170" height="48"></canvas>
                    </div>
                    <div class="captcha-action-btns">
                      <button type="button" class="captcha-icon-btn" id="citizen-captcha-refresh" title="Refresh CAPTCHA">🔄</button>
                      <button type="button" class="captcha-icon-btn" id="citizen-captcha-audio" title="Listen CAPTCHA">🔊</button>
                    </div>
                  </div>
                  <input type="text" id="citizen-captcha-input" class="form-input captcha-input" placeholder="Enter CAPTCHA Code" required autocomplete="off">
                </div>

                <button type="submit" class="btn btn-login">
                  ${store.t('enterCitizenPortal')}
                </button>
                <div style="text-align: center; margin-top: 14px;">
                  <a href="#" id="goto-register-link" style="color: var(--post-red-dark); font-weight: 700; font-size: 0.88rem; text-decoration: none;">
                    ${store.language === 'hi' ? 'नया खाता? यहाँ पंजीकरण करें 📝' : 'Don\'t have an account? Register here 📝'}
                  </a>
                </div>
              </form>
            </div>
          </div>
        `;
      } else {
        mainContentHtml = `
          <div class="login-single-card-wrapper">
            <a href="#" class="login-back-link" id="back-to-roles">← Back</a>
            <div class="login-card employee-card">
              <div class="login-card-header">
                <div class="login-card-icon">👮</div>
                <div class="login-card-title">
                  <h2>${store.t('employeeConsole')}</h2>
                  <p>Access AI Edge Vision, digital twin & command center</p>
                </div>
              </div>

              <!-- Quick Demo Credentials Banner -->
              <div style="background: rgba(211, 47, 47, 0.06); border: 1px dashed var(--post-red); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.82rem; color: var(--text-primary);">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                  <strong style="color: var(--post-red-dark); font-weight: 700;">🔑 Demo Credentials:</strong>
                  <button type="button" id="autofill-demo-emp-btn" style="background: var(--post-red); color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">
                    ⚡ Auto-fill Demo Login
                  </button>
                </div>
                <div>User ID: <strong>admin</strong> | Password: <strong>admin123</strong></div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 3px;">(MFA OTP: enter any 6-digit pin like <strong>123456</strong>)</div>
              </div>

              <form id="employee-login-form" class="login-form">
                <div id="employee-login-error" class="login-error-msg"></div>
                <div class="form-group">
                  <label for="employee-id">Email, Mobile or Staff ID <span class="required-star">*</span></label>
                  <input type="text" id="employee-id" class="form-input" placeholder="e.g. admin or employee email" required>
                </div>
                <div class="form-group">
                  <label for="employee-password">${store.t('password')} <span class="required-star">*</span></label>
                  <input type="password" id="employee-password" class="form-input" placeholder="Password" required>
                  <div style="text-align: right; margin-top: 4px;">
                    <a href="#" id="employee-forgot-pin-link" style="font-size: 0.78rem; color: var(--post-red); font-weight: 600; text-decoration: none;">${store.t('forgotPin')}</a>
                  </div>
                </div>

                <div class="captcha-container">
                  <div class="captcha-label">
                    <span>🛡️ Security Verification (CAPTCHA) <span class="required-star">*</span></span>
                  </div>
                  <div class="captcha-widget-row">
                    <div class="captcha-canvas-wrapper">
                      <canvas id="employee-captcha-canvas" class="captcha-canvas" width="170" height="48"></canvas>
                    </div>
                    <div class="captcha-action-btns">
                      <button type="button" class="captcha-icon-btn" id="employee-captcha-refresh" title="Refresh CAPTCHA">🔄</button>
                      <button type="button" class="captcha-icon-btn" id="employee-captcha-audio" title="Listen CAPTCHA">🔊</button>
                    </div>
                  </div>
                  <input type="text" id="employee-captcha-input" class="form-input captcha-input" placeholder="Enter CAPTCHA Code" required autocomplete="off">
                </div>

                <button type="submit" class="btn btn-login">
                  ${store.t('loginOperatorConsole')}
                </button>
              </form>
            </div>
          </div>
        `;
      }
    } else if (this.loginPhase === 'forgot-pin') {
      mainContentHtml = `
        <div class="login-single-card-wrapper">
          <a href="#" class="login-back-link" id="back-to-credentials">← ${store.language === 'hi' ? 'लॉगिन पर वापस जाएँ' : 'Back to Login'}</a>
          <div class="login-card employee-card">
            <div class="login-card-header">
              <div class="login-card-icon">🔑</div>
              <div class="login-card-title">
                <h2>${store.t('resetPinTitle')}</h2>
                <p>${store.t('resetPinDesc')}</p>
              </div>
            </div>
            <form id="employee-forgot-pin-form" class="login-form">
              <div id="forgot-pin-msg" class="login-error-msg" style="display: none; text-align: center;"></div>
              <div class="form-group">
                <label for="reset-staff-id">Email or Mobile Number <span class="required-star">*</span></label>
                <input type="text" id="reset-staff-id" class="form-input" placeholder="Email or Mobile Number" required>
              </div>
              <div class="form-group">
                <label for="reset-contact">${store.t('registeredEmailMobile')} <span class="required-star">*</span></label>
                <input type="text" id="reset-contact" class="form-input" placeholder="Email or Mobile Number" required>
              </div>
              <button type="submit" class="btn btn-login">
                ${store.t('sendResetLink')}
              </button>
            </form>
          </div>
        </div>
      `;
    } else if (this.loginPhase === 'otp') {
      if (this.selectedRole === 'customer') {
        const maskedPhone = this.tempCitizenData?.mobile ? (this.tempCitizenData.mobile.includes('@') ? this.tempCitizenData.mobile : '+91 XXXXX' + this.tempCitizenData.mobile.slice(-4)) : 'user@domain.com';
        const channelLabel = this.tempCitizenData?.channel === 'email' ? '📧 Email OTP' : this.tempCitizenData?.channel === 'voice' ? '📞 Voice Call OTP' : '📱 SMS OTP';
        const checkLabel = this.tempCitizenData?.channel === 'email' ? 'Email Inbox' : this.tempCitizenData?.channel === 'voice' ? 'Phone for incoming Voice Call' : 'SMS Messages';
        mainContentHtml = `
          <div class="login-single-card-wrapper">
            <a href="#" class="login-back-link" id="back-to-credentials">← Back</a>
            <div class="login-card customer-card">
              <div class="login-card-header">
                <div class="login-card-icon">🔑</div>
                <div class="login-card-title">
                  <h2>${store.language === 'hi' ? 'नागरिक सत्यापन' : 'Citizen Verification'}</h2>
                  <p>${store.language === 'hi' ? 'सुरक्षित प्रमाणीकरण' : 'Secure Authentication'}</p>
                </div>
              </div>
              <div class="otp-sent-info">
                <span>${channelLabel} dispatched to:</span><br/>
                <span class="otp-phone-mask">${maskedPhone}</span>
                <div style="font-size: 0.78rem; margin-top: 5px; color: var(--color-success); font-weight: 600;">
                  📲 Please check your ${checkLabel} for the 6-digit OTP code
                </div>
              </div>
              <form id="citizen-otp-form" class="login-form" style="margin-top: 10px;">
                <div id="citizen-otp-error" class="login-error-msg" style="text-align: center;"></div>
                <div class="form-group">
                  <input type="text" id="citizen-otp" class="form-input otp-input-field" placeholder="••••••" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code">
                </div>
                <button type="submit" class="btn btn-login">
                  ${store.language === 'hi' ? 'सत्यापित करें और लॉग इन करें 🚪' : 'Verify & Login 🚪'}
                </button>
                <div class="otp-actions-row">
                  <button type="button" id="citizen-resend-btn" class="btn btn-secondary btn-sm" ${this.resendTimer.customer > 0 ? 'disabled' : ''}>
                    ${this.resendTimer.customer > 0 ? `Resend OTP (${this.resendTimer.customer}s)` : 'Resend OTP 🔄'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
      } else {
        mainContentHtml = `
          <div class="login-single-card-wrapper">
            <a href="#" class="login-back-link" id="back-to-credentials">← Back</a>
            <div class="login-card employee-card">
              <div class="login-card-header">
                <div class="login-card-icon">🔒</div>
                <div class="login-card-title">
                  <h2>MFA Verification</h2>
                  <p>SecurMail Authentication</p>
                </div>
              </div>
              <div class="otp-sent-info">
                ${store.language === 'hi' ? 'सुरक्षा उपकरण या SecurMail द्वारा उत्पन्न पिन दर्ज करें।' : 'Enter the 6-digit pin from your security device.'}
              </div>
              <form id="employee-otp-form" class="login-form" style="margin-top: 10px;">
                <div id="employee-otp-error" class="login-error-msg" style="text-align: center;"></div>
                <div class="form-group">
                  <input type="text" id="employee-otp" class="form-input otp-input-field" placeholder="••••••" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code">
                </div>
                <button type="submit" class="btn btn-login">
                  ${store.language === 'hi' ? 'सत्यापित करें और प्रवेश करें 🖥️' : 'Verify & Enter Console 🖥️'}
                </button>
                <div class="otp-actions-row">
                  <button type="button" id="employee-resend-btn" class="btn btn-secondary btn-sm" ${this.resendTimer.employee > 0 ? 'disabled' : ''}>
                    ${this.resendTimer.employee > 0 ? `Resend PIN (${this.resendTimer.employee}s)` : 'Resend PIN 🔄'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
      }
    }

    root.innerHTML = `
      <div class="govt-top-strip">
        <span>भारत सरकार | संचार मंत्रालय | डाक विभाग</span>
        <span>Government of India | Ministry of Communications | Department of Posts</span>
      </div>
      <div class="login-gateway-container">
        <div style="position: absolute; top: 35px; right: 20px; display: flex; align-items: center; gap: 10px; z-index: 20;">
          <select id="gateway-lang-select" class="tier-select lang-select" style="font-weight: 700; padding: 6px 12px; border-radius: var(--radius-sm); background: #FFFFFF; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">
            <option value="en" ${store.language === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
            <option value="hi" ${store.language === 'hi' ? 'selected' : ''}>🇮🇳 हिन्दी</option>
          </select>
        </div>

        <div class="login-brand-wrapper">
          <div class="login-brand-logo">
            <img src="images/india_post_logo.svg" alt="India Post Logo">
          </div>
          <h1>${store.language === 'hi' ? 'भारतीय डाक | डाक सेवा पोर्टल' : 'Department of Posts | India Post'}</h1>
          <p>${store.t('subTitle')}</p>
          <p style="font-size: 0.82rem; color: var(--post-red-dark); font-weight: 700; margin-top: 4px;">${store.t('ministryOfCom')}</p>
        </div>
        
        ${mainContentHtml}
      </div>
    `;
  }

  renderCitizenShell(root) {
    root.innerHTML = `
      <div class="app-container">
        <div class="govt-top-strip">
          <span>भारत सरकार | संचार मंत्रालय | डाक विभाग</span>
          <span>Government of India | Ministry of Communications | Department of Posts</span>
        </div>
        <!-- Top App Bar -->
        <header class="top-header">
          <div class="brand-section">
            <div class="brand-logo">
              <img src="images/india_post_logo.svg" alt="India Post Logo">
            </div>
            <div class="brand-title">
              <h1>
                भारतीय डाक <span style="font-weight: 400; font-size: 0.95rem; color: #FFFFFF;">| INDIA POST</span>
              </h1>
              <p>
                <span>${store.t('citizenPortal')}</span> • <span>${store.t('deptOfPosts')}</span>
              </p>
            </div>
          </div>

          <!-- Top Header Controls -->
          <div class="header-controls">
            <select id="citizen-lang-select" class="tier-select lang-select" style="font-weight: 700; padding: 6px 12px; border-radius: var(--radius-sm); background: #FFFFFF; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">
              <option value="en" ${store.language === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
              <option value="hi" ${store.language === 'hi' ? 'selected' : ''}>🇮🇳 हिन्दी</option>
            </select>
            <button id="logout-btn" class="control-btn" style="background: #FFFFFF; color: var(--post-red-dark); font-weight: 800;">
              ${store.t('exitPortal')}
            </button>
          </div>
        </header>

        <!-- Main Citizen Area -->
        <main class="citizen-viewport animate-fade-in">
          <div class="citizen-welcome-alert">
            <span>📢 Welcome, <strong>${store.userToken && store.userToken.citizenName ? store.userToken.citizenName : 'Citizen'}</strong>! You have access to real-time ticket booking and post office counters services.</span>
          </div>
          <div id="citizen-mount-point"></div>
        </main>

        <!-- Footer -->
        <footer class="app-footer">
          <div>
            <strong>${store.t('appTitle')} 4.0</strong> — ${store.t('citizenPortal')} • ${store.t('deptOfPosts')}
          </div>
          <div>
            ${store.t('ministryOfCom')}
          </div>
        </footer>
      </div>
    `;
    const mount = document.getElementById('citizen-mount-point');
    if (mount) {
      this.citizenPortal = new CitizenPortalManager(mount);
    }
  }

  renderAdminShell(root) {
    root.innerHTML = `
      <div class="app-container">
        <div class="govt-top-strip">
          <span>भारत सरकार | संचार मंत्रालय | डाक विभाग</span>
          <span>Government of India | Ministry of Communications | Department of Posts</span>
        </div>
        <!-- Top App Bar -->
        <header class="top-header">
          <div class="brand-section">
            <div class="brand-logo">
              <img src="images/india_post_logo.svg" alt="India Post Logo">
            </div>
            <div class="brand-title">
              <h1>
                भारतीय डाक <span style="font-weight: 400; font-size: 0.95rem; color: #FFFFFF;">| INDIA POST</span>
              </h1>
              <p>
                <span>${store.t('deptOfPosts')}</span> • <span>${store.t('ministryOfCom')}</span>
              </p>
            </div>
          </div>

          <!-- Main Navigation Tabs -->
          <nav class="main-nav">
            <button class="nav-tab active" data-section="digital-twin">
              🏛️ ${store.t('digitalTwin')}
            </button>
            <button class="nav-tab" data-section="vision-live">
              📹 Live Counter Queue
            </button>
            <button class="nav-tab" data-section="citizen">
              👥 ${store.t('citizenAccess')}
            </button>
            <button class="nav-tab" data-section="dashboards">
              📊 ${store.t('multiTier')}
            </button>
            <button class="nav-tab" data-section="analytics">
              📈 ${store.t('predictiveAnalytics')}
            </button>
          </nav>

          <!-- Top Header Controls -->
          <div class="header-controls">
            <select id="admin-lang-select" class="tier-select lang-select" style="font-weight: 700; padding: 6px 12px; border-radius: var(--radius-sm); background: #FFFFFF; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">
              <option value="en" ${store.language === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
              <option value="hi" ${store.language === 'hi' ? 'selected' : ''}>🇮🇳 हिन्दी</option>
            </select>

            <div id="mysql-status-badge" class="live-indicator" style="background: #FFFFFF; border-color: var(--color-success); color: var(--color-success);">
              <span id="mysql-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-success);"></span>
              <span id="mysql-status-text">${store.t('mysqlStatus')}</span>
            </div>

            <button id="logout-btn" class="control-btn" style="background: #FFFFFF; color: var(--post-red-dark); font-weight: 800;">
              ${store.t('logout')}
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
              ${store.t('startFreshShift')}
            </button>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-left: 8px;">${store.t('adminTierView')}</span>
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
            <span class="badge badge-green" id="ticker-sla-badge" style="font-family: var(--font-mono);">SLA: 94.2%</span>
          </div>
        </div>

        <!-- Main Dynamic Body Area -->
        <main class="app-main" id="main-view-container">
          <!-- Rendered Dynamically -->
        </main>

        <!-- Footer -->
        <footer class="app-footer">
          <div>
            <strong>${store.t('appTitle')} 4.0</strong> — Measurement & Monitoring of Counter Services Platform • ${store.t('deptOfPosts')}
          </div>
          <div>
            Built with Industry 4.0 AI Edge Vision & Spatial Digital Twin Architecture
          </div>
        </footer>
      </div>
    `;
  }

  attachLoginEvents() {
    // Initialize CAPTCHAs for active form
    if (this.loginPhase === 'register') {
      captchaManager.createCaptcha('user-register-form', 'register-captcha-canvas');
      const refreshBtn = document.getElementById('register-captcha-refresh');
      if (refreshBtn) {
        refreshBtn.onclick = () => captchaManager.createCaptcha('user-register-form', 'register-captcha-canvas');
      }
      const audioBtn = document.getElementById('register-captcha-audio');
      if (audioBtn) {
        audioBtn.onclick = () => captchaManager.speakCaptcha('user-register-form');
      }
    } else if (this.loginPhase === 'credentials' && this.selectedRole === 'customer') {
      captchaManager.createCaptcha('citizen-login-form', 'citizen-captcha-canvas');
      const refreshBtn = document.getElementById('citizen-captcha-refresh');
      if (refreshBtn) {
        refreshBtn.onclick = () => captchaManager.createCaptcha('citizen-login-form', 'citizen-captcha-canvas');
      }
      const audioBtn = document.getElementById('citizen-captcha-audio');
      if (audioBtn) {
        audioBtn.onclick = () => captchaManager.speakCaptcha('citizen-login-form');
      }
    } else if (this.loginPhase === 'credentials' && this.selectedRole === 'employee') {
      captchaManager.createCaptcha('employee-login-form', 'employee-captcha-canvas');
      const refreshBtn = document.getElementById('employee-captcha-refresh');
      if (refreshBtn) {
        refreshBtn.onclick = () => captchaManager.createCaptcha('employee-login-form', 'employee-captcha-canvas');
      }
      const audioBtn = document.getElementById('employee-captcha-audio');
      if (audioBtn) {
        audioBtn.onclick = () => captchaManager.speakCaptcha('employee-login-form');
      }

      const autofillBtn = document.getElementById('autofill-demo-emp-btn');
      if (autofillBtn) {
        autofillBtn.onclick = () => {
          const idInput = document.getElementById('employee-id');
          const passInput = document.getElementById('employee-password');
          const captchaInput = document.getElementById('employee-captcha-input');
          if (idInput) idInput.value = 'admin';
          if (passInput) passInput.value = 'admin123';
          const captchaData = captchaManager.getCaptchaData('employee-login-form');
          if (captchaInput && captchaData && captchaData.code) {
            captchaInput.value = captchaData.code;
          }
        };
      }
    }

    // 0. Role Selection Cards
    if (this.loginPhase === 'role-select') {
      const cards = document.querySelectorAll('.role-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          this.selectedRole = card.dataset.role;
          this.loginPhase = 'credentials';
          this.renderShell();
        });
      });
    }

    // Back Buttons
    const backToRolesBtn = document.getElementById('back-to-roles');
    if (backToRolesBtn) {
      backToRolesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginPhase = 'role-select';
        this.selectedRole = null;
        this.renderShell();
      });
    }

    const backToCredentialsBtn = document.getElementById('back-to-credentials');
    if (backToCredentialsBtn) {
      backToCredentialsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginPhase = 'credentials';
        const role = this.selectedRole;
        this.resendTimer[role] = 0;
        if (this.timerIntervals[role]) {
          clearInterval(this.timerIntervals[role]);
          this.timerIntervals[role] = null;
        }
        this.renderShell();
      });
    }

    // Link: Navigate to Register Page
    const gotoRegisterBtn = document.getElementById('goto-register-link');
    if (gotoRegisterBtn) {
      gotoRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginPhase = 'register';
        this.renderShell();
      });
    }

    // Link: Navigate to Login Page
    const gotoLoginBtn = document.getElementById('goto-login-link');
    if (gotoLoginBtn) {
      gotoLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginPhase = 'credentials';
        this.renderShell();
      });
    }

    // Register Form Submit Handler
    const registerForm = document.getElementById('user-register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('reg-full-name').value.trim();
        const contact = document.getElementById('reg-contact').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPassword = document.getElementById('reg-confirm-password').value.trim();
        const captchaInput = document.getElementById('register-captcha-input')?.value.trim();
        const captchaData = captchaManager.getCaptchaData('user-register-form');
        const role = 'customer';
        
        const errorEl = document.getElementById('register-error-msg');
        const successEl = document.getElementById('register-success-msg');
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        if (errorEl) errorEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';

        if (password !== confirmPassword) {
          if (errorEl) {
            errorEl.innerText = '❌ Passwords do not match. Please verify.';
            errorEl.style.display = 'block';
          }
          return;
        }

        if (!captchaManager.validateCaptcha('user-register-form', captchaInput)) {
          if (errorEl) {
            errorEl.innerText = '❌ Invalid CAPTCHA code. Please check and try again.';
            errorEl.style.display = 'block';
          }
          captchaManager.createCaptcha('user-register-form', 'register-captcha-canvas');
          const inputEl = document.getElementById('register-captcha-input');
          if (inputEl) inputEl.value = '';
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, contact, role, password, captchaToken: captchaData?.token, captchaInput })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            if (successEl) {
              successEl.innerText = `✅ ${data.message || 'Registration successful! Saved to database.'}`;
              successEl.style.display = 'block';
            }
            setTimeout(() => {
              this.selectedRole = role;
              if (role === 'customer') {
                this.tempCitizenData = { citizenName: fullName, mobile: contact };
                store.userToken = this.tempCitizenData;
                store.login('customer');
              } else {
                this.tempEmployeeData = { id: contact, name: fullName };
                store.login('employee');
              }
            }, 1200);
          } else {
            if (errorEl) {
              errorEl.innerText = `❌ ${data.message || 'Registration failed'}`;
              errorEl.style.display = 'block';
            }
            captchaManager.createCaptcha('user-register-form', 'register-captcha-canvas');
          }
        } catch (err) {
          console.error('Registration API Error:', err);
          if (errorEl) {
            errorEl.innerText = '❌ Network error during registration. Please try again.';
            errorEl.style.display = 'block';
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // 1. Citizen login form (credentials)
    const citizenForm = document.getElementById('citizen-login-form');
    if (citizenForm) {
      citizenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('citizen-name').value.trim();
        const mobile = document.getElementById('citizen-mobile').value.trim();
        const channel = document.querySelector('input[name="otpChannelSelect"]:checked')?.value || 'sms';
        const captchaInput = document.getElementById('citizen-captcha-input')?.value.trim();
        const captchaData = captchaManager.getCaptchaData('citizen-login-form');
        const errorEl = document.getElementById('citizen-login-error');
        const submitBtn = citizenForm.querySelector('button[type="submit"]');

        if (!name) {
          if (errorEl) { errorEl.innerText = '❌ Please enter your full name.'; errorEl.style.display = 'block'; }
          return;
        }

        if (!mobile) {
          if (errorEl) { errorEl.innerText = '❌ Please enter your Email or Mobile Number.'; errorEl.style.display = 'block'; }
          return;
        }

        if (!captchaManager.validateCaptcha('citizen-login-form', captchaInput)) {
          if (errorEl) {
            errorEl.innerText = '❌ Invalid CAPTCHA code. Please check and try again.';
            errorEl.style.display = 'block';
          }
          captchaManager.createCaptcha('citizen-login-form', 'citizen-captcha-canvas');
          const inputEl = document.getElementById('citizen-captcha-input');
          if (inputEl) inputEl.value = '';
          return;
        }

        if (errorEl) errorEl.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;

        this.tempCitizenData = { citizenName: name, mobile: mobile, channel: channel };

        try {
          const res = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, channel, captchaToken: captchaData?.token, captchaInput })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            if (errorEl) errorEl.style.display = 'none';
            this.loginPhase = 'otp';
            this.startResendTimer('customer');
            this.renderShell();
          } else {
            if (errorEl) {
              errorEl.innerText = `❌ ${data.message || 'Account not registered. Please register first.'}`;
              errorEl.style.display = 'block';
            }
            captchaManager.createCaptcha('citizen-login-form', 'citizen-captcha-canvas');
          }
        } catch (err) {
          console.error('API Error /api/send-otp:', err);
          if (errorEl) {
            errorEl.innerText = '❌ Backend connection error. Please try again.';
            errorEl.style.display = 'block';
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // 2. Citizen OTP verification form
    const citizenOtpForm = document.getElementById('citizen-otp-form');
    if (citizenOtpForm) {
      citizenOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otpVal = document.getElementById('citizen-otp').value.trim();
        const errorEl = document.getElementById('citizen-otp-error');
        const submitBtn = citizenOtpForm.querySelector('button[type="submit"]');

        if (!otpVal.match(/^[0-9]{6}$/)) {
          if (errorEl) {
            errorEl.innerText = '❌ Please enter a valid 6-digit OTP.';
            errorEl.style.display = 'block';
          }
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
          const res = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: this.tempCitizenData?.mobile || '', otp: otpVal })
          });
          
          let data = {};
          try { data = await res.json(); } catch (e) {}

          if (res.ok && data.success) {
            if (errorEl) errorEl.style.display = 'none';
            store.userToken = this.tempCitizenData || { citizenName: 'Citizen User', mobile: '9876543210' };
            store.login('customer');
          } else {
            if (errorEl) {
              errorEl.innerText = `❌ ${data.message || 'Verification failed'}`;
              errorEl.style.display = 'block';
            }
          }
        } catch (err) {
          console.error('API Error /api/verify-otp:', err);
          if (errorEl) {
            errorEl.innerText = '❌ Backend connection error. Please try again.';
            errorEl.style.display = 'block';
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // 3. Citizen Resend OTP button
    const citizenResendBtn = document.getElementById('citizen-resend-btn');
    if (citizenResendBtn) {
      citizenResendBtn.addEventListener('click', async () => {
        if (this.tempCitizenData?.mobile) {
          try {
            const res = await fetch('/api/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mobile: this.tempCitizenData.mobile, channel: this.tempCitizenData?.channel || 'sms' })
            });
            const data = await res.json();
            const errorEl = document.getElementById('citizen-otp-error');
            if (errorEl && data.message) {
              errorEl.innerText = `ℹ️ ${data.message}`;
              errorEl.style.color = 'var(--post-gold)';
              errorEl.style.display = 'block';
            }
          } catch (err) {
            console.warn('Backend API /api/send-otp offline:', err);
          }
        }
        this.startResendTimer('customer');
        this.renderShell();
      });
    }

    // 4. Employee login form (credentials)
    const employeeForm = document.getElementById('employee-login-form');
    if (employeeForm) {
      employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('employee-id').value.trim();
        const password = document.getElementById('employee-password').value.trim();
        const captchaInput = document.getElementById('employee-captcha-input')?.value.trim();
        const captchaData = captchaManager.getCaptchaData('employee-login-form');
        const errorEl = document.getElementById('employee-login-error');
        const submitBtn = employeeForm.querySelector('button[type="submit"]');
        
        if (!id || !password) {
          if (errorEl) {
            errorEl.innerText = store.language === 'hi' ? 'कृपया ईमेल/मोबाइल और पासवर्ड दर्ज करें।' : 'Please enter Email or Mobile Number and Password.';
            errorEl.style.display = 'block';
          }
          return;
        }

        if (!captchaManager.validateCaptcha('employee-login-form', captchaInput)) {
          if (errorEl) {
            errorEl.innerText = store.language === 'hi' ? '❌ अमान्य कैप्चा कोड। कृपया पुनः प्रयास करें।' : '❌ Invalid CAPTCHA code. Please check and try again.';
            errorEl.style.display = 'block';
          }
          captchaManager.createCaptcha('employee-login-form', 'employee-captcha-canvas');
          const inputEl = document.getElementById('employee-captcha-input');
          if (inputEl) inputEl.value = '';
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact: id, password, captchaToken: captchaData?.token, captchaInput })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            if (errorEl) errorEl.style.display = 'none';
            this.tempEmployeeData = { id: data.user?.contact || id, name: data.user?.name || id };
            
            // Trigger Employee MFA OTP step
            this.loginPhase = 'otp';
            this.startResendTimer('employee');
            this.renderShell();
          } else {
            if (errorEl) {
              errorEl.innerText = `❌ ${data.message || 'Invalid credentials. Please register first.'}`;
              errorEl.style.display = 'block';
            }
            captchaManager.createCaptcha('employee-login-form', 'employee-captcha-canvas');
          }
        } catch (err) {
          console.error('Login API Error:', err);
          // Fallback for offline demo
          if (errorEl) errorEl.style.display = 'none';
          this.tempEmployeeData = { id };
          this.loginPhase = 'otp';
          this.startResendTimer('employee');
          this.renderShell();
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }


    // 5. Employee OTP verification form
    const employeeOtpForm = document.getElementById('employee-otp-form');
    if (employeeOtpForm) {
      employeeOtpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const otpVal = document.getElementById('employee-otp').value.trim();
        const errorEl = document.getElementById('employee-otp-error');
        
        // Accept any 6-digit code for demo
        if (otpVal.match(/^[0-9]{6}$/)) {
          if (errorEl) errorEl.style.display = 'none';
          store.login('employee');
        } else {
          if (errorEl) {
            errorEl.innerText = store.language === 'hi' ? '❌ अमान्य एमएफए कोड। कृपया 6 अंकों का कोड दर्ज करें।' : '❌ Invalid MFA Code. Please enter a 6-digit code.';
            errorEl.style.display = 'block';
          }
        }
      });
    }

    // 6. Employee Resend OTP button
    const employeeResendBtn = document.getElementById('employee-resend-btn');
    if (employeeResendBtn) {
      employeeResendBtn.addEventListener('click', () => {
        this.startResendTimer('employee');
        this.renderShell();
      });
    }

    // 7. Employee Forgot PIN / Reset Link Click
    const forgotPinBtn1 = document.getElementById('employee-forgot-pin-link');
    if (forgotPinBtn1) {
      forgotPinBtn1.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginPhase = 'forgot-pin';
        this.renderShell();
      });
    }

    // 8. Employee Forgot PIN Form Submit
    const forgotPinForm = document.getElementById('employee-forgot-pin-form');
    if (forgotPinForm) {
      forgotPinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const staffId = document.getElementById('reset-staff-id').value.trim();
        const contact = document.getElementById('reset-contact').value.trim();
        const msgEl = document.getElementById('forgot-pin-msg');

        if (staffId && contact) {
          if (msgEl) {
            msgEl.style.color = 'var(--post-gold)';
            msgEl.style.background = 'rgba(245, 166, 35, 0.1)';
            msgEl.style.borderColor = 'rgba(245, 166, 35, 0.3)';
            msgEl.innerText = store.language === 'hi' 
              ? `✅ रीसेट टोकन ${contact} पर भेजा गया! नए PIN के साथ लॉगिन करें।` 
              : `✅ Reset PIN instructions dispatched to ${contact}! Check inbox and log in.`;
            msgEl.style.display = 'block';
          }
          setTimeout(() => {
            this.loginPhase = 'credentials';
            this.renderShell();
          }, 2200);
        }
      });
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        store.toggleTheme();
      });
    }

    const langSelect = document.getElementById('gateway-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        store.setLanguage(e.target.value);
      });
    }
  }

  attachCitizenShellEvents() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        store.logout();
      });
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        store.toggleTheme();
      });
    }

    const langSelect = document.getElementById('citizen-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        store.setLanguage(e.target.value);
      });
    }
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
              <span style="color: var(--post-red);">📹</span> CCTV Surveillance & Counter Monitoring Overview
            </h3>
            <p class="card-subtitle">
              Live Counter Video Feed, Automated Queue Detection & Dwell Clock Monitoring
            </p>
          </div>
          <span class="badge badge-green" style="font-family: var(--font-mono);">
            ● LIVE COUNTER FEED ACTIVE
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
                  <span>🟩 Detection Overlay</span>
                </button>
                <button id="toggle-heatmap-btn" class="toggle-chip">
                  <span>🔥 Queue Density Map</span>
                </button>
                <button id="toggle-queuezone-btn" class="toggle-chip active">
                  <span>📐 Queue Boundary Zone</span>
                </button>
              </div>
            </div>
          </div>

          <div class="vision-sidebar-panel">
            <div class="card">
              <div class="card-header">
                <h4 class="card-title" style="font-size: 0.95rem;">
                  <span>🔔</span> Counter Event Log
                </h4>
                <span class="badge badge-red" id="active-alert-count">${store.alerts.length} Alert${store.alerts.length !== 1 ? 's' : ''}</span>
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

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        store.logout();
      });
    }

    // Language switcher
    const langSelect = document.getElementById('admin-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        store.setLanguage(e.target.value);
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
      if (event === 'LOGIN_STATE_CHANGED' || event === 'LANGUAGE_CHANGED') {
        if (store.userRole === null) {
          this.loginPhase = 'role-select';
          this.selectedRole = null;
          this.resendTimer = { customer: 0, employee: 0 };
          if (this.timerIntervals.customer) { clearInterval(this.timerIntervals.customer); this.timerIntervals.customer = null; }
          if (this.timerIntervals.employee) { clearInterval(this.timerIntervals.employee); this.timerIntervals.employee = null; }
        }
        this.renderShell();
      } else if (event === 'HEALTH_UPDATED') {
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

      // Update live global ticker banner
      const tickerText = document.getElementById('ticker-text');
      const tickerBadge = document.getElementById('ticker-sla-badge');
      if (tickerText) {
        const activeCounters = store.counters.filter(c => c.status !== 'closed' && c.operatorPresent).length;
        const totalQueue = store.counters.reduce((s, c) => s + c.queueCount, 0);
        const avgTatSecs = store.counters.reduce((s, c) => s + c.servingCustomerDwellSec, 0) / store.counters.length;
        const avgTatMins = (avgTatSecs / 60).toFixed(1);
        const slaOk = store.counters.filter(c => c.queueCount <= 6).length;
        const slaScore = ((slaOk / store.counters.length) * 100).toFixed(1);
        const slaColor = parseFloat(slaScore) >= 90 ? 'badge-green' : 'badge-amber';
        tickerText.innerHTML = `<strong>Real-time Status:</strong> ${activeCounters} of ${store.counters.length} counters active • ${totalQueue} citizens in queue • Avg dwell time: <strong>${avgTatMins} mins</strong>`;
        if (tickerBadge) {
          tickerBadge.className = `badge ${slaColor}`;
          tickerBadge.style.fontFamily = 'var(--font-mono)';
          tickerBadge.innerText = `SLA: ${slaScore}%`;
        }
      }
    }, 1000);
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DakDrishtiApp();
  app.init();
});
