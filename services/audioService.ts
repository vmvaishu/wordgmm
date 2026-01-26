
class AudioService {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.1, 0.05);
  }

  playCorrect() {
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(554, 'sine', 0.1, 0.1), 50);
    setTimeout(() => this.playTone(659, 'sine', 0.2, 0.1), 100);
  }

  playWrong() {
    this.playTone(150, 'sawtooth', 0.3, 0.1);
  }

  playHint() {
    this.playTone(600, 'triangle', 0.1, 0.08);
    setTimeout(() => this.playTone(900, 'triangle', 0.1, 0.08), 50);
  }

  playLevelUp() {
    const notes = [523, 659, 783, 1046];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.4, 0.1), i * 150);
    });
  }
}

export const audioService = new AudioService();
