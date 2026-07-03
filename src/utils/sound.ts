// Gerenciador de Áudio com Web Audio API em TypeScript

class SoundController {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private progressionIdx = 0;
  public isSFXEnabled = true;
  public isPlayingMusic = false;

  init() {
    if (this.ctx) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  playSFX(type: "click" | "correct" | "error" | "fanfare") {
    this.init();
    if (!this.ctx || !this.isSFXEnabled) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const t = this.ctx.currentTime;

    if (type === "click") {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === "correct") {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);
        noteOsc.type = "triangle";
        noteOsc.frequency.setValueAtTime(freq, t + idx * 0.06);
        noteGain.gain.setValueAtTime(0.06, t + idx * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.15);
        noteOsc.start(t + idx * 0.06);
        noteOsc.stop(t + idx * 0.06 + 0.2);
      });
    } else if (type === "error") {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(95, t + 0.22);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === "fanfare") {
      const chords = [329.63, 392.00, 523.25, 659.25]; // Acorde Dó maior
      chords.forEach((freq) => {
        if (!this.ctx) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);
        noteOsc.type = "sine";
        noteOsc.frequency.setValueAtTime(freq, t);
        noteOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.4);
        noteGain.gain.setValueAtTime(0.03, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        noteOsc.start(t);
        noteOsc.stop(t + 0.45);
      });
    }
  }

  toggleMusic(enable: boolean) {
    this.isPlayingMusic = enable;
    if (enable) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  private startAmbientMusic() {
    this.init();
    if (!this.ctx || !this.isPlayingMusic) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    if (this.musicInterval) clearInterval(this.musicInterval);

    this.musicInterval = setInterval(() => {
      if (!this.isPlayingMusic || !this.ctx) return;
      this.playAmbientChord();
    }, 4500);

    this.playAmbientChord();
  }

  private playAmbientChord() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const progressions = [
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [174.61, 261.63, 349.23], // F
      [196.00, 293.66, 392.00], // G
    ];

    const freqs = progressions[this.progressionIdx];
    this.progressionIdx = (this.progressionIdx + 1) % progressions.length;

    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(260, t);
      filter.Q.setValueAtTime(0.8, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 1.8);
      gain.gain.setValueAtTime(0.01, t + 2.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.3);

      osc.start(t);
      osc.stop(t + 4.5);
    });
  }

  stopAmbientMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundController();
