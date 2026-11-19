const ALLOWED_THEMES = new Set([
  'outdoors', 'running', 'fitness', 'nature', 'walking', 'creative', 'art',
  'craft', 'music', 'food', 'market', 'relaxing', 'social', 'family', 'storytelling'
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const intent = typeof req.body?.intent === 'string' ? req.body.intent.trim() : '';
  if (!intent || intent.length > 300) {
    return res.status(400).json({ error: 'Enter a mood or hobby (up to 300 characters).' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI intent service is not configured.' });

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://near-and-now.vercel.app',
        'X-Title': 'Near & Now'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Classify the user activity request for event search. Return JSON only with audience (family, adults, or mixed) and themes (array of 1 to 3 short strings chosen only from: outdoors, running, fitness, nature, walking, creative, art, craft, music, food, market, relaxing, social, family, storytelling). Choose family when children, kids, or family activities are explicitly requested; adults only when adult-only is explicit; otherwise mixed. Do not answer the user or invent events.'
          },
          { role: 'user', content: intent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 120
      }),
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) return res.status(502).json({ error: 'The AI provider could not interpret this search.' });
    const payload = await upstream.json();
    const raw = payload.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);
    const audience = ['family', 'adults', 'mixed'].includes(parsed.audience) ? parsed.audience : 'mixed';
    const themes = Array.isArray(parsed.themes)
      ? [...new Set(parsed.themes.map(value => String(value).toLowerCase().trim()).filter(value => ALLOWED_THEMES.has(value)))].slice(0, 3)
      : [];
    return res.status(200).json({ method: 'openrouter', audience, themes });
  } catch (error) {
    return res.status(502).json({ error: 'The AI provider could not interpret this search.' });
  }
};
