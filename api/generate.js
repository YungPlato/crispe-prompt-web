const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error('[DEBUG] GOOGLE_API_KEY is not set.');
      res.status(500).json({ error: { message: 'Server misconfigured: missing GOOGLE_API_KEY' } });
      return;
    }

    // Vercel automatically parses the body for POST requests
    const { contents, generationConfig } = req.body || {};
    if (!contents) {
      res.status(400).json({ error: { message: 'Missing contents in request body' } });
      return;
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

    // Set the content type for the response to the client
    res.setHeader('Content-Type', 'application/json');

    // Pass through the status code and the response body from the upstream API
    res.status(upstream.status).send(responseText);

  } catch (err) {
    console.error('[DEBUG] CATCH BLOCK ERROR:', err);
    res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
  }
};
