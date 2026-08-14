// Web Audio API Synthesizer for Bullfrog's Magic Carpet (1994) Sound Effects & Soundtrack

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windNoise: AudioBufferSourceNode | null = null;

  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.4;

  private musicInterval: any = null;
  private musicStep: number = 0;
  private currentTrack: 'none' | 'ambient' | 'combat' = 'none';

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initWindAmbience();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public unlockAudio() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : val, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  // ==========================================
  // Continuous Carpet Flight Wind Ambience
  // ==========================================

  private initWindAmbience() {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = buffer;
    this.windNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);

    this.windNoise.start();
  }

  public updateFlightSpeed(speedRatio: number) {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;
    const freq = 200 + speedRatio * 900;
    const gain = 0.04 + speedRatio * 0.18;

    this.windFilter.frequency.setTargetAtTime(freq, now, 0.1);
    this.windGain.gain.setTargetAtTime(gain, now, 0.1);
  }

  // ==========================================
  // Spells & Combat SFX
  // ==========================================

  public playFireballCast() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Pitch sweep & whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playExplosion(magnitude: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * Math.min(0.8, 0.3 * magnitude);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500 * magnitude, now);
    filter.frequency.linearRampToValueAtTime(60, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45 * Math.min(1.5, magnitude), now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.5);
  }

  public playLightning() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Electric zap buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playMeteor() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Deep roar
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.8);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playPossess() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Shimmering mystical chord
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playManaClaim() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Gold chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCastleLevelUp() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Grand fanfare
    [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playVolcanoErupt() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Earth rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  public playCreatureRoar(type: string) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'WYRM') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
    } else if (type === 'GRIFFIN') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // ==========================================
  // Procedural Arabian Fantasy Soundtrack
  // ==========================================

  public playMusic(track: 'ambient' | 'combat') {
    if (this.currentTrack === track && this.musicInterval) return;
    this.stopMusic();
    this.currentTrack = track;

    if (!this.ctx) this.init();
    if (!this.ctx) return;

    this.musicStep = 0;
    const tempo = track === 'combat' ? 130 : 85;
    const stepDurationMs = (60 / tempo / 2) * 1000;

    this.musicInterval = setInterval(() => {
      this.tickSoundtrack(track);
    }, stepDurationMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = 'none';
  }

  private tickSoundtrack(track: 'ambient' | 'combat') {
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const step = this.musicStep % 32;
    this.musicStep++;

    if (track === 'ambient') {
      // Arabian Double Harmonic Scale (D Eb F# G A Bb C# D)
      const bassNotes = [146.83, 0, 146.83, 0, 155.56, 0, 155.56, 0, 146.83, 0, 138.59, 0, 146.83, 0, 0, 0];
      const bass = bassNotes[step % 16];

      if (bass > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bass, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.6);
      }

      // Sitar / Oud melody
      const melody = [
        293.66, 311.13, 369.99, 392.00, 440.00, 0, 466.16, 440.00,
        392.00, 369.99, 311.13, 293.66, 277.18, 0, 293.66, 0,
        440.00, 466.16, 554.37, 587.33, 554.37, 466.16, 440.00, 392.00,
        369.99, 392.00, 369.99, 311.13, 293.66, 0, 0, 0
      ];

      const note = melody[step];
      if (note > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } else {
      // Driving battle percussion
      const bassPattern = [110, 110, 110, 146.83, 110, 110, 123.47, 138.59];
      const bass = bassPattern[step % 8];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bass, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  }
}

export const soundManager = new SoundManager();
