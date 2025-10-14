import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 9500); // 9.5 seconds

  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error('[DEBUG] GOOGLE_API_KEY is not set.');
      res.status(500).json({ error: { message: 'Server misconfigured: missing GOOGLE_API_KEY' } });
      return;
    }

    const { contents, generationConfig } = req.body || {};
    if (!contents) {
      res.status(400).json({ error: { message: 'Missing contents in request body' } });
      return;
    }

    const model = process.env.GOOGLE_MODEL || 'gemini-1.5-flash-001';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${googleApiKey}`;

    console.log(`[DEBUG] Making request to Google API.`);
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
      signal: controller.signal
    });

    console.log(`[DEBUG] Upstream response status: ${upstream.status}`);
    const responseText = await upstream.text();
    console.log(`[DEBUG] Upstream response text snippet: ${responseText.substring(0, 500)}`);

    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).send(responseText);

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[DEBUG] Google API request timed out.');
      res.status(504).json({ error: { message: 'Request to upstream API timed out.' } });
    } else {
      console.error('[DEBUG] CATCH BLOCK ERROR:', err);
      res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
    }
  } finally {
    clearTimeout(timeout);
  }
}
