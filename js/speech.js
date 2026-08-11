/**
 * DakDrishti 4.0 - Multi-lingual Audio Chime & Speech Synthesis Engine
 * Generates Post Office Hall announcements in Hindi & English
 */

class AudioAnnouncementService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.audioCtx = null;
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
      gain1.gain.setValueAtTime(0.3, now);
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
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Web Audio chime not supported or blocked:', e);
    }
  }

  // Speak token announcement
  announceToken(tokenNum, counterNum, counterCode) {
    this.playChime();

    if (!this.synth) return;

    // Small delay after chime before speaking
    setTimeout(() => {
      try {
        this.synth.cancel(); // Clear any pending speech

        // Split token characters for clear articulation (e.g., A-104 -> "ए एक सौ चार" / "A 1 0 4")
        const tokenChars = tokenNum.replace('-', ' ');

        // English Utterance
        const textEn = `Token number ${tokenChars}, please proceed to Counter number ${counterNum}`;
        const uttEn = new SpeechSynthesisUtterance(textEn);
        uttEn.lang = 'en-IN';
        uttEn.rate = 0.95;
        uttEn.pitch = 1.0;

        // Hindi Utterance
        const textHi = `टोकन नंबर ${tokenChars}, काउंटर नंबर ${counterNum} पर पधारें`;
        const uttHi = new SpeechSynthesisUtterance(textHi);
        uttHi.lang = 'hi-IN';
        uttHi.rate = 0.95;
        uttHi.pitch = 1.05;

        // Find best Hindi voice if available
        const voices = this.synth.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'));
        const englishVoice = voices.find(v => v.lang.includes('en-IN') || (v.lang.includes('en') && v.name.includes('India')));

        if (hindiVoice) uttHi.voice = hindiVoice;
        if (englishVoice) uttEn.voice = englishVoice;

        // Speak Hindi first, then English
        uttHi.onend = () => {
          this.synth.speak(uttEn);
        };

        this.synth.speak(uttHi);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }, 450);
  }
}

export const speechService = new AudioAnnouncementService();
