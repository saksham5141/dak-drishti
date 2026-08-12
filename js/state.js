/**
 * DakDrishti 4.0 - Global Reactive State & Data Engine with MySQL Backend Sync
 * Department of Posts, Government of India
 */

// Hierarchy Definitions
export const HIERARCHY_DATA = {
  circles: [
    { id: 'DL', name: 'Delhi Circle', pmg: 'Smt. Vandana Sharma, CPMG', hpos: 14, spos: 382, totalCounters: 1420 }
  ],
  divisions: [
    { id: 'ND-01', circleId: 'DL', name: 'New Delhi Central Division', sspo: 'Shri Rajesh Kumar, SSPO', hpos: 3, spos: 48, totalCounters: 184 },
    { id: 'SD-02', circleId: 'DL', name: 'South Delhi Division', sspo: 'Dr. Meenakshi Rao, SSPO', hpos: 4, spos: 62, totalCounters: 236 },
    { id: 'ED-03', circleId: 'DL', name: 'East Delhi Division', sspo: 'Shri A. K. Verma, SPO', hpos: 3, spos: 54, totalCounters: 198 }
  ],
  hpos: [
    { id: 'HPO-110001', divId: 'ND-01', name: 'New Delhi GPO (110001)', postmaster: 'Shri B. S. Rawat, Chief Postmaster', counters: 18, avgTat: '4.8 min', slaScore: 96.4 },
    { id: 'HPO-110002', divId: 'ND-01', name: 'Connaught Place HPO (110002)', postmaster: 'Smt. Sunita Goyal, SPM', counters: 12, avgTat: '6.2 min', slaScore: 91.8 },
    { id: 'HPO-110003', divId: 'ND-01', name: 'Parliament Street PO (110001)', postmaster: 'Shri Manoj Joshi, Postmaster', counters: 8, avgTat: '5.1 min', slaScore: 94.2 }
  ],
  nearbyOffices: [
    { id: 'PO-01', name: 'Connaught Place Post Office', pincode: '110001', distance: '0.8 km', activeCounters: 6, queueDepth: 14, waitTime: '6 mins', status: 'Moderate', color: 'amber' },
    { id: 'PO-02', name: 'Barakhamba Road Post Office', pincode: '110001', distance: '1.4 km', activeCounters: 4, queueDepth: 5, waitTime: '2 mins', status: 'Low Traffic', color: 'green' },
    { id: 'PO-03', name: 'Janpath Post Office', pincode: '110001', distance: '1.9 km', activeCounters: 3, queueDepth: 19, waitTime: '14 mins', status: 'High Rush', color: 'red' },
    { id: 'PO-04', name: 'Pragati Maidan Post Office', pincode: '110002', distance: '2.5 km', activeCounters: 5, queueDepth: 8, waitTime: '4 mins', status: 'Optimal', color: 'green' }
  ]
};

// Initial Fallback Counters
export const INITIAL_COUNTERS = [
  {
    id: 1,
    code: 'C-01',
    name: 'Counter 1 - Speed Post & Domestic Mail',
    nameHi: 'काउंटर 1 - स्पीड पोस्ट एवं डाक सेवा',
    category: 'mail',
    service: 'Speed Post / Register / Parcel Booking',
    operatorName: 'Rameshwar Dayal (PA)',
    operatorPresent: true,
    idleDurationSec: 0,
    status: 'idle',
    servingToken: 'None',
    servingCustomerDwellSec: 0,
    servedCountToday: 0,
    queueCount: 0,
    avgServiceTimeSec: 180,
    slaThresholdSec: 420
  },
  {
    id: 2,
    code: 'C-02',
    name: 'Counter 2 - Express Parcel & E-Commerce COD',
    nameHi: 'काउंटर 2 - पार्सल एवं ई-कॉमर्स बुकिंग',
    category: 'parcel',
    service: 'Business Parcel, COD & Bulk Mails',
    operatorName: 'Priyanka Sharma (PA)',
    operatorPresent: true,
    idleDurationSec: 0,
    status: 'idle',
    servingToken: 'None',
    servingCustomerDwellSec: 0,
    servedCountToday: 0,
    queueCount: 0,
    avgServiceTimeSec: 240,
    slaThresholdSec: 480
  },
  {
    id: 3,
    code: 'C-03',
    name: 'Counter 3 - POSB Banking & IPPB Financials',
    nameHi: 'काउंटर 3 - डाकघर बचत बैंक एवं IPPB',
    category: 'banking',
    service: 'Savings Bank, RD, TD, SSA, IPPB & Pension',
    operatorName: 'Virender Nath (Sr. PA)',
    operatorPresent: true,
    idleDurationSec: 0,
    status: 'idle',
    servingToken: 'None',
    servingCustomerDwellSec: 0,
    servedCountToday: 0,
    queueCount: 0,
    avgServiceTimeSec: 320,
    slaThresholdSec: 600
  },
  {
    id: 4,
    code: 'C-04',
    name: 'Counter 4 - Aadhaar, PLI & Citizen Services',
    nameHi: 'काउंटर 4 - आधार, बीमा एवं नागरिक सेवाएं',
    category: 'citizen',
    service: 'Aadhaar Enrolment/Update, PLI/RPLI, Jeevan Pramaan',
    operatorName: 'Anita Kumari (PA)',
    operatorPresent: true,
    idleDurationSec: 0,
    status: 'idle',
    servingToken: 'None',
    servingCustomerDwellSec: 0,
    servedCountToday: 0,
    queueCount: 0,
    avgServiceTimeSec: 360,
    slaThresholdSec: 600
  }
];

export const INITIAL_TOKENS = [];

export const INITIAL_ALERTS = [
  {
    id: 1,
    severity: 'info',
    title: 'System Online — Fresh Shift Ready',
    description: 'All 4 service counters are active and ready for citizen intake. Operators on duty.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    counterId: null,
    suggestedAction: 'Standard monitoring active.'
  }
];

export const TRANSLATIONS = {
  en: {
    appTitle: "DakDrishti",
    subTitle: "Measurement & Monitoring of Post Office Counter Services",
    deptOfPosts: "Department of Posts",
    ministryOfCom: "Ministry of Communications, Govt. of India",
    selectYourRole: "Select Your Role",
    iAmCitizen: "I am a Citizen / Customer",
    iAmEmployee: "I am an Employee / Staff",
    citizenRoleDesc: "Book E-Tokens, check queue sizes & leave feedback",
    employeeRoleDesc: "Access AI Edge Vision, digital twin & command center",
    citizenPortal: "Citizen Self-Service Portal",
    employeeConsole: "Employee Console",
    staffId: "Staff ID / Username",
    password: "Security Password / PIN",
    citizenName: "Your Full Name",
    logout: "Logout 🚪",
    welcome: "Welcome",
    digitalTwin: "Digital Twin & Floorplan",
    visionLive: "AI Vision & CCTV HUD",
    citizenAccess: "Citizen Access & E-Tokens",
    multiTier: "Multi-Tier Hierarchy Command",
    predictiveAnalytics: "Predictive Analytics & Reports",
    startFreshShift: "Start Fresh Shift (Reset)",
    adminTierView: "ADMIN TIER VIEW:",
    mysqlStatus: "MySQL DB Sync",
    edgeAiOnline: "EDGE AI ONLINE",
    selectRole: "Select Portal Entrance Role",
    citizenMobile: "Mobile Number",
    enterCitizenPortal: "Continue to Verification ➔",
    loginOperatorConsole: "Continue to Verification ➔",
    accessAlert: "Unauthorized access is prohibited and logged.",
    exitPortal: "Exit Portal 🚪",
    
    // Token generator form
    instantTokenGen: "Instant E-Token Generator",
    tokenGenDesc: "Get queue pass on your mobile with live wait time and counter guidance",
    liveKiosk: "Live Kiosk",
    serviceCategoryReq: "Service Category Required *",
    mailOption: "Speed Post, Registered Post & Letters",
    parcelOption: "Express Parcel & E-Commerce COD",
    bankingOption: "POSB Savings Bank, TD, RD, IPPB & Pension",
    citizenOption: "Aadhaar Update, PLI Insurance & Jeevan Pramaan",
    citizenNameLabel: "Citizen Name",
    mobileLabel: "Mobile Number (for live SMS updates)",
    priorityLabel: "⚡ Senior Citizen (60+ yrs) / Divyangjan (PwD) / Expectant Mother (Priority Routing)",
    priorityDesc: "Priority tokens are automatically fast-tracked by AI load rebalancer in adherence to DoP Citizen Charter.",
    generateTokenPass: "🎫 Generate E-Token Pass",
    
    // Token pass card
    dopBanner: "Department of Posts • भारत डाक",
    priorityPass: "⚡ PRIORITY PASS",
    standardToken: "STANDARD TOKEN",
    assignedCounter: "Assigned Counter",
    queuePosition: "Queue Position",
    estWaitTime: "Estimated Wait Time",
    currServing: "Current Token Serving",
    nextInTurn: "Next in Turn (Proceed to counter)",
    citizensAhead: "citizens ahead",
    minutesText: "Minutes",
    voiceAnnounceAlert: "📢 Multi-lingual voice announcement will call ready.",
    noActiveToken: "No Active E-Token",
    noActiveTokenDesc: "Fill the form on the left to generate your virtual token pass. You'll receive live audio and visual notifications when your turn arrives."
  },
  hi: {
    appTitle: "डाक सेवा दृष्टि",
    subTitle: "डाकघर काउंटर सेवाओं का मापन एवं निगरानी प्रणाली",
    deptOfPosts: "डाक विभाग",
    ministryOfCom: "संचार मंत्रालय, भारत सरकार",
    selectYourRole: "अपनी भूमिका चुनें",
    iAmCitizen: "मैं एक नागरिक / ग्राहक हूँ",
    iAmEmployee: "मैं एक कर्मचारी / स्टाफ हूँ",
    citizenRoleDesc: "ई-टोकन बुक करें, कतार आकार जांचें और फीडबैक दें",
    employeeRoleDesc: "एआई एज विजन, डिजिटल ट्विन और कमांड सेंटर तक पहुंचें",
    citizenPortal: "नागरिक स्व-सेवा पोर्टल",
    employeeConsole: "कर्मचारी कंसोल",
    staffId: "कर्मचारी आईडी / उपयोगकर्ता नाम",
    password: "सुरक्षा पासवर्ड / पिन",
    citizenName: "आपका पूरा नाम",
    citizenMobile: "मोबाइल नंबर",
    enterCitizenPortal: "सत्यापन के लिए आगे बढ़ें ➔",
    loginOperatorConsole: "सत्यापन के लिए आगे बढ़ें ➔",
    accessAlert: "अनधिकृत पहुंच निषिद्ध और लॉग की गई है।",
    exitPortal: "पोर्टल से बाहर निकलें 🚪",
    logout: "लॉगआउट 🚪",
    welcome: "स्वागत हे",
    digitalTwin: "डिजिटल ट्विन एवं फ्लोरप्लान",
    visionLive: "एआई विजन एवं सीसीटीवी हड",
    citizenAccess: "नागरिक पहुंच एवं ई-टोकन",
    multiTier: "बहु-स्तरीय पदानुक्रम कमांड",
    predictiveAnalytics: "भविष्य कहनेवाला विश्लेषण एवं रिपोर्ट",
    startFreshShift: "नई पाली शुरू करें (रीसेट)",
    adminTierView: "प्रशासक श्रेणी दृश्य:",
    mysqlStatus: "माईएसक्यूएल डेटाबेस सिंक",
    edgeAiOnline: "एज एआई ऑनलाइन",
    selectRole: "पोर्टल प्रवेश भूमिका का चयन करें",
    
    // Token generator form
    instantTokenGen: "त्वरित ई-टोकन जनरेटर",
    tokenGenDesc: "लाइव प्रतीक्षा समय और काउंटर मार्गदर्शन के साथ अपने मोबाइल पर कतार पास प्राप्त करें",
    liveKiosk: "लाइव कियोस्क",
    serviceCategoryReq: "आवश्यक सेवा श्रेणी *",
    mailOption: "स्पीड पोस्ट, पंजीकृत पोस्ट और पत्र",
    parcelOption: "एक्सप्रेस पार्सल और ई-कॉमर्स सीओडी",
    bankingOption: "डाकघर बचत बैंक, टीडी, आरडी, आईपीपीबी और पेंशन",
    citizenOption: "आधार अपडेट, पीएलआई बीमा और जीवन प्रमाण",
    citizenNameLabel: "नागरिक का नाम",
    mobileLabel: "मोबाइल नंबर (लाइव एसएमएस अपडेट के लिए)",
    priorityLabel: "⚡ वरिष्ठ नागरिक (60+ वर्ष) / दिव्यांगजन (PwD) / गर्भवती महिला (प्राथमिकता मार्ग)",
    priorityDesc: "डाक विभाग नागरिक चार्टर के अनुपालन में एआई लोड रीबैलेंसर द्वारा प्राथमिकता टोकन स्वचालित रूप से फास्ट-ट्रैक किए जाते हैं।",
    generateTokenPass: "🎫 ई-टोकन पास उत्पन्न करें",
    
    // Token pass card
    dopBanner: "डाक विभाग • भारत डाक",
    priorityPass: "⚡ प्राथमिकता पास",
    standardToken: "सामान्य टोकन",
    assignedCounter: "आवंटित काउंटर",
    queuePosition: "कतार में स्थिति",
    estWaitTime: "अनुमानित प्रतीक्षा समय",
    currServing: "वर्तमान में सेवारत टोकन",
    nextInTurn: "बारी आ गई है (काउंटर पर जाएं)",
    citizensAhead: "नागरिक आगे हैं",
    minutesText: "मिनट",
    voiceAnnounceAlert: "📢 तैयार होने पर बहुभाषी आवाज घोषणा बुलाई जाएगी।",
    noActiveToken: "कोई सक्रिय ई-टोकन नहीं",
    noActiveTokenDesc: "अपना वर्चुअल टोकन पास उत्पन्न करने के लिए बाईं ओर फॉर्म भरें। आपकी बारी आने पर आपको लाइव ऑडियो और विजुअल सूचनाएं प्राप्त होंगी।"
  }
};

class AppStore {
  constructor() {
    this.currentTier = 'tier-1';
    this.currentOffice = HIERARCHY_DATA.hpos[1];
    this.counters = JSON.parse(JSON.stringify(INITIAL_COUNTERS));
    this.tokens = JSON.parse(JSON.stringify(INITIAL_TOKENS));
    this.alerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    this.userToken = null;
    this.userRole = null; // 'employee' | 'customer' | null
    this.theme = 'light';
    this.language = 'en'; // 'en' | 'hi'
    this.activeCctvCam = 1;
    this.mysqlConnected = false;
    this.listeners = [];

    // Sync from MySQL server on startup
    this.syncFromBackend();
  }

  login(role) {
    this.userRole = role;
    this.notify('LOGIN_STATE_CHANGED', role);
  }

  logout() {
    this.userRole = null;
    this.notify('LOGIN_STATE_CHANGED', null);
  }

  setLanguage(lang) {
    this.language = lang;
    this.notify('LANGUAGE_CHANGED', lang);
  }

  t(key) {
    return TRANSLATIONS[this.language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(eventType, data) {
    this.listeners.forEach(fn => fn(eventType, data, this));
  }

  setTier(tier) {
    this.currentTier = tier;
    this.notify('TIER_CHANGED', tier);
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.notify('THEME_CHANGED', theme);
  }

  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  async syncFromBackend() {
    try {
      const resHealth = await fetch('/api/health');
      if (resHealth.ok) {
        const hData = await resHealth.json();
        this.mysqlConnected = hData.mysql_connected;
        this.notify('HEALTH_UPDATED', hData);
      }

      const resCounters = await fetch('/api/counters');
      if (resCounters.ok) {
        const cData = await resCounters.json();
        if (cData.data && cData.data.length > 0) {
          // Merge while keeping local live timers
          cData.data.forEach(srvC => {
            const local = this.counters.find(c => c.id === srvC.id);
            if (local) {
              local.queueCount = srvC.queueCount ?? local.queueCount;
              local.servedCountToday = srvC.servedCountToday ?? local.servedCountToday;
              local.status = srvC.status ?? local.status;
              local.operatorPresent = srvC.operatorPresent ?? local.operatorPresent;
              local.operatorName = srvC.operatorName ?? local.operatorName;
              local.category = srvC.category ?? local.category;
              local.name = srvC.name ?? local.name;
              local.nameHi = srvC.nameHi ?? local.nameHi;
              local.service = srvC.service ?? local.service;
              if (srvC.servingToken) local.servingToken = srvC.servingToken;
            }
          });
        }
      }

      const resTokens = await fetch('/api/tokens');
      if (resTokens.ok) {
        const tData = await resTokens.json();
        if (tData.data && tData.data.length > 0) {
          this.tokens = tData.data;
        }
      }

      const resAlerts = await fetch('/api/alerts');
      if (resAlerts.ok) {
        const aData = await resAlerts.json();
        if (aData.data && aData.data.length > 0) {
          this.alerts = aData.data;
        }
      }
    } catch (e) {
      console.log('Backend sync offline, operating in resilient client mode:', e);
    }
  }

  // Token Operations (Persisted to MySQL)
  generateToken({ category, citizenName, mobile, priority = false, serviceName = '' }) {
    const prefixes = { mail: 'A', parcel: 'B', banking: 'C', citizen: 'D' };
    const prefix = prefixes[category] || 'E';
    const count = this.tokens.filter(t => t.category === category).length + 1;
    const num = String(count + 100).padStart(3, '0');
    const tokenId = `${prefix}-${num}`;

    const suitableCounters = this.counters.filter(c => c.category === category && c.status !== 'closed');
    const assignedCounter = suitableCounters[0] || this.counters[0];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newToken = {
      id: tokenId,
      category,
      serviceName,
      counterId: assignedCounter.id,
      counterCode: assignedCounter.code,
      citizenName: citizenName || 'Citizen User',
      mobile: mobile || '9876543210',
      status: 'WAITING',
      priority,
      waitSec: 0,
      time: timeStr
    };

    if (priority) {
      const firstWaitingIdx = this.tokens.findIndex(t => t.counterId === assignedCounter.id && t.status === 'WAITING');
      if (firstWaitingIdx !== -1) {
        this.tokens.splice(firstWaitingIdx, 0, newToken);
      } else {
        this.tokens.push(newToken);
      }
    } else {
      this.tokens.push(newToken);
    }

    assignedCounter.queueCount += 1;
    this.userToken = newToken;

    // Send to MySQL backend asynchronously
    fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newToken)
    }).catch(err => console.log('MySQL Token post error:', err));

    this.notify('TOKEN_GENERATED', newToken);
    return newToken;
  }

  callNextToken(counterId) {
    const counter = this.counters.find(c => c.id === counterId);
    if (!counter) return null;

    const currentServing = this.tokens.find(t => t.counterId === counterId && t.status === 'SERVING');
    if (currentServing) {
      currentServing.status = 'COMPLETED';
      counter.servedCountToday += 1;
    }

    const nextWaiting = this.tokens.find(t => t.counterId === counterId && t.status === 'WAITING');
    if (nextWaiting) {
      nextWaiting.status = 'SERVING';
      nextWaiting.serviceSec = 0;
      counter.servingToken = nextWaiting.id;
      counter.servingCustomerDwellSec = 0;
      counter.queueCount = Math.max(0, counter.queueCount - 1);
      counter.status = counter.queueCount > 6 ? 'congested' : 'serving';

      fetch('/api/tokens/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId, tokenId: nextWaiting.id })
      }).catch(err => console.log('MySQL Token call error:', err));

      this.notify('TOKEN_CALLED', { counter, token: nextWaiting });
      return nextWaiting;
    } else {
      counter.servingToken = 'None';
      counter.status = 'idle';

      fetch('/api/tokens/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId, tokenId: null })
      }).catch(err => console.log('MySQL Token idle error:', err));

      this.notify('COUNTER_IDLE', { counter });
      return null;
    }
  }

  completeService(counterId) {
    const counter = this.counters.find(c => c.id === counterId);
    if (counter) {
      // Mark current SERVING token as COMPLETED in store.tokens[]
      const servingTok = this.tokens.find(t => t.counterId === counterId && t.status === 'SERVING');
      if (servingTok) {
        servingTok.status = 'COMPLETED';
        servingTok.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      counter.servedCountToday = (counter.servedCountToday || 0) + 1;
      counter.servingToken = 'None';
      counter.status = 'idle';
      counter.servingCustomerDwellSec = 0;

      fetch('/api/tokens/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId })
      }).catch(() => {});

      this.notify('SERVICE_COMPLETED', counter);
    }
  }

  rebalanceCounters(sourceCounterId, targetCategoryId) {
    const counter = this.counters.find(c => c.id === sourceCounterId);
    if (!counter) return;

    const oldService = counter.service;
    if (targetCategoryId === 'banking') {
      counter.category = 'banking';
      counter.service = 'POSB Banking & Financial Overflow Desk';
    } else if (targetCategoryId === 'mail') {
      counter.category = 'mail';
      counter.service = 'Speed Post & Express Parcel Overflow Desk';
    } else if (targetCategoryId === 'citizen') {
      counter.category = 'citizen';
      counter.service = 'Aadhaar & Citizen Services Overflow Desk';
    }

    this.addAlert({
      severity: 'info',
      title: `Counter ${counter.code} Dynamically Rebalanced`,
      description: `Reassigned from "${oldService}" to support high-demand "${counter.service}".`,
      counterId: counter.id,
      suggestedAction: 'Monitor wait-time reduction.'
    });

    fetch('/api/counters/rebalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counterId: sourceCounterId, category: targetCategoryId })
    }).catch(err => console.log('MySQL Rebalance post error:', err));

    this.notify('COUNTERS_REBALANCED', counter);
  }

  addAlert(alertData) {
    const newAlert = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...alertData
    };
    this.alerts.unshift(newAlert);
    if (this.alerts.length > 20) this.alerts.pop();

    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert)
    }).catch(err => console.log('MySQL Alert post error:', err));

    this.notify('ALERT_ADDED', newAlert);
    return newAlert;
  }

  resetShift() {
    this.counters.forEach(c => {
      c.status = 'idle';
      c.servingToken = 'None';
      c.queueCount = 0;
      c.servingCustomerDwellSec = 0;
      c.servedCountToday = 0;
      c.operatorPresent = true;
      c.idleDurationSec = 0;
    });
    this.tokens = [];
    this.userToken = null;
    this.alerts = [
      {
        id: 1,
        severity: 'info',
        title: 'Fresh Post Office Shift Initiated',
        description: 'All 4 service counters reset and ready for citizen intake.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        counterId: null,
        suggestedAction: 'Operators on duty.'
      }
    ];

    fetch('/api/reset', { method: 'POST' }).catch(() => {});
    this.notify('SHIFT_RESET', null);
  }

  tickSimulation() {
    this.counters.forEach(c => {
      if (c.status === 'serving' && c.operatorPresent) {
        c.servingCustomerDwellSec += 1;
      } else if (!c.operatorPresent) {
        c.idleDurationSec += 1;
        if (c.idleDurationSec === 180 && c.queueCount > 0) {
          this.addAlert({
            severity: 'high',
            title: `⚠️ Unattended Counter Alert: ${c.code}`,
            description: `Counter ${c.code} (${c.name}) has been unmanned for 3+ minutes while ${c.queueCount} citizens wait.`,
            counterId: c.id,
            suggestedAction: 'Notify Duty Postmaster immediately.'
          });
        }
      }
    });

    this.tokens.forEach(t => {
      if (t.status === 'WAITING') {
        t.waitSec += 1;
      } else if (t.status === 'SERVING') {
        t.serviceSec = (t.serviceSec || 0) + 1;
      }
    });

    this.notify('TICK', null);
  }
}

export const store = new AppStore();
