const fs = require('fs');
const { WaveFile } = require('wavefile');
const FFT = require('fft.js');

function nextPowerOf2(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function applyWindow(samples, windowType = 'hann') {
  const n = samples.length;
  const windowed = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    let w;
    switch (windowType) {
      case 'hann':
        w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
        break;
      case 'hamming':
        w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
        break;
      case 'rectangular':
        w = 1;
        break;
      default:
        w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
    }
    windowed[i] = samples[i] * w;
  }
  
  return windowed;
}

function computeFFT(samples) {
  try {
    const n = samples.length;
    const fftSize = nextPowerOf2(n);
    const fft = new FFT(fftSize);
    const input = new Float32Array(fftSize * 2);
    
    for (let i = 0; i < n; i++) {
      input[i * 2] = samples[i] || 0;
      input[i * 2 + 1] = 0;
    }
    
    fft.transform(input);
    
    const magnitudes = new Float32Array(fftSize / 2);
    const phases = new Float32Array(fftSize / 2);
    
    for (let i = 0; i < fftSize / 2; i++) {
      const re = input[i * 2] || 0;
      const im = input[i * 2 + 1] || 0;
      magnitudes[i] = Math.sqrt(re * re + im * im) / fftSize;
      phases[i] = Math.atan2(im, re);
    }
    
    return { magnitudes, phases };
  } catch (error) {
    console.error('FFT error:', error);
    return { magnitudes: new Float32Array(512), phases: new Float32Array(512) };
  }
}

function computeSTFT(samples, windowSize = 1024, hopSize = 256) {
  try {
    const maxFrames = 500;
    const effectiveHopSize = samples.length > maxFrames * hopSize 
      ? Math.floor(samples.length / maxFrames) 
      : hopSize;
    
    if (samples.length < windowSize) {
      const padded = new Float32Array(windowSize);
      for (let i = 0; i < samples.length; i++) {
        padded[i] = samples[i] || 0;
      }
      const windowed = applyWindow(padded, 'hann');
      const { magnitudes } = computeFFT(windowed);
      return [Array.from(magnitudes)];
    }
    
    const numFrames = Math.min(maxFrames, Math.floor((samples.length - windowSize) / effectiveHopSize) + 1);
    const spectrogram = [];
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * effectiveHopSize;
      const end = Math.min(start + windowSize, samples.length);
      const padded = new Float32Array(windowSize);
      for (let j = start; j < end; j++) {
        padded[j - start] = samples[j] || 0;
      }
      
      const windowed = applyWindow(padded, 'hann');
      const { magnitudes } = computeFFT(windowed);
      spectrogram.push(Array.from(magnitudes));
    }
    
    return spectrogram;
  } catch (error) {
    console.error('STFT computation error:', error);
    return [];
  }
}

function convolveFFT(audioSamples, irSamples, progressCallback = null) {
  const audioLen = audioSamples.length;
  const irLen = irSamples.length;
  const outputLen = audioLen + irLen - 1;
  const fftSize = nextPowerOf2(outputLen);
  
  console.log(`Convolving: audio=${audioLen}, IR=${irLen}, FFT size=${fftSize}`);
  
  const fft = new FFT(fftSize);
  
  const a = new Float32Array(fftSize * 2);
  const b = new Float32Array(fftSize * 2);
  
  for (let i = 0; i < audioLen; i++) a[i * 2] = audioSamples[i];
  for (let i = 0; i < irLen; i++) b[i * 2] = irSamples[i];
  
  if (progressCallback) progressCallback(0.2);
  
  fft.transform(a);
  fft.transform(b);
  
  if (progressCallback) progressCallback(0.5);
  
  const c = new Float32Array(fftSize * 2);
  for (let i = 0; i < fftSize; i++) {
    const aRe = a[i * 2], aIm = a[i * 2 + 1];
    const bRe = b[i * 2], bIm = b[i * 2 + 1];
    c[i * 2] = aRe * bRe - aIm * bIm;
    c[i * 2 + 1] = aRe * bIm + aIm * bRe;
  }
  
  if (progressCallback) progressCallback(0.7);
  
  fft.inverseTransform(c);
  
  const output = new Float32Array(outputLen);
  const scale = 1 / fftSize;
  for (let i = 0; i < outputLen; i++) {
    output[i] = c[i * 2] * scale;
  }
  
  if (progressCallback) progressCallback(1.0);
  
  return Array.from(output);
}

function generateImpulseResponse(type, duration = 2.0, sampleRate = 44100) {
  const length = Math.floor(duration * sampleRate);
  const ir = new Float32Array(length);
  
  ir[0] = 1.0;
  
  for (let i = 1; i < length; i++) {
    const t = i / sampleRate;
    let value;
    
    switch (type) {
      case 'exponential':
        value = Math.exp(-t * 3);
        break;
      case 'room':
        value = Math.exp(-t * 2.5) * (1 + 0.3 * Math.sin(t * 150));
        break;
      case 'hall':
        value = Math.exp(-t * 0.8) * (1 + 0.2 * Math.sin(t * 80));
        break;
      case 'plate':
        value = Math.exp(-t * 1.5) * Math.cos(t * 200);
        break;
      case 'spring':
        value = Math.exp(-t * 3) * Math.sin(t * 400 + Math.sin(t * 100) * 5);
        break;
      case 'metal':
        value = Math.exp(-t * 20) * Math.sin(t * 3000);
        break;
      default:
        value = Math.exp(-t * 2);
    }
    
    ir[i] = value * (Math.random() * 2 - 1);
  }
  
  return Array.from(ir);
}

async function loadWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const wav = new WaveFile(buffer);
  
  wav.toSampleRate(44100);
  wav.toBitDepth('32f');
  wav.toMono();
  
  const samples = wav.getSamples();
  
  return {
    sampleRate: 44100,
    channels: 1,
    bitDepth: 32,
    samples: Array.from(samples),
    duration: samples.length / 44100
  };
}

function generatePreset(presetId) {
  const sampleRate = 44100;
  let samples;
  
  switch (presetId) {
    case 1:
      samples = generateSineNoiseMix(sampleRate, 5.0);
      return {
        name: '预设一：纯正弦波与白噪音混合',
        sampleRate,
        samples: Array.from(samples),
        duration: 5.0
      };
      
    case 2:
      samples = generateDrumPattern(sampleRate, 4.0);
      return {
        name: '预设二：包含瞬态脉冲的鼓点',
        sampleRate,
        samples: Array.from(samples),
        duration: 4.0
      };
      
    case 3:
      samples = generateMetalImpulse(sampleRate, 2.0);
      return {
        name: '预设三：极端短脉冲响应产生金属声',
        sampleRate,
        samples: Array.from(samples),
        duration: 2.0
      };
      
    case 4:
      samples = generateMicroSplice(sampleRate, 3.0);
      return {
        name: '预设四：100段微小片段拼接',
        sampleRate,
        samples: Array.from(samples),
        duration: 3.0
      };
      
    default:
      samples = generateSineNoiseMix(sampleRate, 5.0);
      return {
        name: '默认预设',
        sampleRate,
        samples: Array.from(samples),
        duration: 5.0
      };
  }
}

function generateSineNoiseMix(sampleRate, duration) {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const sine = Math.sin(2 * Math.PI * 440 * t);
    const noise = (Math.random() * 2 - 1) * 0.5;
    samples[i] = (sine * 0.5 + noise) * 0.5;
  }
  
  return samples;
}

function generateDrumPattern(sampleRate, duration) {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);
  const bpm = 120;
  const beatSamples = Math.floor((60 / bpm) * sampleRate);
  
  for (let beat = 0; beat < duration * bpm / 60; beat++) {
    const start = beat * beatSamples;
    
    if (beat % 4 === 0 || beat % 4 === 2) {
      const kickLen = Math.floor(0.1 * sampleRate);
      for (let i = 0; i < kickLen && start + i < length; i++) {
        const t = i / sampleRate;
        const freq = 60 + 40 * Math.exp(-t * 50);
        samples[start + i] += Math.exp(-t * 20) * Math.sin(2 * Math.PI * freq * t) * 0.8;
      }
    }
    
    if (beat % 4 === 1 || beat % 4 === 3) {
      const snareLen = Math.floor(0.15 * sampleRate);
      for (let i = 0; i < snareLen && start + i < length; i++) {
        const t = i / sampleRate;
        const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 15);
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 25);
        samples[start + i] += (tone * 0.4 + noise * 0.6) * 0.5;
      }
    }
    
    const hhStart = start + Math.floor(beatSamples / 2);
    const hhLen = Math.floor(0.05 * sampleRate);
    for (let i = 0; i < hhLen && hhStart + i < length; i++) {
      const t = i / sampleRate;
      samples[hhStart + i] += (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.2;
    }
  }
  
  return samples;
}

function generateMetalImpulse(sampleRate, duration) {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const carrier = Math.sin(2 * Math.PI * 880 * t);
    const modulator = Math.sin(2 * Math.PI * 440 * t);
    const fm = Math.sin(2 * Math.PI * (880 + 200 * modulator) * t);
    const envelope = Math.exp(-t * 15);
    samples[i] = (carrier * 0.5 + fm * 0.5) * envelope * 0.5;
  }
  
  return samples;
}

function generateMicroSplice(sampleRate, duration) {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);
  const numSplices = 100;
  const spliceLen = Math.floor(length / numSplices);
  
  for (let s = 0; s < numSplices; s++) {
    const start = s * spliceLen;
    const freq = 100 + s * 50;
    const type = s % 4;
    
    for (let i = 0; i < spliceLen && start + i < length; i++) {
      const t = i / sampleRate;
      let value;
      
      switch (type) {
        case 0:
          value = Math.sin(2 * Math.PI * freq * t);
          break;
        case 1:
          value = Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.5;
          break;
        case 2:
          value = (Math.random() * 2 - 1) * 0.5;
          break;
        case 3:
          value = 2 * (t * freq - Math.floor(0.5 + t * freq)) * 0.5;
          break;
      }
      
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / spliceLen));
      samples[start + i] = value * window * 0.3;
    }
  }
  
  return samples;
}

function analyzeAudio(samples) {
  let peak = 0;
  let rms = 0;
  let zeroCrossings = 0;
  let clippingCount = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
    rms += samples[i] * samples[i];
    
    if (abs >= 1.0) clippingCount++;
    
    if (i > 0) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) ||
          (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
  }
  
  rms = Math.sqrt(rms / samples.length);
  
  return {
    peakAmplitude: peak,
    rmsAmplitude: rms,
    zeroCrossingRate: zeroCrossings / samples.length,
    clippingCount,
    hasClipping: clippingCount > 0,
    crestFactor: peak / rms
  };
}

module.exports = {
  loadWavFile,
  computeFFT,
  computeSTFT,
  convolveFFT,
  generateImpulseResponse,
  generatePreset,
  analyzeAudio
};