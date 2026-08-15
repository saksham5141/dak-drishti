/**
 * DakDrishti 4.0 - CAPTCHA Module
 * Handles Alphanumeric & Math CAPTCHA generation, Canvas rendering, Audio read-aloud & validation.
 */

export class CaptchaManager {
  constructor() {
    this.instances = new Map(); // formId -> { code, token, type }
  }

  generateCaptchaText(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous chars O, 0, I, 1
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateMathCaptcha() {
    const num1 = Math.floor(Math.random() * 15) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const isAdd = Math.random() > 0.3;
    if (isAdd) {
      return { question: `${num1} + ${num2} = ?`, answer: String(num1 + num2) };
    } else {
      const max = Math.max(num1, num2);
      const min = Math.min(num1, num2);
      return { question: `${max} - ${min} = ?`, answer: String(max - min) };
    }
  }

  async createCaptcha(formId, canvasId, options = {}) {
    const type = options.type || (Math.random() > 0.5 ? 'math' : 'text');
    let code = '';
    let displayText = '';

    if (type === 'math') {
      const mathObj = this.generateMathCaptcha();
      displayText = mathObj.question;
      code = mathObj.answer;
    } else {
      code = this.generateCaptchaText(5);
      displayText = code;
    }

    const token = 'c_' + Math.random().toString(36).substring(2, 10) + Date.now();
    this.instances.set(formId, { code, token, displayText, type });

    // Request token from backend if available
    try {
      const res = await fetch('/api/captcha');
      if (res.ok) {
        const data = await res.json();
        if (data && data.token && data.code) {
          code = data.code;
          token = data.token;
          displayText = data.displayText || code;
          this.instances.set(formId, { code, token, displayText, type: data.type || type });
        }
      }
    } catch (e) {
      // Offline fallback: client generated captcha token
    }

    this.renderCanvas(canvasId, displayText);
    return token;
  }

  renderCanvas(canvasId, text) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 180;
    const height = canvas.height || 48;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Random noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 200)}, 0.35)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render characters with distortion & rotation
    const charWidth = width / (text.length + 1);
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px "Courier New", monospace';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.save();
      const x = (i + 0.6) * charWidth;
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 0.4 - 0.2);

      ctx.translate(x, y);
      ctx.rotate(angle);

      // Color variation
      const colors = ['#B71C1C', '#0D47A1', '#1B5E20', '#4A148C', '#E65100', '#263238'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }

  speakCaptcha(formId) {
    const instance = this.instances.get(formId);
    if (!instance || !instance.code) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      let speakText = '';
      if (instance.type === 'math') {
        speakText = instance.displayText.replace('?', '').replace('=', 'equals');
      } else {
        speakText = 'CAPTCHA code is: ' + instance.code.split('').join(' ');
      }

      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`CAPTCHA code: ${instance.code}`);
    }
  }

  getCaptchaData(formId) {
    return this.instances.get(formId) || null;
  }

  validateCaptcha(formId, userInput) {
    const instance = this.instances.get(formId);
    if (!instance) return false;
    if (!userInput) return false;
    return userInput.trim().toUpperCase() === instance.code.toUpperCase();
  }
}

export const captchaManager = new CaptchaManager();
