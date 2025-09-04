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

    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).send(responseText);

  } catch (err) {
    console.error('[DEBUG] CATCH BLOCK ERROR:', err);
    res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
  }
};

Step 3: Update package.json

    Open your package.json file.
    Delete all the text inside it and replace it with the code below. This new version is simplified and corrected to work with the new serverless function.

Code for package.json:

{
  "name": "prompt-superior-proxy",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "dotenv": "^16.4.5",
    "node-fetch": "^2.7.0"
  }
}
