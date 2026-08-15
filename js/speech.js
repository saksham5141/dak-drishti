/**
 * DakDrishti 4.0 - Multi-lingual Audio Chime & Speech Synthesis Engine
 * Generates Post Office Hall announcements in Hindi & English
 * Department of Posts, Ministry of Communications, Govt. of India
 */

class AudioAnnouncementService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.audioCtx = null;
    this.voices = [];
    this.selectedVoiceURI = localStorage.getItem('dak_speech_voice_uri') || null;
    this.voicePitch = parseFloat(localStorage.getItem('dak_speech_pitch')) || 1.0;
    this.voiceRate = parseFloat(localStorage.getItem('dak_speech_rate')) || 0.88;

    if (this.synth) {
      this.loadVoices();
      if (typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices() || [];
    return this.voices;
  }

  getAvailableHindiVoices() {
    const voices = this.voices.length > 0 ? this.voices : (this.synth ? this.synth.getVoices() : []);
    return voices.filter(v => 
      v.lang.toLowerCase().includes('hi') || 
      v.lang.toLowerCase().includes('en-in') || 
      v.name.toLowerCase().includes('hindi') || 
      v.name.toLowerCase().includes('kalpana') ||
      v.name.toLowerCase().includes('hemant') ||
      v.name.toLowerCase().includes('swara') ||
      v.name.toLowerCase().includes('madhur') ||
      v.name.toLowerCase().includes('india')
    );
  }

  setVoice(voiceURI) {
    this.selectedVoiceURI = voiceURI;
    if (voiceURI) {
      localStorage.setItem('dak_speech_voice_uri', voiceURI);
    } else {
      localStorage.removeItem('dak_speech_voice_uri');
    }
  }

  setPitch(pitch) {
    this.voicePitch = pitch;
    localStorage.setItem('dak_speech_pitch', pitch);
  }

  setRate(rate) {
    this.voiceRate = rate;
    localStorage.setItem('dak_speech_rate', rate);
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play pleasant 2-tone chime (like airport/metro/post office token bell)
  playChime() {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Tone 1 (High note)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2 (Harmonic note)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.15); // A5
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Web Audio chime not supported or blocked:', e);
    }
  }

  // Helper to convert token string into phonetically clear Hindi text
  getHindiTokenPhrasing(tokenNum, counterNum) {
    const prefixMap = {
      'A': 'ए',
      'B': 'बी',
      'C': 'सी',
      'D': 'डी',
      'E': 'ई',
      'F': 'एफ'
    };

    const digitHindiMap = {
      '0': 'शून्य', '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार',
      '5': 'पांच', '6': 'छह', '7': 'सात', '8': 'आठ', '9': 'नौ'
    };

    const parts = String(tokenNum).split('-');
    const prefixChar = parts[0] ? parts[0].toUpperCase() : '';
    const prefixHindi = prefixMap[prefixChar] || prefixChar;
    const numDigits = parts[1] || '';

    let numHindi = '';
    const numInt = parseInt(numDigits, 10);
    if (!isNaN(numInt) && numInt >= 100 && numInt < 200) {
      const rem = numInt % 100;
      if (rem === 0) {
        numHindi = 'एक सौ';
      } else {
        const remDigits = String(rem).padStart(2, '0');
        const remHindi = remDigits.split('').map(d => digitHindiMap[d] || d).join(' ');
        numHindi = `एक सौ ${remHindi}`;
      }
    } else {
      numHindi = numDigits.split('').map(d => digitHindiMap[d] || d).join(' ');
    }

    const counterHindi = digitHindiMap[String(counterNum)] || counterNum;

    return {
      textDevanagari: `कृपया ध्यान दें। टोकन नंबर ${prefixHindi} ${numHindi}, काउंटर नंबर ${counterHindi} पर पधारें।`,
      textPhonetic: `Kripya dhyan dein. Token number ${prefixChar} ${numDigits}, Counter number ${counterNum} par padharen.`
    };
  }

  // Speak token announcement (Hindi first, then English)
  announceToken(tokenNum, counterNum, counterCode, langMode = 'both') {
    this.playChime();

    if (!this.synth) return;

    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    // Delay speech slightly after chime plays
    setTimeout(() => {
      try {
        this.synth.cancel(); // Reset active speech queue

        const hindiData = this.getHindiTokenPhrasing(tokenNum, counterNum);
        const tokenCharsEn = tokenNum.replace('-', ' ');
        const textEn = `Attention please. Token number ${tokenCharsEn}, please proceed to Counter number ${counterNum}.`;

        const voices = this.voices.length > 0 ? this.voices : (this.synth.getVoices() || []);
        
        // Find user selected voice or auto-detect true matching Hindi voice
        let hindiVoice = null;
        if (this.selectedVoiceURI) {
          hindiVoice = voices.find(v => v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI);
        }
        if (!hindiVoice) {
          hindiVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith('hi') || 
            v.name.toLowerCase().includes('hindi') || 
            v.name.toLowerCase().includes('kalpana') ||
            v.name.toLowerCase().includes('hemant') ||
            v.name.toLowerCase().includes('swara') ||
            v.name.toLowerCase().includes('lekha')
          );
        }

        // Find best matching Indian/English voice
        const englishVoice = voices.find(v => 
          v.lang.toLowerCase().includes('en-in') || 
          (v.lang.toLowerCase().includes('en') && v.name.toLowerCase().includes('india'))
        );

        // 1. Prepare Hindi Utterance (Use Devanagari script if Hindi TTS voice exists, otherwise use phonetic Romanized Hindi)
        const isTrueHindiVoice = hindiVoice && (hindiVoice.lang.toLowerCase().includes('hi') || hindiVoice.name.toLowerCase().includes('hindi'));
        const hindiSpeechText = isTrueHindiVoice ? hindiData.textDevanagari : hindiData.textPhonetic;
        const uttHi = new SpeechSynthesisUtterance(hindiSpeechText);
        uttHi.lang = isTrueHindiVoice ? 'hi-IN' : 'en-IN';
        uttHi.rate = this.voiceRate || 0.88;
        uttHi.pitch = this.voicePitch || 1.0;
        if (hindiVoice) {
          uttHi.voice = hindiVoice;
        } else if (englishVoice) {
          uttHi.voice = englishVoice;
        }

        // 2. Prepare English Utterance
        const uttEn = new SpeechSynthesisUtterance(textEn);
        uttEn.lang = 'en-IN';
        uttEn.rate = this.voiceRate || 0.92;
        uttEn.pitch = this.voicePitch || 1.0;
        if (englishVoice) {
          uttEn.voice = englishVoice;
        }

        if (langMode === 'hi') {
          this.synth.speak(uttHi);
        } else if (langMode === 'en') {
          this.synth.speak(uttEn);
        } else {
          // Chain: Speak Hindi first, then English on completion
          uttHi.onend = () => {
            try { this.synth.speak(uttEn); } catch (e) {}
          };
          uttHi.onerror = (e) => {
            console.warn('Hindi utterance error, falling back to English:', e);
            try { this.synth.speak(uttEn); } catch (ex) {}
          };
          this.synth.speak(uttHi);
        }
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }, 400);
  }

  // Explicit Hindi Token Announcement Method
  announceTokenInHindi(tokenNum, counterNum) {
    this.announceToken(tokenNum, counterNum, `C-0${counterNum}`, 'hi');
  }
}

export const speechService = new AudioAnnouncementService();
