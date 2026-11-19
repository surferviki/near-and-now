import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

// Sample catalog only. A later version can replace this array with approved feeds.
const catalog = {
  uk: [
    { title: 'Saturday Park Run', category: 'running', place: 'Battersea Park', audience: 'family', tags: ['run', 'running', 'outside', 'active', 'fitness', 'sport'] },
    { title: 'Little Makers: Big Colour', category: 'creative', place: 'The Drawing Room', audience: 'family', tags: ['kids', 'children', 'creative', 'colour', 'art', 'craft'] },
    { title: 'Wild City Nature Walk', category: 'nature', place: 'Clapham Common', audience: 'family', tags: ['outside', 'nature', 'walk', 'calm', 'family'] },
    { title: 'Clay & Chai Workshop', category: 'craft', place: 'Common Ground Studio', audience: 'adults', tags: ['creative', 'craft', 'art', 'hobby', 'adult', 'relax'] }
  ],
  tamil_nadu: [
    { title: 'Sunday Little Artists', category: 'creative', place: 'Anna Nagar Community Hall, Chennai', audience: 'family', tags: ['kids', 'children', 'creative', 'colour', 'art', 'craft'] },
    { title: 'Marina Morning Walk', category: 'nature', place: 'Marina Beach, Chennai', audience: 'family', tags: ['outside', 'nature', 'walk', 'calm', 'family'] },
    { title: 'Chennai 5K Community Run', category: 'running', place: 'Besant Nagar Beach, Chennai', audience: 'family', tags: ['run', 'running', 'outside', 'active', 'fitness', 'sport'] },
    { title: 'Pongal Pottery & Chai', category: 'craft', place: 'Mylapore Arts Studio, Chennai', audience: 'adults', tags: ['creative', 'craft', 'art', 'hobby', 'adult', 'relax'] }
  ]
};

function findSampleEvents(region, intent, audience) {
  const terms = intent.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2);
  const inferredAudience = audience ?? (/kid|child|family|toddler|baby/.test(intent.toLowerCase()) ? 'family' : 'mixed');
  return catalog[region]
    .map(event => {
      const haystack = `${event.title} ${event.category} ${event.tags.join(' ')}`.toLowerCase();
      const relevance = terms.reduce((score, term) => score + (haystack.includes(term) ? 2 : 0), 0);
      const audienceBoost = inferredAudience === 'family' && event.audience === 'family' ? 5
        : inferredAudience === 'adults' && event.audience === 'adults' ? 5 : 0;
      return { ...event, score: relevance + audienceBoost };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...event }) => event);
}

function buildServer() {
  const server = new McpServer({ name: 'near-and-now-events', version: '0.1.0' });
  server.registerTool(
    'search_sample_events',
    {
      description: 'Search Near & Now sample activities by region, mood or hobby, and audience. Returns illustrative demo events, not live listings.',
      inputSchema: z.object({
        region: z.enum(['uk', 'tamil_nadu']).describe('Which sample event catalog to search.'),
        intent: z.string().min(1).max(300).describe('A short mood, hobby, or activity request.'),
        audience: z.enum(['family', 'adults', 'mixed']).optional().describe('Optional audience preference inferred by the caller.')
      })
    },
    async ({ region, intent, audience }) => {
      const events = findSampleEvents(region, intent, audience);
      return {
        content: [{ type: 'text', text: JSON.stringify({ source: 'demo', region, events }, null, 2) }]
      };
    }
  );
  return server;
}

// MCP stdio uses stdout for protocol messages. Keep any diagnostics on stderr.
void serveStdio(buildServer);
