# Near & Now

Near & Now helps people find nearby activity venues or upcoming events from a mood, hobby, or plan and a location in the UK or Tamil Nadu.

## How live listings work

- **Tamil Nadu:** the first integration uses the public Chennai venue feed from [Playz](https://playz.in/data/). Results are activity places such as sports venues and kids' play zones, not one-off events. The directory is refreshed daily and requires attribution. Distance is estimated from the entered PIN code using the PIN office coordinates; a PIN code can cover a broad area.
- **United Kingdom:** the app uses the free [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) for upcoming ticketed events within about 25 km. It needs a free Ticketmaster developer API key in `TICKETMASTER_API_KEY`. Listings depend on the provider's coverage and do not represent every local event.
- UK postcodes are geocoded using [Postcodes.io](https://api.postcodes.io/docs/overview/). Tamil Nadu PIN coordinates are looked up through the [India Pincode API](https://aniket-thapa.github.io/india-pincode-api/), which attributes its data to India's Department of Posts and is licensed CC BY-NC 4.0. This is suitable for non-commercial use; replace it with a compatible source before commercial use.
- OpenRouter only interprets the user's words for relevance ranking. It does not create or fetch listings. Event data is fetched server-side and the provider links are shown with each result.

## Run it

The APIs run as Vercel Functions, so use `vercel dev` rather than opening `index.html` directly. Copy `.env.example` to `.env.local`, add your OpenRouter key and optional model, and add a Ticketmaster Discovery API key for UK results. Never put provider keys in browser code or commit them.

## AI and MCP learning notes

`api/interpret.js` asks OpenRouter for a small JSON classification, validates the audience and theme values, and returns the classification to the browser. The browser ranks provider-sourced listings using this result and ordinary JavaScript text matching.

`mcp-server/` contains a learning MCP server that registers a sample search tool over stdio. The website currently calls its own Vercel HTTP functions; it does not call the MCP server. MCP is a protocol for discovering and invoking tools, while the website's provider integrations use regular HTTPS APIs.
