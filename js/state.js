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
    status: 'serving',
    servingToken: 'A-108',
    servingCustomerDwellSec: 145,
    servedCountToday: 54,
    queueCount: 6,
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
    status: 'serving',
    servingToken: 'B-204',
    servingCustomerDwellSec: 210,
    servedCountToday: 38,
    queueCount: 4,
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
    status: 'congested',
    servingToken: 'C-312',
    servingCustomerDwellSec: 390,
    servedCountToday: 62,
    queueCount: 9,
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
    status: 'serving',
    servingToken: 'D-407',
    servingCustomerDwellSec: 280,
    servedCountToday: 41,
    queueCount: 5,
    avgServiceTimeSec: 360,
    slaThresholdSec: 600
  }
];

export const INITIAL_TOKENS = [
  { id: 'A-108', category: 'mail', counterId: 1, counterCode: 'C-01', citizenName: 'Vikram Malhotra', mobile: '9871101204', status: 'SERVING', priority: false, waitSec: 240, serviceSec: 145, time: '11:15 AM' },
  { id: 'A-109', category: 'mail', counterId: 1, counterCode: 'C-01', citizenName: 'Suresh Chandra (Sr. Citizen)', mobile: '9411008831', status: 'WAITING', priority: true, waitSec: 180, time: '11:18 AM' },
  { id: 'A-110', category: 'mail', counterId: 1, counterCode: 'C-01', citizenName: 'Megha Singhal', mobile: '9911003341', status: 'WAITING', priority: false, waitSec: 120, time: '11:22 AM' },
  { id: 'B-204', category: 'parcel', counterId: 2, counterCode: 'C-02', citizenName: 'Rahul Enterprises', mobile: '9871104455', status: 'SERVING', priority: false, waitSec: 300, serviceSec: 210, time: '11:12 AM' },
  { id: 'C-312', category: 'banking', counterId: 3, counterCode: 'C-03', citizenName: 'Kailash Pati (Pensioner)', mobile: '9211007788', status: 'SERVING', priority: true, waitSec: 420, serviceSec: 390, time: '11:08 AM' },
  { id: 'D-407', category: 'citizen', counterId: 4, counterCode: 'C-04', citizenName: 'Mohd. Imran', mobile: '9611008899', status: 'SERVING', priority: false, waitSec: 310, serviceSec: 280, time: '11:14 AM' }
];

export const INITIAL_ALERTS = [
  {
    id: 1,
    severity: 'high',
    title: 'High Queue Density Alert on Banking Counter (C-03)',
    description: 'Vision detected 9 persons waiting in C-03 queue. Average wait time trending above 8.5 minutes.',
    timestamp: '11:24 AM',
    counterId: 3,
    suggestedAction: 'Activate Load Rebalancer: Assign Counter 2 to POSB queue.'
  },
  {
    id: 2,
    severity: 'medium',
    title: 'Senior Citizen Priority Queue Notice',
    description: 'Vision AI flagged Senior Citizen waiting at Counter 1 for > 3 minutes. Priority routing recommended.',
    timestamp: '11:21 AM',
    counterId: 1,
    suggestedAction: 'Fast-track Token A-109 on next call cycle.'
  },
  {
    id: 3,
    severity: 'info',
    title: 'SLA Milestone: 94.2% Optimal Service',
    description: 'Overall post office average turnaround time is currently 5.2 mins (Within target SLA of 7 mins).',
    timestamp: '11:15 AM',
    counterId: null,
    suggestedAction: 'Standard monitoring active.'
  }
];

class AppStore {
  constructor() {
    this.currentTier = 'tier-1';
    this.currentOffice = HIERARCHY_DATA.hpos[1];
    this.counters = JSON.parse(JSON.stringify(INITIAL_COUNTERS));
    this.tokens = JSON.parse(JSON.stringify(INITIAL_TOKENS));
    this.alerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    this.userToken = null;
    this.theme = 'light';
    this.activeCctvCam = 1;
    this.mysqlConnected = false;
    this.listeners = [];

    // Sync from MySQL server on startup
    this.syncFromBackend();
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
              if (srvC.servingToken) local.servingToken = srvC.servingToken;
            }
          });
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
      counter.servedCountToday += 1;
      counter.servingToken = 'None';
      counter.status = 'idle';

      fetch('/api/tokens/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId })
      }).catch(err => console.log('MySQL Token complete error:', err));

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
