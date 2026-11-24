# Superstar Mode

Superstar Mode is a responsive, browser-first mood-to-motivation experience inspired by the energy of Tamil cinema. A visitor chooses a mood and intensity, then receives one connected Mind, Body, and Entertainment experience.

## MVP architecture

- Curated recommendations live in [`data/content.json`](data/content.json).
- The deterministic recommendation engine is in [`src/recommendation.ts`](src/recommendation.ts). It scores local content, avoids recently shown items in the current session, pairs stories with related themes, and keeps high-intensity activity suggestions low-energy.
- The interface is plain HTML and CSS with a small TypeScript entry point. No runtime AI, database, account, or external recommendation API is used.
- The two Rajinikanth photos supplied for this project are in `public/images/`. CSS uses layered cards, pointer parallax on desktop, gentle drift, and a reduced-motion fallback. The images are provided project assets; their reuse rights have not been independently verified. Check [`data/ASSET_RIGHTS.md`](data/ASSET_RIGHTS.md) before a public release.
- The previous Near & Now page is retained in `legacy-near-and-now/`. Its Vercel API routes remain in `api/` but the Superstar Mode page does not call them.
- `mcp-server/` remains a separate learning example. The new website does not depend on it.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Vite opens the browser-first experience at the local URL it prints. Create a production bundle with `npm run build`; preview it with `npm run preview`.

## Content editing

Edit the JSON in `data/content.json`. IDs must be unique within each collection, mood references must match the mood taxonomy, every song must point to an existing movie, and only approved original thoughts and stories are shown. Movie and song references should remain factual, with links pointing to official platforms. Do not add lyrics, film dialogue, stills, posters, or media files without the appropriate rights.

The first set focuses on original English thoughts, stories, and practical activities. Film/music references are metadata plus outbound links; the application does not stream or host entertainment media. Tamil-language interface/content can be added once there is enough reviewed coverage.

## Privacy and safety

Mood, intensity, reason, and time are used only in the browser to select recommendations. The app stores recent content IDs and coarse feedback in `sessionStorage`; it does not save mood history or send mood data to a server. It is not mental-health treatment or crisis care. High-intensity suggestions use low-energy activities and include gentle safety notes.

## Rights and credits

This is an independent fan-made concept, not affiliated with or endorsed by Rajinikanth, his representatives, film producers, studios, music labels, or other rights holders. See `data/ASSET_RIGHTS.md` for the supplied photos' current rights status. The notice does not grant permission to use third-party material.
