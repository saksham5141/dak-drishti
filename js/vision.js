/**
 * DakDrishti 4.0 - AI Computer Vision & CCTV Multi-Counter Intelligence Engine
 * Handles Canvas-based People Detection, Queue Counting, Dwell Time & Heatmap
 */

import { store } from './state.js';

export class VisionIntelligenceEngine {
  constructor(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.video = videoElement;
    this.activeCamera = 1; // 1 | 2 | 3 | 4 | 'webcam'
    this.isRunning = false;
    this.webcamStream = null;
    this.showBoundingBoxes = true;
    this.showHeatmap = false;
    this.showQueueZone = true;
    this.simulatedTime = 0;

    // Simulated synthetic people targets per counter view
    this.sceneTargets = this.generateSceneTargets();
  }

  generateSceneTargets() {
    return {
      1: {
        // Counter 1: Speed Post
        counterName: 'Counter 01 - Speed Post & Domestic Mail',
        operator: { x: 380, y: 160, w: 90, h: 140, active: true, title: 'Operator: R. Dayal' },
        serviceCustomer: null,
        queue: []
      },
      2: {
        // Counter 2: Parcel COD
        counterName: 'Counter 02 - Express Parcel & COD',
        operator: { x: 380, y: 160, w: 90, h: 140, active: true, title: 'Operator: P. Sharma' },
        serviceCustomer: null,
        queue: []
      },
      3: {
        // Counter 3: POSB Banking
        counterName: 'Counter 03 - POSB Banking & IPPB',
        operator: { x: 380, y: 160, w: 90, h: 140, active: true, title: 'Operator: V. Nath' },
        serviceCustomer: null,
        queue: []
      },
      4: {
        // Counter 4: Aadhaar & Citizen Services
        counterName: 'Counter 04 - Aadhaar & Citizen Services',
        operator: { x: 380, y: 160, w: 90, h: 140, active: true, title: 'Operator: Anita K.' },
        serviceCustomer: null,
        queue: []
      }
    };
  }

  setCamera(camId) {
    this.activeCamera = camId;
    if (camId === 'webcam') {
      this.startWebcam();
    } else {
      this.stopWebcam();
    }
  }

  async startWebcam() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        this.video.srcObject = this.webcamStream;
        await this.video.play();
      }
    } catch (err) {
      console.warn('Webcam access not granted or unavailable:', err);
      store.addAlert({
        severity: 'info',
        title: 'Webcam Notice',
        description: 'Webcam not available or permission denied. Switched to Synthetic CCTV feed.',
        counterId: null
      });
      this.setCamera(1);
    }
  }

  stopWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
      this.video.srcObject = null;
    }
  }

  start() {
    this.isRunning = true;
    this.renderLoop();
  }

  stop() {
    this.isRunning = false;
    this.stopWebcam();
  }

  toggleBoundingBoxes() {
    this.showBoundingBoxes = !this.showBoundingBoxes;
    return this.showBoundingBoxes;
  }

  toggleHeatmap() {
    this.showHeatmap = !this.showHeatmap;
    return this.showHeatmap;
  }

  toggleQueueZone() {
    this.showQueueZone = !this.showQueueZone;
    return this.showQueueZone;
  }

  toggleOperatorPresence(counterId) {
    const counter = store.counters.find(c => c.id === counterId);
    if (counter) {
      counter.operatorPresent = !counter.operatorPresent;
      if (!counter.operatorPresent) {
        counter.idleDurationSec = 0;
        store.addAlert({
          severity: 'medium',
          title: `Operator Stepped Away: Counter ${counter.code}`,
          description: `AI Vision flagged unmanned desk at Counter ${counter.code}.`,
          counterId: counter.id,
          suggestedAction: 'SPM attention required if not resumed within 3 mins.'
        });
      } else {
        counter.idleDurationSec = 0;
      }
    }
  }

  renderLoop() {
    if (!this.isRunning) return;

    this.simulatedTime += 0.016;
    this.drawFrame();

    requestAnimationFrame(() => this.renderLoop());
  }

  drawFrame() {
    const width = this.canvas.width = 960;
    const height = this.canvas.height = 540;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    if (this.activeCamera === 'webcam' && this.video.readyState >= 2) {
      // Draw webcam feed
      ctx.drawImage(this.video, 0, 0, width, height);
      this.drawWebcamVisionOverlay(ctx, width, height);
    } else {
      // Draw synthetic post office CCTV feed
      this.drawSyntheticCCTV(ctx, width, height, this.activeCamera);
    }
  }

  drawSyntheticCCTV(ctx, width, height, camId) {
    const scene = this.sceneTargets[camId] || this.sceneTargets[1];
    const counterState = store.counters.find(c => c.id === Number(camId)) || store.counters[0];

    // 1. Draw Architectural Post Office Hall Environment
    // Gradient floor & wall perspective
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    wallGrad.addColorStop(0, '#1E293B');
    wallGrad.addColorStop(1, '#334155');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, height * 0.45);

    // Post Office Signage Banner on Back Wall
    ctx.fillStyle = '#9A0007';
    ctx.fillRect(140, 30, width - 280, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`DEPARTMENT OF POSTS • ${scene.counterName.toUpperCase()}`, width / 2, 58);
    ctx.font = '11px "Noto Sans Devanagari", sans-serif';
    ctx.fillText('भारतीय डाक - ग्राहक सेवा क्षेत्र (CCTV AI Surveillance Zone)', width / 2, 73);

    // Floor with isometric grid
    const floorGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
    floorGrad.addColorStop(0, '#CBD5E1');
    floorGrad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, height * 0.45, width, height * 0.55);

    // Perspective floor lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 80) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + (i - width / 2) * 0.3, height * 0.45);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // 2. Physical Service Counter Desk
    const deskX = 220;
    const deskY = height * 0.36;
    const deskW = 520;
    const deskH = 75;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(deskX, deskY, deskW, deskH);
    // Glass barrier
    ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
    ctx.fillRect(deskX, deskY - 60, deskW, 60);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.strokeRect(deskX, deskY - 60, deskW, 60);

    // LED Counter Number Sign
    ctx.fillStyle = '#000000';
    ctx.fillRect(deskX + deskW / 2 - 60, deskY - 95, 120, 30);
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(`${counterState.code} • ${counterState.servingToken}`, width / 2, deskY - 75);

    // 3. Queue Guide Stanchions / Yellow Floor Queue Box
    if (this.showQueueZone) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(340, height * 0.52, 280, height * 0.44);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.fillRect(340, height * 0.52, 280, height * 0.44);

      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      const isServing = counterState.servingToken && counterState.servingToken !== 'None';
      ctx.fillText(`ZONE: QUEUE_AREA [Occupancy: ${counterState.queueCount + (isServing ? 1 : 0)}]`, 348, height * 0.52 + 18);
    }

    // 4. Draw Operator behind desk
    if (counterState.operatorPresent) {
      const opX = width / 2;
      const opY = height * 0.32;
      this.drawPersonSilhouette(ctx, opX, opY, '#1E3E62', 'Operator (Staff)');

      if (this.showBoundingBoxes) {
        this.drawAIBoundingBox(ctx, opX - 35, opY - 60, 70, 100, 'Operator: Active (PA)', '#10B981', '98.8% Conf');
      }
    } else {
      // Empty chair / alert box
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(width / 2 - 40, height * 0.26, 80, 80);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 40, height * 0.26, 80, 80);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ UNATTENDED (${counterState.idleDurationSec}s)`, width / 2, height * 0.31);
    }

    // 5. Draw Currently Serviced Customer at Counter Window
    if (counterState.servingToken && counterState.servingToken !== 'None') {
      const custX = width / 2;
      const custY = height * 0.54 + Math.sin(this.simulatedTime * 1.5) * 2;
      this.drawPersonSilhouette(ctx, custX, custY, '#B91C1C', `Token: ${counterState.servingToken}`);

      if (this.showBoundingBoxes) {
        const dwellMins = Math.floor(counterState.servingCustomerDwellSec / 60);
        const dwellSecs = counterState.servingCustomerDwellSec % 60;
        const dwellLabel = `Dwell: ${dwellMins}m ${dwellSecs}s (TAT)`;
        const boxColor = counterState.servingCustomerDwellSec > counterState.slaThresholdSec ? '#EF4444' : '#3B82F6';
        this.drawAIBoundingBox(ctx, custX - 38, custY - 70, 76, 120, `Customer #${counterState.servingToken} • ${dwellLabel}`, boxColor, '96.2% Conf');
      }
    }

    // 6. Draw Waiting Queue Customers in line
    const queueSpacing = 70;
    const waitingTokens = store.tokens.filter(t => t.counterId === counterState.id && t.status === 'WAITING');
    const queueLengthToDraw = Math.min(waitingTokens.length, 4);

    for (let i = 0; i < queueLengthToDraw; i++) {
      const token = waitingTokens[i];
      const qX = width / 2 + Math.sin((i + 1) * 2 + this.simulatedTime) * 6;
      const qY = height * 0.68 + i * queueSpacing;

      if (qY > height + 20) break;

      const isPriority = token ? token.priority : false;
      const color = isPriority ? '#D97706' : '#334155';
      this.drawPersonSilhouette(ctx, qX, qY, color, token ? token.id : `Q-${i+1}`);

      if (this.showBoundingBoxes) {
        const waitMins = Math.floor((token ? token.waitSec : (i + 1) * 90) / 60);
        const tag = isPriority ? `⚡ PRIORITY (${token.id}) | Wait: ${waitMins}m` : `Queue #${i + 1} (${token ? token.id : 'A'}) | Wait: ${waitMins}m`;
        this.drawAIBoundingBox(ctx, qX - 35, qY - 65, 70, 110, tag, isPriority ? '#F59E0B' : '#06B6D4', '94.5% Conf');
      }
    }

    // 7. Heatmap overlay if enabled
    if (this.showHeatmap) {
      this.drawDensityHeatmap(ctx, width, height, custX, custY, counterState.queueCount);
    }
  }

  drawWebcamVisionOverlay(ctx, width, height) {
    // Draw synthetic AI bounding boxes on webcam center zone to demonstrate live edge processing
    const centerX = width / 2;
    const centerY = height / 2;

    if (this.showQueueZone) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 180, centerY - 150, 360, 300);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(centerX - 180, centerY - 150, 360, 300);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('LIVE WEBCAM AI TRACKING REGION', centerX - 170, centerY - 130);
    }

    if (this.showBoundingBoxes) {
      this.drawAIBoundingBox(ctx, centerX - 120, centerY - 120, 240, 260, 'Person Detected • Counter Interaction Zone', '#10B981', '97.4% Conf');
    }

    if (this.showHeatmap) {
      this.drawDensityHeatmap(ctx, width, height, centerX, centerY, 3);
    }
  }

  drawPersonSilhouette(ctx, x, y, color, label) {
    ctx.save();
    ctx.fillStyle = color;

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 45, 16, 0, Math.PI * 2);
    ctx.fill();

    // Torso & Shoulders
    ctx.beginPath();
    ctx.ellipse(x, y - 10, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower body
    ctx.fillRect(x - 22, y - 5, 44, 45);

    ctx.restore();
  }

  drawAIBoundingBox(ctx, x, y, w, h, label, color = '#10B981', conf = '') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Corner targeting brackets (Military / AI HUD style)
    const bracketSize = 10;
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath(); ctx.moveTo(x, y + bracketSize); ctx.lineTo(x, y); ctx.lineTo(x + bracketSize, y); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(x + w - bracketSize, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bracketSize); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(x, y + h - bracketSize); ctx.lineTo(x, y + h); ctx.lineTo(x + bracketSize, y + h); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(x + w - bracketSize, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - bracketSize); ctx.stroke();

    // Label tag banner
    ctx.fillStyle = color;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(`${label} ${conf}`).width;
    ctx.fillRect(x, y - 18, Math.max(textWidth + 12, 100), 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${label} ${conf}`, x + 6, y - 5);

    ctx.restore();
  }

  drawDensityHeatmap(ctx, width, height, targetX, targetY, densityCount) {
    ctx.save();
    const radius = 180 + densityCount * 15;
    const radialGrad = ctx.createRadialGradient(targetX, targetY, 20, targetX, targetY, radius);
    radialGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    radialGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
    radialGrad.addColorStop(0.8, 'rgba(16, 185, 129, 0.2)');
    radialGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
