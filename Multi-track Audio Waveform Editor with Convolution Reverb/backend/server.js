const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const audioProcessor = require('./audioProcessor');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Audio Editor API running' });
});

app.post('/api/audio/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const audioData = await audioProcessor.loadWavFile(req.file.path);
    res.json(audioData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/audio/preset/:id', (req, res) => {
  try {
    const preset = audioProcessor.generatePreset(parseInt(req.params.id));
    res.json(preset);
  } catch (error) {
    console.error('Preset error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audio/spectrogram', (req, res) => {
  try {
    const { samples, sampleRate, windowSize = 1024, hopSize = 256 } = req.body;
    
    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.json({ spectrogram: [], sampleRate });
    }
    
    console.log(`Computing STFT for ${samples.length} samples...`);
    const spectrogram = audioProcessor.computeSTFT(samples, windowSize, hopSize);
    console.log(`STFT complete: ${spectrogram.length} frames`);
    
    res.json({ spectrogram, sampleRate });
  } catch (error) {
    console.error('Spectrogram error:', error.message);
    res.json({ spectrogram: [], sampleRate });
  }
});

app.post('/api/audio/convolve', (req, res) => {
  try {
    const { audioSamples, irSamples } = req.body;
    if (!audioSamples || !irSamples) {
      return res.status(400).json({ error: 'Missing samples' });
    }
    const result = audioProcessor.convolveFFT(audioSamples, irSamples, (progress) => {
      console.log(`Convolution progress: ${(progress * 100).toFixed(1)}%`);
    });
    res.json({ samples: result });
  } catch (error) {
    console.error('Convolution error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audio/generate-ir', (req, res) => {
  try {
    const { type, duration, sampleRate = 44100 } = req.body;
    const ir = audioProcessor.generateImpulseResponse(type, duration, sampleRate);
    res.json({ samples: ir, sampleRate });
  } catch (error) {
    console.error('IR generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/:trackId', (req, res) => {
  try {
    const history = db.getTrackHistory(req.params.trackId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/history', (req, res) => {
  try {
    const { trackId, action, data, timestamp } = req.body;
    const id = db.addHistoryEntry(trackId, action, data, timestamp);
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/presets', (req, res) => {
  try {
    const presets = db.getAllImpulseResponsePresets();
    res.json({ presets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/presets', (req, res) => {
  try {
    const { name, description, samples, sampleRate } = req.body;
    const id = db.addImpulseResponsePreset(name, description, samples, sampleRate);
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audio/analyze', (req, res) => {
  try {
    const { samples } = req.body;
    const analysis = audioProcessor.analyzeAudio(samples);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Audio Editor Backend running on http://localhost:${PORT}`);
  db.initDatabase();
});