import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Vercel automatically parses the body for POST requests
  // It also handles CORS, so we don't need the express/cors boilerplate.

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error('[DEBUG] GOOGLE_API_KEY is not set.');
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
    res.status(200).json(data);

  } catch (err) {
    console.error('[DEBUG] CATCH BLOCK ERROR:', err);
    res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
  }
}
