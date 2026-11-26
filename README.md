# MoodLift

MoodLift is a responsive, browser-first mood-to-motivation experience. A visitor chooses a mood and intensity, then receives an original quote, one doable reset, and a music or film suggestion matched to that moment.

## MVP architecture

- Curated mood content lives in [`data/content.json`](data/content.json) and [`data/content-expansion.json`](data/content-expansion.json). A broader film and music catalog lives in [`data/general-catalog.json`](data/general-catalog.json), currently covering 51 films and 36 songs across Indian cinema and performers.
- The deterministic recommendation engine is in [`src/recommendation.ts`](src/recommendation.ts). It scores local content, avoids recently shown items in the current session, pairs stories with related themes, and keeps high-intensity activity suggestions low-energy.
- The interface is plain HTML and CSS with a small TypeScript entry point. No runtime AI, database, account, or external recommendation API is used.
- The dark hero uses an original generated Buddha statue image with subtle desktop pointer parallax and a reduced-motion fallback.
- The previous Near & Now page is retained in `legacy-near-and-now/`. Its Vercel API routes remain in `api/` but the MoodLift page does not call them.
- `mcp-server/` remains a separate learning example. The new website does not depend on it.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Vite opens the browser-first experience at the local URL it prints. Create a production bundle with `npm run build`; preview it with `npm run preview`.

## Content editing

Edit the JSON in `data/content.json`, `data/content-expansion.json`, or `data/general-catalog.json`. IDs must be unique within each collection, mood references must match the mood taxonomy, every song must point to an existing movie, and only approved original thoughts and stories are shown. Catalog links open external search results. Do not add lyrics, film dialogue, stills, posters, or media files without the appropriate rights.

Thoughts and stories are original English content; film and music entries are metadata with outbound discovery links. The application does not stream or host entertainment media.

## Privacy and safety

Mood, intensity, reason, and time are used only in the browser to select recommendations. The app stores recent content IDs and coarse feedback in `sessionStorage`; it does not save mood history or send mood data to a server. It is not mental-health treatment or crisis care. High-intensity suggestions use low-energy activities and include gentle safety notes.

## Rights and credits

MoodLift is an independent project and is not affiliated with or endorsed by any film, music, or media rights holders. See `data/ASSET_RIGHTS.md` for image notes. The notice does not grant permission to use third-party material.
