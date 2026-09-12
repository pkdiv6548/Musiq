import { state } from "./state.js";
import { youtubePlayer } from "./youtube-player.js";

// Frequency centers for standard 10-band graphic equalizer
export const EQ_FREQUENCIES = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.htmlAudio = new Audio();
    this.htmlAudio.crossOrigin = "anonymous";
    this.sourceNode = null;
    this.preampNode = null;
    this.eqFilters = [];
    this.bassBoostFilter = null;
    this.trebleBoostFilter = null;
    this.stereoPannerNode = null;
    this.compressorNode = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.dryGain = null;
    this.masterGain = null;
    this.analyser = null;

    // Procedural Synth Synthesizer for Demo Playback
    this.synthInterval = null;
    this.synthActiveNodes = [];
    this.isSynthesized = false;

    this.initHTMLAudioEvents();
    youtubePlayer.setOnEnded(() => this.onTrackEnded());
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();
      this.buildAudioGraph();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  buildAudioGraph() {
    const ctx = this.audioCtx;

    // 1. HTML Audio source node
    try {
      this.sourceNode = ctx.createMediaElementSource(this.htmlAudio);
    } catch (e) {
      // If already connected or synthetic
    }

    // 2. Preamp gain
    this.preampNode = ctx.createGain();
    this.preampNode.gain.value = 1.0;

    // 3. 10-band Peaking Filters
    this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = ctx.createBiquadFilter();
      if (idx === 0) {
        filter.type = "lowshelf";
      } else if (idx === EQ_FREQUENCIES.length - 1) {
        filter.type = "highshelf";
      } else {
        filter.type = "peaking";
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = state.eqBands[idx] || 0;
      return filter;
    });

    // 4. Bass Boost LowShelf
    this.bassBoostFilter = ctx.createBiquadFilter();
    this.bassBoostFilter.type = "lowshelf";
    this.bassBoostFilter.frequency.value = 100;
    this.bassBoostFilter.gain.value = (state.bassBoost / 100) * 12;

    // 5. Treble Boost HighShelf
    this.trebleBoostFilter = ctx.createBiquadFilter();
    this.trebleBoostFilter.type = "highshelf";
    this.trebleBoostFilter.frequency.value = 8000;
    this.trebleBoostFilter.gain.value = 0;

    // 6. Stereo Panner
    if (ctx.createStereoPanner) {
      this.stereoPannerNode = ctx.createStereoPanner();
      this.stereoPannerNode.pan.value = 0;
    }

    // 7. Dynamics Compressor (Limiter)
    this.compressorNode = ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -3;
    this.compressorNode.knee.value = 12;
    this.compressorNode.ratio.value = 10;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;

    // 8. Synthetic Reverb
    this.buildReverb(ctx);

    // 9. Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = state.isMuted ? 0 : state.volume;

    // 10. Analyser Node for Visualizers
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // Wire up graph
    let currentNode = this.preampNode;

    // Connect EQ filters in series
    this.eqFilters.forEach(filter => {
      currentNode.connect(filter);
      currentNode = filter;
    });

    currentNode.connect(this.bassBoostFilter);
    currentNode = this.bassBoostFilter;

    currentNode.connect(this.trebleBoostFilter);
    currentNode = this.trebleBoostFilter;

    if (this.stereoPannerNode) {
      currentNode.connect(this.stereoPannerNode);
      currentNode = this.stereoPannerNode;
    }

    // Connect to Reverb Dry/Wet split
    currentNode.connect(this.dryGain);
    currentNode.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);

    this.dryGain.connect(this.compressorNode);
    this.reverbGain.connect(this.compressorNode);

    this.compressorNode.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // If sourceNode is available, hook it up to preamp
    if (this.sourceNode) {
      this.sourceNode.connect(this.preampNode);
    }
  }

  buildReverb(ctx) {
    this.reverbNode = ctx.createConvolver();
    this.dryGain = ctx.createGain();
    this.reverbGain = ctx.createGain();

    // Create algorithmic impulse response for lush hall reverb
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2.0; // 2 sec tail
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.5));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    this.reverbNode.buffer = impulse;

    const revAmount = (state.reverb || 10) / 100;
    this.reverbGain.gain.value = revAmount * 0.6;
    this.dryGain.gain.value = 1.0 - (revAmount * 0.3);
  }

  initHTMLAudioEvents() {
    this.htmlAudio.addEventListener("timeupdate", () => {
      if (!this.isSynthesized) {
        state.currentTime = this.htmlAudio.currentTime;
        state.duration = this.htmlAudio.duration || state.duration;
        state.notify("timeUpdate", {
          currentTime: state.currentTime,
          duration: state.duration
        });
        this.checkABRepeat();
      }
    });

    this.htmlAudio.addEventListener("ended", () => {
      this.onTrackEnded();
    });

    this.htmlAudio.addEventListener("error", (e) => {
      console.warn("Audio element error, falling back to procedural synthesizer", e);
      this.startProceduralSynthesizer(state.currentSong);
    });
  }

  play() {
    const song = state.currentSong;
    const isYouTube = song && (song.source === "youtube" || (song.id && song.id.startsWith("youtube:")));

    // YouTube owns its own media element inside the IFrame. Do not create or
    // resume the Web Audio graph before handing a YouTube click to the IFrame.
    // This keeps the browser's user-gesture path clean for playback.
    if (isYouTube) {
      this.isSynthesized = false;
      this.stopProceduralSynthesizer();
      this.htmlAudio.pause();
      youtubePlayer.play(song, state.currentTime);
      return;
    }

    this.ensureContext();
    state.isPlaying = true;
    state.notify("playbackStateChanged", true);

    if (song && (song.blobUrl || song.source === "local" || (song.id && song.id.startsWith("local:")))) {
      // 2. Local Device Audio Source
      youtubePlayer.pause();
      this.isSynthesized = false;
      this.stopProceduralSynthesizer();
      if (song.blobUrl) {
        if (this.htmlAudio.src !== song.blobUrl) {
          this.htmlAudio.src = song.blobUrl;
        }
        this.htmlAudio.currentTime = state.currentTime;
        this.htmlAudio.play().catch(e => {
          console.warn("Local audio playback error", e);
        });
      }
    } else if (state.isStream && state.currentStation) {
      // 3. Radio / Podcast stream
      youtubePlayer.pause();
      this.isSynthesized = false;
      this.stopProceduralSynthesizer();
      this.htmlAudio.src = state.currentStation.streamUrl;
      this.htmlAudio.play().catch(() => {
        this.startProceduralSynthesizer(state.currentSong || { synthType: state.currentStation.fallbackSynth });
      });
    } else {
      // 4. Procedural Web Audio Synth for demo catalogue
      youtubePlayer.pause();
      this.isSynthesized = true;
      this.startProceduralSynthesizer(state.currentSong);
    }
  }

  pause() {
    state.isPlaying = false;
    state.notify("playbackStateChanged", false);
    const song = state.currentSong;
    const isYouTube = song && (song.source === "youtube" || (song.id && song.id.startsWith("youtube:")));

    if (isYouTube) {
      youtubePlayer.pause();
    } else if (this.isSynthesized) {
      this.stopProceduralSynthesizer();
    } else {
      this.htmlAudio.pause();
    }
  }

  seek(seconds) {
    state.currentTime = Math.max(0, Math.min(seconds, state.duration));
    const song = state.currentSong;
    const isYouTube = song && (song.source === "youtube" || (song.id && song.id.startsWith("youtube:")));

    if (isYouTube) {
      youtubePlayer.seek(seconds);
    } else if (!this.isSynthesized && this.htmlAudio.src) {
      this.htmlAudio.currentTime = state.currentTime;
    }
    state.notify("timeUpdate", {
      currentTime: state.currentTime,
      duration: state.duration
    });
  }

  setVolume(val) {
    const vol = Math.max(0, Math.min(1, val));
    state.volume = vol;
    state.isMuted = vol === 0;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(state.isMuted ? 0 : vol, this.audioCtx.currentTime);
    }
    this.htmlAudio.volume = state.isMuted ? 0 : vol;
    youtubePlayer.setVolume(state.isMuted ? 0 : vol);
    state.notify("volumeChanged", { volume: vol, isMuted: state.isMuted });
  }

  toggleMute() {
    if (state.isMuted) {
      state.isMuted = false;
      this.setVolume(state.previousVolume || 0.8);
    } else {
      state.previousVolume = state.volume;
      state.isMuted = true;
      this.setVolume(0);
    }
  }

  setPlaybackRate(rate) {
    state.playbackRate = rate;
    this.htmlAudio.playbackRate = rate;
    youtubePlayer.setPlaybackRate(rate);
    state.notify("playbackRateChanged", rate);
  }

  checkABRepeat() {
    if (state.abRepeat.active && state.abRepeat.b > state.abRepeat.a) {
      if (state.currentTime >= state.abRepeat.b) {
        this.seek(state.abRepeat.a);
      }
    }
  }

  onTrackEnded() {
    if (state.repeatMode === "one") {
      this.seek(0);
      this.play();
    } else if (state.autoNext || state.repeatMode === "all") {
      this.nextTrack();
    } else {
      this.pause();
    }
  }

  nextTrack() {
    if (!state.queue || state.queue.length === 0) return;
    let nextIndex = state.queueIndex + 1;
    if (state.shuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else if (nextIndex >= state.queue.length) {
      if (state.repeatMode === "all") {
        nextIndex = 0;
      } else {
        this.pause();
        return;
      }
    }
    this.playTrackAtIndex(nextIndex);
  }

  prevTrack() {
    if (state.currentTime > 3) {
      this.seek(0);
      return;
    }
    if (!state.queue || state.queue.length === 0) return;
    let prevIndex = state.queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = state.queue.length - 1;
    }
    this.playTrackAtIndex(prevIndex);
  }

  playTrackAtIndex(index) {
    if (index < 0 || index >= state.queue.length) return;
    state.queueIndex = index;
    const song = state.queue[index];
    state.currentSong = song;
    state.currentTime = 0;
    state.duration = song.duration || 180;
    state.isStream = false;
    state.currentStation = null;

    state.addSongToHistory(song);
    state.incrementSongPlayCount(song.id);
    state.notify("songChanged", song);

    this.play();
  }

  // Real-time Procedural Musical Synthesizer for Demo Tracks
  startProceduralSynthesizer(song) {
    this.stopProceduralSynthesizer();
    this.ensureContext();
    const ctx = this.audioCtx;

    const synthType = (song && song.synthType) || "synthwave";
    const bpm = (song && song.bpm) || 120;
    const stepInterval = (60 / bpm) * 250; // 16th note step in ms

    // Musical Scales & Harmonies
    const SCALES = {
      synthwave: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440], // A Minor
      lofi: [261.63, 293.66, 329.63, 392.00, 440, 523.25], // C Pentatonic Major
      ambient: [130.81, 196.00, 261.63, 329.63, 392.00, 523.25], // Ethereal Open Chords
      classical: [174.61, 220.00, 261.63, 329.63, 349.23, 440.00, 523.25], // F Lydian
      jazz: [207.65, 261.63, 311.13, 370.00, 415.30, 466.16], // Ab Dorian
      cyberpunk: [110, 116.54, 130.81, 146.83, 155.56, 164.81], // Dark Phrygian
      disco: [146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 293.66], // D Minor
      indie: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00], // G Major
      folk: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63], // E Minor
      electronic: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63]
    };

    const currentScale = SCALES[synthType] || SCALES.synthwave;
    let step = 0;

    // Time ticker for simulated song progress
    this.synthInterval = setInterval(() => {
      if (!state.isPlaying) return;

      state.currentTime += (stepInterval / 1000);
      if (state.currentTime >= state.duration) {
        state.currentTime = 0;
        this.onTrackEnded();
        return;
      }
      state.notify("timeUpdate", {
        currentTime: state.currentTime,
        duration: state.duration
      });
      this.checkABRepeat();

      // Synthesize note events
      const now = ctx.currentTime;
      const noteFreq = currentScale[step % currentScale.length];

      // Bass note on downbeats
      if (step % 4 === 0) {
        this.playSynthesizedTone(noteFreq * 0.5, "sawtooth", 0.18, 0.45, now);
      }

      // Melody arpeggio
      if (step % 2 === 0 || synthType === "cyberpunk") {
        const octave = (step % 3 === 0) ? 2 : 1;
        this.playSynthesizedTone(noteFreq * octave, synthType === "classical" ? "triangle" : "sine", 0.12, 0.25, now);
      }

      // Snare / Hi-hat simulated rhythm
      if (step % 4 === 2) {
        this.playSynthesizedPercussion("snare", now);
      } else if (step % 2 === 1) {
        this.playSynthesizedPercussion("hihat", now);
      }

      step = (step + 1) % 32;
    }, stepInterval);
  }

  playSynthesizedTone(freq, type, gainAmount, duration, startTime) {
    if (!this.audioCtx || !this.preampNode) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainAmount, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.preampNode);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      // Ignored
    }
  }

  playSynthesizedPercussion(type, startTime) {
    if (!this.audioCtx || !this.preampNode) return;
    try {
      const noiseBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.1, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = type === "snare" ? "bandpass" : "highpass";
      filter.frequency.value = type === "snare" ? 1000 : 7000;

      const gain = this.audioCtx.createGain();
      const duration = type === "snare" ? 0.12 : 0.04;
      gain.gain.setValueAtTime(type === "snare" ? 0.08 : 0.03, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.preampNode);

      whiteNoise.start(startTime);
      whiteNoise.stop(startTime + duration);
    } catch (e) {
      // Ignored
    }
  }

  stopProceduralSynthesizer() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // Equalizer Controls
  setEqBandGain(index, gainValue) {
    if (index >= 0 && index < this.eqFilters.length) {
      const filter = this.eqFilters[index];
      const gain = Math.max(-12, Math.min(12, gainValue));
      state.eqBands[index] = gain;
      if (this.audioCtx && filter) {
        filter.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.05);
      }
      state.notify("eqChanged", { bands: state.eqBands, index, gain });
    }
  }

  setBassBoost(val) {
    state.bassBoost = val;
    if (this.bassBoostFilter && this.audioCtx) {
      const db = (val / 100) * 14;
      this.bassBoostFilter.gain.setTargetAtTime(db, this.audioCtx.currentTime, 0.05);
    }
    state.notify("effectsChanged", { bassBoost: val });
  }

  setReverb(val) {
    state.reverb = val;
    if (this.reverbGain && this.dryGain && this.audioCtx) {
      const revAmount = val / 100;
      this.reverbGain.gain.setTargetAtTime(revAmount * 0.6, this.audioCtx.currentTime, 0.05);
      this.dryGain.gain.setTargetAtTime(1.0 - (revAmount * 0.3), this.audioCtx.currentTime, 0.05);
    }
    state.notify("effectsChanged", { reverb: val });
  }

  setStereoPan(val) {
    if (this.stereoPannerNode && this.audioCtx) {
      const pan = Math.max(-1, Math.min(1, val));
      this.stereoPannerNode.pan.setTargetAtTime(pan, this.audioCtx.currentTime, 0.05);
    }
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }
}

export const audioEngine = new AudioEngine();
