import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint to call Gemini securely
app.post('/api/generate', async (req, res) => {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: { message: 'Server misconfigured: missing GOOGLE_API_KEY' } });
    }

    const { contents } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: { message: 'Missing contents in request body' } });
    }

    const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash-preview-05-20';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

