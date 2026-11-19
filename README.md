# Near & Now

A front-end prototype for finding nearby activities from a natural-language mood or hobby and a location in the UK or Tamil Nadu.

## Run it

Open `index.html` in a browser for the no-install demo. The Vercel API route needs Vercel's local dev server (`vercel dev`) to run; direct `file://` preview uses the keyword-ranking fallback.

## What works in this prototype

- Switches between UK postcode and six-digit Tamil Nadu PIN code input.
- Checks the basic shape of those location inputs.
- Does not yet map a postcode/PIN to coordinates or use it to calculate the displayed distances; those values are illustrative demo data.
- Ranks sample events using words in the mood/hobby, then gives family-friendly events a boost for kid-related queries and adult-oriented events a boost for adult-focused queries.
- Includes illustrative sample events for Battersea/Clapham in London and Chennai. These are demo data, not live listings.
- When deployed with `OPENROUTER_API_KEY`, asks OpenRouter to classify the mood/hobby into an audience and a few allowed themes. The browser never receives the API key, and the postcode is not sent to OpenRouter.

## A useful first AI/MCP lesson

The `api/interpret.js` Vercel Function calls OpenRouter's OpenAI-compatible chat completions endpoint. It asks for a small JSON classification, validates the returned audience and theme values, and sends only that classification back to the browser. Its API key must remain in a server environment variable. Without a key, the site falls back to ordinary JavaScript keyword matching.

The final event ranking is still ordinary JavaScript: it compares the mood words and AI themes with event tags and boosts events suitable for the inferred audience. This keeps the AI's role narrow and makes ranking easy to inspect. The API does not send the postcode to OpenRouter.

The `mcp-server/` folder contains a first standalone MCP server. It registers `search_sample_events` with a Zod input schema (`region`, `intent`, optional `audience`), so an MCP host can discover the tool and validate arguments before it runs. It speaks MCP over stdio, the common transport when a host launches a local tool process. Run it from that folder with `npm install` and `npm start`, then connect an MCP Inspector or another MCP host to `node index.js`.

This MCP server is currently a learning/demo companion; the deployed website does not call it yet. Vercel serverless functions cannot keep a local stdio process running between requests. To wire the website to MCP later, we can expose the tool over remote Streamable HTTP (for example as a Vercel function) and have the backend use an MCP client, or deploy the MCP service separately.

A next architecture step could be:

1. **Event data source** — a server fetches events from trusted listings/APIs.
2. **MCP server** — evolve `search_sample_events` into `search_events(location, radius, date_range)` and connect it to a live source. MCP is a protocol that lets an AI host discover and call tools offered by another process or service. The website's OpenRouter request is a normal HTTPS API call today; it is not MCP yet.
3. **Event sources** — connect a source for each region, normalize their fields, and keep attribution and booking links. Chennai event APIs may require a paid data key, so verify the terms before depending on one.
4. **Ranking** — combine relevance, distance, date, age suitability, and source confidence; explain why each result matched.

The model should not invent event listings. Results should come from event sources, and the interface should indicate when listings were checked. Postcode geocoding should also happen on the server or through a reputable provider, with only the minimum location data needed.

## OpenRouter and Vercel setup

1. Push this project to a Git repository and import it into Vercel. The plain HTML/CSS/JS site is served as static files; files under `api/` become serverless functions.
2. In the Vercel project settings, add `OPENROUTER_API_KEY` and (optionally) `OPENROUTER_MODEL` and `APP_URL` as environment variables. Redeploy after adding them.
3. For local API development, install the Vercel CLI and run `vercel dev`; use a local `.env` based on `.env.example`. Never commit `.env` or put the key in `app.js`.

Vercel's Hobby plan currently includes a free tier for personal projects. OpenRouter usage is billed/limited separately according to the selected model and account settings; the hosting plan does not cover model calls.
