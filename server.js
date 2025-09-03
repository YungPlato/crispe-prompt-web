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

    const { contents, generationConfig } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: { message: 'Missing contents in request body' } });
    }

    const model = process.env.GOOGLE_MODEL || 'gemini-1.5-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${googleApiKey}`;

    console.log(`[DEBUG] Making request to Google API.`);
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig })
    });

    console.log(`[DEBUG] Upstream response status: ${upstream.status}`);
    const responseText = await upstream.text();
    console.log(`[DEBUG] Upstream response text snippet: ${responseText.substring(0, 500)}`);

    if (!upstream.ok) {
      console.error(`[DEBUG] Upstream request failed.`);
      // Try to parse the error response as JSON, but fall back to raw text
      try {
        const errorData = JSON.parse(responseText);
        return res.status(upstream.status).json(errorData);
      } catch (e) {
        // If it's not JSON, it's likely the HTML error page.
        // We return a structured error to our client, but the real details are in the Vercel logs.
        return res.status(upstream.status).json({
            error: {
                message: "Upstream API returned a non-JSON response.",
                status: upstream.status,
                body_snippet: responseText.substring(0, 200)
            }
        });
      }
    }

    const data = JSON.parse(responseText);
    return res.status(200).json(data);

  } catch (err) {
    console.error('[DEBUG] CATCH BLOCK ERROR:', err);
    return res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

