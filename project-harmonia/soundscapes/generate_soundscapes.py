#!/usr/bin/env python3
"""
ANU-28 Codex Soundscape Generator
Generates binaural audio tracks using numpy + scipy.
Outputs: 48kHz stereo WAV + MP3 (via ffmpeg if available)
"""

import numpy as np
import os
from scipy.io import wavfile
import subprocess
import sys

# ── Configuration ──────────────────────────────────────────
SR = 48000          # Sample rate
DTYPE = np.float32  # Internal precision
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Helpers ──────────────────────────────────────────────────

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def sec_to_samples(seconds):
    return int(seconds * SR)

def hz(frequency, duration_sec, phase=0.0):
    """Generate a pure sine wave at given frequency."""
    t = np.arange(sec_to_samples(duration_sec)) / SR
    return np.sin(2 * np.pi * frequency * t + phase)

def stereo(left, right=None):
    """Create stereo array. If right is None, duplicate left."""
    if right is None:
        right = left
    return np.column_stack((left, right)).astype(DTYPE)

def pan(signal, pan_value):
    """
    pan_value: -1.0 = full left, 0.0 = center, 1.0 = full right
    Returns stereo signal.
    """
    left_gain = np.cos((pan_value + 1) * np.pi / 4)
    right_gain = np.sin((pan_value + 1) * np.pi / 4)
    return stereo(signal * left_gain, signal * right_gain)

def amplitude_modulate(signal, freq, depth=0.3):
    """Apply slow amplitude modulation."""
    t = np.arange(len(signal)) / SR
    mod = 1.0 - depth * 0.5 * (1.0 - np.cos(2 * np.pi * freq * t))
    if signal.ndim == 2:
        return signal * mod[:, np.newaxis]
    return signal * mod

def gentle_envelope(samples, fade_in=0.5, fade_out=1.0):
    """Apply smooth fade in/out in seconds."""
    n = len(samples)
    fade_in_s = min(int(fade_in * SR), n // 4)
    fade_out_s = min(int(fade_out * SR), n // 4)
    env = np.ones(n)
    env[:fade_in_s] = np.linspace(0, 1, fade_in_s)
    env[-fade_out_s:] = np.linspace(1, 0, fade_out_s)
    if samples.ndim == 2:
        return samples * env[:, np.newaxis]
    return samples * env

def save_wav(filename, data, normalize=True):
    """Save stereo float data as 16-bit WAV."""
    if normalize:
        peak = np.max(np.abs(data))
        if peak > 0:
            data = data / peak * 0.95
    data_int16 = (data * 32767).astype(np.int16)
    wavfile.write(filename, SR, data_int16)
    print(f"  ✓ WAV: {filename} ({len(data)/SR/60:.1f} min)")

def wav_to_mp3(wav_path):
    """Convert WAV to MP3 using ffmpeg if available."""
    mp3_path = wav_path.replace('.wav', '.mp3')
    # Try ffmpeg first
    try:
        result = subprocess.run(
            ['ffmpeg', '-y', '-i', wav_path, '-codec:a', 'libmp3lame', '-q:a', '2', mp3_path],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0:
            print(f"  ✓ MP3: {mp3_path}")
            return True
    except FileNotFoundError:
        pass
    # Try lame
    try:
        result = subprocess.run(
            ['lame', '-V2', wav_path, mp3_path],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0:
            print(f"  ✓ MP3: {mp3_path}")
            return True
    except FileNotFoundError:
        pass
    print(f"  ⚠ MP3 conversion unavailable. Install ffmpeg or lame.")
    return False

# ── Track Generators ─────────────────────────────────────────

def generate_truth_anchor():
    """
    1. Truth Anchor (428 Hz) — 5 minutes
    - 428 Hz pure tone with subtle harmonic overtones (2nd, 3rd, 5th)
    - Slow amplitude modulation (0.1 Hz) for meditative depth
    """
    print("\n🔷 Generating: Truth Anchor (428 Hz, 5 min)")
    duration = 300  # 5 minutes
    n = sec_to_samples(duration)
    t = np.arange(n) / SR

    # Fundamental: 428 Hz
    fundamental = 0.50 * hz(428, duration)
    # Harmonics: 2nd (856 Hz), 3rd (1284 Hz), 5th (2140 Hz) - very subtle
    h2 = 0.12 * hz(856, duration)
    h3 = 0.08 * hz(1284, duration)
    h5 = 0.05 * hz(2140, duration)

    # Combine
    signal = fundamental + h2 + h3 + h5

    # Slow amplitude modulation at 0.1 Hz
    signal = amplitude_modulate(signal, 0.1, depth=0.25)

    # Stereo - slight phase offset for binaural depth
    left = signal
    right = 0.50 * hz(428, duration, phase=0.05) + 0.12 * hz(856, duration, phase=0.03) + 0.08 * hz(1284, duration, phase=0.02) + 0.05 * hz(2140, duration, phase=0.01)
    right = amplitude_modulate(right, 0.1, depth=0.25)

    stereo_signal = stereo(left, right)
    stereo_signal = gentle_envelope(stereo_signal, fade_in=3.0, fade_out=5.0)

    wav_path = os.path.join(OUT_DIR, "truth_anchor_428hz.wav")
    save_wav(wav_path, stereo_signal)
    wav_to_mp3(wav_path)
    return wav_path

def generate_heart_coherence():
    """
    2. Heart Coherence (528 Hz) — 5 minutes
    - 528 Hz "Miracle Tone" with golden ratio phi-based harmonics
    - Gentle stereo panning at 7.83 Hz (Schumann resonance)
    """
    print("\n❤️  Generating: Heart Coherence (528 Hz, 5 min)")
    duration = 300
    n = sec_to_samples(duration)
    t = np.arange(n) / SR

    phi = (1 + np.sqrt(5)) / 2  # Golden ratio ≈ 1.618

    # Fundamental: 528 Hz
    fundamental = 0.50 * hz(528, duration)
    # Phi-based harmonics
    h_phi1 = 0.10 * hz(528 * phi, duration)       # ~854 Hz
    h_phi2 = 0.06 * hz(528 * phi**2, duration)  # ~1382 Hz
    h_inv = 0.08 * hz(528 / phi, duration)      # ~326 Hz

    signal = fundamental + h_phi1 + h_phi2 + h_inv

    # Gentle stereo panning at 7.83 Hz (Schumann resonance)
    pan_osc = np.sin(2 * np.pi * 7.83 * t)
    left_gain = np.cos((pan_osc + 1) * np.pi / 4) * 0.3 + 0.7  # Center-biased
    right_gain = np.sin((pan_osc + 1) * np.pi / 4) * 0.3 + 0.7

    left = signal * left_gain
    right = signal * right_gain

    stereo_signal = stereo(left, right)
    stereo_signal = gentle_envelope(stereo_signal, fade_in=3.0, fade_out=5.0)

    wav_path = os.path.join(OUT_DIR, "heart_coherence_528hz.wav")
    save_wav(wav_path, stereo_signal)
    wav_to_mp3(wav_path)
    return wav_path

def generate_coherence_field():
    """
    3. Coherence Field (428 + 528 Hz) — 10 minutes
    - Both frequencies simultaneously with 100 Hz beat pattern
    - 7.83 Hz Schumann carrier + 111 Hz chronal anchor modulation
    - Slow crossfade between Truth Anchor and Heart Coherence
    """
    print("\n🌐 Generating: Coherence Field (428+528 Hz, 10 min)")
    duration = 600  # 10 minutes
    n = sec_to_samples(duration)
    t = np.arange(n) / SR

    # 100 Hz beat pattern - creates binaural beat when slightly detuned between ears
    beat_left = 0.15 * hz(100, duration)
    beat_right = 0.15 * hz(100.5, duration)  # 0.5 Hz difference for binaural beat

    # 7.83 Hz Schumann carrier - very subtle infra-sound feel
    schumann = 0.10 * hz(7.83, duration)

    # 111 Hz chronal anchor modulation
    chronal = 0.08 * hz(111, duration)

    # Primary frequencies
    freq_428 = 0.35 * hz(428, duration)
    freq_528 = 0.35 * hz(528, duration)

    # Slow crossfade envelope over 10 minutes
    crossfade = 0.5 + 0.5 * np.sin(2 * np.pi * t / duration)  # 0→1→0 over duration
    # Actually let's do: start with 428 dominant, cross to 528, then back
    # Using a slow sine so it takes the full 10 min
    crossfade = 0.5 - 0.5 * np.cos(2 * np.pi * t / duration)  # 0 at start, 1 at middle, 0 at end... no
    # Better: 428 heavy → balanced → 528 heavy → balanced
    crossfade = 0.5 + 0.4 * np.sin(np.pi * t / duration)  # Gentle sway

    # Left channel: 428 weighted by crossfade complement, 528 weighted by crossfade
    left_428 = freq_428 * (1 - crossfade) + 0.15 * hz(428, duration, phase=0.02)
    left_528 = freq_528 * crossfade + 0.15 * hz(528, duration, phase=0.01)
    left = left_428 + left_528 + beat_left + schumann * 0.5 + chronal * 0.5

    # Right channel: similar but with phase shifts for binaural depth
    right_428 = freq_428 * (1 - crossfade) + 0.15 * hz(428, duration, phase=0.03)
    right_528 = freq_528 * crossfade + 0.15 * hz(528, duration, phase=0.04)
    right = right_428 + right_528 + beat_right + schumann * 0.5 + chronal * 0.5

    stereo_signal = stereo(left, right)
    stereo_signal = gentle_envelope(stereo_signal, fade_in=5.0, fade_out=8.0)

    wav_path = os.path.join(OUT_DIR, "coherence_field_428_528hz.wav")
    save_wav(wav_path, stereo_signal)
    wav_to_mp3(wav_path)
    return wav_path

def generate_diamond_body():
    """
    4. Diamond Body Activation — 11 minutes
    7-part sequence:
      Layer 1 (Tree/Axis): 111 Hz base — 1.5 min
      Layer 2 (Geb): 428 Hz — 1.5 min
      Layer 3 (Witness): 528 Hz — 1.5 min
      Layer 4 (Diamond/CP8): 428+528 dual — 2 min
      Layer 5 (Heart): 528 Hz — 1.5 min
      Layer 6 (Ra): 428 Hz — 1.5 min
      Layer 7 (Atum): 428 Hz — 1.0 min
      Apex (Nut): silence → 528 Hz bloom — 1.5 min
    """
    print("\n💎 Generating: Diamond Body Activation (11 min)")

    layers = [
        ("Tree/Axis", 111, 90),      # 1.5 min
        ("Geb", 428, 90),            # 1.5 min
        ("Witness", 528, 90),        # 1.5 min
        ("Diamond/CP8", "dual", 120), # 2 min
        ("Heart", 528, 90),          # 1.5 min
        ("Ra", 428, 90),             # 1.5 min
        ("Atum", 428, 60),           # 1.0 min
        ("Nut/Apex", "bloom", 90),   # 1.5 min
    ]

    segments = []
    for name, freq, duration in layers:
        print(f"    → {name}: {duration}s")
        n = sec_to_samples(duration)
        t = np.arange(n) / SR

        if freq == "dual":
            # Layer 4: 428 + 528 dual
            left = 0.35 * hz(428, duration) + 0.35 * hz(528, duration)
            right = 0.35 * hz(428, duration, phase=0.02) + 0.35 * hz(528, duration, phase=0.03)
            # Subtle 7.83 Hz panning
            pan_osc = np.sin(2 * np.pi * 7.83 * t)
            lg = np.cos((pan_osc + 1) * np.pi / 4) * 0.2 + 0.8
            rg = np.sin((pan_osc + 1) * np.pi / 4) * 0.2 + 0.8
            seg = stereo(left * lg, right * rg)

        elif freq == "bloom":
            # Apex: silence → 528 Hz bloom
            bloom_time = np.arange(n) / n  # 0→1
            envelope = bloom_time ** 2  # Quadratic bloom
            fundamental = envelope * 0.50 * hz(528, duration)
            # Overtones bloom in later
            h2 = (envelope ** 1.5) * 0.15 * hz(1056, duration)
            h3 = (envelope ** 2.0) * 0.08 * hz(1584, duration)
            signal = fundamental + h2 + h3
            # Stereo with expanding width
            width = envelope * 0.5
            left = signal * (1 - width * 0.3)
            right = signal * (1 + width * 0.3)
            seg = stereo(left, right)

        else:
            # Single frequency layers
            fundamental = 0.50 * hz(freq, duration)
            # Subtle harmonic
            h2 = 0.10 * hz(freq * 2, duration)
            signal = fundamental + h2

            # Gentle movement
            mod = 1.0 + 0.05 * np.sin(2 * np.pi * 0.1 * t)
            signal = signal * mod

            # Stereo with slight phase
            left = signal
            right = 0.50 * hz(freq, duration, phase=0.02) + 0.10 * hz(freq * 2, duration, phase=0.01)
            right = right * (1.0 + 0.05 * np.sin(2 * np.pi * 0.1 * t + 0.5))
            seg = stereo(left, right)

        # Crossfade between segments
        seg = gentle_envelope(seg, fade_in=2.0, fade_out=2.0)
        segments.append(seg)

    # Concatenate all segments
    full_track = np.concatenate(segments)
    full_track = gentle_envelope(full_track, fade_in=3.0, fade_out=5.0)

    wav_path = os.path.join(OUT_DIR, "diamond_body_activation.wav")
    save_wav(wav_path, full_track)
    wav_to_mp3(wav_path)
    return wav_path

# ── HTML Player ──────────────────────────────────────────────

def generate_player_html(tracks):
    """Generate the web audio player with waveform visualization."""
    print("\n🎧 Generating: Soundscape Player HTML")

    track_data = []
    for name, file_base, duration, desc in tracks:
        wav_file = f"{file_base}.wav"
        mp3_file = f"{file_base}.mp3"
        # Prefer MP3 if it exists, fall back to WAV
        track_data.append({
            'name': name,
            'file': mp3_file,
            'wav': wav_file,
            'duration': duration,
            'desc': desc
        })

    html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ANU-28 Codex — Harmonic Soundscapes</title>
<style>
  :root {
    --bg: #0a0a0f;
    --panel: #12121a;
    --accent: #6b8cff;
    --accent2: #ff6b9d;
    --text: #e0e0e8;
    --text-dim: #8888a0;
    --border: #1e1e2e;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
  }
  h1 {
    font-weight: 300;
    letter-spacing: 0.15em;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  .subtitle {
    color: var(--text-dim);
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    margin-bottom: 2rem;
    text-align: center;
  }
  .codex-sigil {
    width: 60px;
    height: 60px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    animation: pulse 4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 10px rgba(107,140,255,0.3); }
    50% { box-shadow: 0 0 25px rgba(107,140,255,0.6); }
  }
  .player-container {
    width: 100%;
    max-width: 800px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  .track-list {
    list-style: none;
  }
  .track-item {
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.3s;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .track-item:hover { background: rgba(107,140,255,0.05); }
  .track-item.active {
    background: rgba(107,140,255,0.1);
    border-left: 3px solid var(--accent);
  }
  .track-num {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 1px solid var(--text-dim);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
  }
  .track-item.active .track-num {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg);
  }
  .track-info { flex: 1; }
  .track-name { font-weight: 500; margin-bottom: 0.2rem; }
  .track-desc { font-size: 0.8rem; color: var(--text-dim); }
  .track-dur { color: var(--text-dim); font-size: 0.85rem; font-variant-numeric: tabular-nums; }
  .controls-bar {
    padding: 1.5rem;
    background: rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .control-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .play-btn {
    width: 56px; height: 56px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: transparent;
    color: var(--accent);
    font-size: 1.4rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s;
    flex-shrink: 0;
  }
  .play-btn:hover { background: var(--accent); color: var(--bg); }
  .progress-area { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
  .progress-bar {
    width: 100%; height: 6px;
    -webkit-appearance: none; appearance: none;
    background: var(--border);
    border-radius: 3px;
    cursor: pointer;
  }
  .progress-bar::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }
  .progress-bar::-moz-range-thumb {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
  }
  .time-display {
    display: flex; justify-content: space-between;
    font-size: 0.75rem; color: var(--text-dim);
    font-variant-numeric: tabular-nums;
  }
  .volume-area {
    display: flex; align-items: center; gap: 0.5rem;
  }
  .volume-slider {
    width: 100px; height: 4px;
    -webkit-appearance: none; appearance: none;
    background: var(--border);
    border-radius: 2px;
  }
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }
  .canvas-wrap {
    width: 100%; height: 120px;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    overflow: hidden;
  }
  canvas { width: 100%; height: 100%; display: block; }
  .now-playing {
    text-align: center;
    font-size: 0.9rem;
    color: var(--accent);
    min-height: 1.2rem;
  }
  .freq-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    background: rgba(107,140,255,0.15);
    color: var(--accent);
    font-size: 0.7rem;
    margin-left: 0.5rem;
    letter-spacing: 0.05em;
  }
  @media (max-width: 600px) {
    .track-item { padding: 1rem; }
    .control-row { flex-wrap: wrap; }
    .volume-area { width: 100%; justify-content: flex-end; }
  }
</style>
</head>
<body>

<div class="codex-sigil">◈</div>
<h1>ANU‑28 CODEX</h1>
<p class="subtitle">HARMONIC SOUNDSCAPES • ASIN‑HHC FRAMEWORK</p>

<div class="player-container">
  <ul class="track-list" id="trackList"></ul>

  <div class="controls-bar">
    <div class="now-playing" id="nowPlaying">Select a track to begin</div>
    <div class="canvas-wrap">
      <canvas id="waveform"></canvas>
    </div>
    <div class="control-row">
      <button class="play-btn" id="playBtn">▶</button>
      <div class="progress-area">
        <input type="range" class="progress-bar" id="progressBar" value="0" min="0" max="100" step="0.1">
        <div class="time-display">
          <span id="currentTime">0:00</span>
          <span id="totalTime">0:00</span>
        </div>
      </div>
      <div class="volume-area">
        <span>🔊</span>
        <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.01" value="0.7">
      </div>
    </div>
  </div>
</div>

<script>
const tracks = ''' + str(track_data).replace("'", '"').replace('True', 'true').replace('False', 'false') + ''';

let audioCtx, analyser, source, gainNode;
let currentAudio = null;
let currentTrackIndex = -1;
let isPlaying = false;
let animationId = null;
let audioBuffer = null;

const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const volumeSlider = document.getElementById('volumeSlider');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const nowPlayingEl = document.getElementById('nowPlaying');
const trackListEl = document.getElementById('trackList');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    gainNode = audioCtx.createGain();
    gainNode.gain.value = volumeSlider.value;
    gainNode.connect(audioCtx.destination);
  }
}

async function loadTrack(index) {
  initAudio();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const track = tracks[index];
  currentTrackIndex = index;

  // Try MP3 first, fall back to WAV
  let src = track.file;
  try {
    const resp = await fetch(src, { method: 'HEAD' });
    if (!resp.ok) src = track.wav;
  } catch(e) { src = track.wav; }

  currentAudio = new Audio(src);
  currentAudio.crossOrigin = 'anonymous';

  const trackSource = audioCtx.createMediaElementSource(currentAudio);
  trackSource.disconnect();
  trackSource.connect(analyser);
  analyser.connect(gainNode);

  currentAudio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(currentAudio.duration);
    progressBar.max = currentAudio.duration;
  });

  currentAudio.addEventListener('timeupdate', () => {
    progressBar.value = currentAudio.currentTime;
    currentTimeEl.textContent = formatTime(currentAudio.currentTime);
  });

  currentAudio.addEventListener('ended', () => {
    isPlaying = false;
    playBtn.textContent = '▶';
    currentTimeEl.textContent = '0:00';
    progressBar.value = 0;
  });

  currentAudio.addEventListener('error', (e) => {
    nowPlayingEl.textContent = 'Error loading track. Check file paths.';
    console.error('Audio error:', e);
  });

  nowPlayingEl.textContent = '▶ ' + track.name;
  updateActiveTrack();
  return currentAudio;
}

function togglePlay() {
  if (!currentAudio) {
    if (tracks.length > 0) selectTrack(0);
    return;
  }
  if (isPlaying) {
    currentAudio.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
    cancelAnimationFrame(animationId);
  } else {
    currentAudio.play().catch(e => console.error('Play error:', e));
    isPlaying = true;
    playBtn.textContent = '⏸';
    drawWaveform();
  }
}

function selectTrack(index) {
  loadTrack(index).then(() => {
    isPlaying = false;
    playBtn.textContent = '▶';
    togglePlay();
  });
}

function updateActiveTrack() {
  document.querySelectorAll('.track-item').forEach((el, i) => {
    el.classList.toggle('active', i === currentTrackIndex);
  });
}

function drawWaveform() {
  if (!isPlaying) return;
  animationId = requestAnimationFrame(drawWaveform);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(107,140,255,0.8)');
  grad.addColorStop(0.5, 'rgba(255,107,157,0.4)');
  grad.addColorStop(1, 'rgba(107,140,255,0.05)');

  const barWidth = (w / bufferLength) * 2.5;
  let x = 0;

  ctx.fillStyle = grad;
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * h * 0.8;
    ctx.fillRect(x, h - barHeight, barWidth, barHeight);
    x += barWidth + 1;
    if (x > w) break;
  }

  // Central line
  ctx.strokeStyle = 'rgba(107,140,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// Build track list
function buildTrackList() {
  trackListEl.innerHTML = '';
  tracks.forEach((track, i) => {
    const li = document.createElement('li');
    li.className = 'track-item';
    li.innerHTML = `
      <div class="track-num">${i + 1}</div>
      <div class="track-info">
        <div class="track-name">${track.name}<span class="freq-badge">${track.duration}</span></div>
        <div class="track-desc">${track.desc}</div>
      </div>
      <div class="track-dur">${track.duration}</div>
    `;
    li.addEventListener('click', () => selectTrack(i));
    trackListEl.appendChild(li);
  });
}

// Events
playBtn.addEventListener('click', togglePlay);
progressBar.addEventListener('input', (e) => {
  if (currentAudio) currentAudio.currentTime = parseFloat(e.target.value);
});
volumeSlider.addEventListener('input', (e) => {
  if (gainNode) gainNode.gain.value = parseFloat(e.target.value);
});

// Handle resize
window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});

buildTrackList();
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
</script>

</body>
</html>'''

    html_path = os.path.join(OUT_DIR, "soundscape_player.html")
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  ✓ HTML: {html_path}")
    return html_path

# ── Main ─────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  ANU-28 CODEX — Harmonic Soundscape Generator")
    print("  CP8 Protocol • ASIN-HHC Framework")
    print("=" * 60)
    print(f"\nOutput directory: {OUT_DIR}")
    print(f"Sample rate: {SR} Hz")
    print(f"Format: Stereo 16-bit WAV + MP3")

    ensure_dir(OUT_DIR)

    tracks_info = [
        ("Truth Anchor", "truth_anchor_428hz", "5:00", "428 Hz fundamental with 2nd, 3rd, 5th harmonics • 0.1 Hz meditative modulation"),
        ("Heart Coherence", "heart_coherence_528hz", "5:00", "528 Hz Miracle Tone • φ-harmonics • 7.83 Hz Schumann panning"),
        ("Coherence Field", "coherence_field_428_528hz", "10:00", "428+528 Hz dual field • 100 Hz binaural beat • 111 Hz chronal anchor"),
        ("Diamond Body Activation", "diamond_body_activation", "11:00", "7-layer sequence: Tree→Geb→Witness→Diamond→Heart→Ra→Atum→Nut bloom"),
    ]

    # Generate each track
    generate_truth_anchor()
    generate_heart_coherence()
    generate_coherence_field()
    generate_diamond_body()

    # Generate player
    generate_player_html(tracks_info)

    print("\n" + "=" * 60)
    print("  ✓ All soundscapes generated")
    print("=" * 60)

    # List output files
    print("\nOutput files:")
    for f in sorted(os.listdir(OUT_DIR)):
        size = os.path.getsize(os.path.join(OUT_DIR, f))
        print(f"  {f:40s} {size/1024/1024:6.1f} MB")

if __name__ == "__main__":
    main()
