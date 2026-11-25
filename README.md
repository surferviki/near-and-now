# MoodLift

MoodLift is a responsive, browser-first mood-to-motivation experience. A visitor chooses a mood and intensity, then receives a thoughtful reflection, one doable reset, and a surprise inspired by Rajinikanth's words and cinema.

## MVP architecture

- Curated recommendations live in [`data/content.json`](data/content.json), [`data/content-expansion.json`](data/content-expansion.json), and [`data/catalog-expansion.json`](data/catalog-expansion.json). Together they contain 32 thoughts, 23 short stories, 36 activities, 56 song references and 52 film recommendations.
- The deterministic recommendation engine is in [`src/recommendation.ts`](src/recommendation.ts). It scores local content, avoids recently shown items in the current session, pairs stories with related themes, and keeps high-intensity activity suggestions low-energy.
- The interface is plain HTML and CSS with a small TypeScript entry point. No runtime AI, database, account, or external recommendation API is used.
- The dark hero uses the owner-provided Rajinikanth reference image as a high-contrast silhouette treatment with subtle desktop pointer parallax and a reduced-motion fallback.
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

Edit the JSON in `data/content.json` or `data/content-expansion.json`. IDs must be unique across both files within each collection, mood references must match the mood taxonomy, every song must point to an existing movie, and only approved original thoughts and stories are shown. Movie and song references should remain factual, with links pointing to official platforms. Do not add lyrics, film dialogue, stills, posters, or media files without the appropriate rights.

The first set focuses on original English thoughts, stories, and practical activities. Film/music references are metadata plus outbound links; the application does not stream or host entertainment media. Music links open curated label or rightsholder album/video pages; film links open a general Sun NXT guide and do not promise that every listed title is currently available to stream.

## Attribution clarity

Original reflections and stories are app-authored and must not be attributed to Rajinikanth. The sourced Baasha dialogue is shown only for selected moods, with the film attribution and source beside it. Its English rendering is kept short; the app's interpretation and story are clearly labeled as original work inspired by the idea. Speech paraphrases and unverified attributions in the supplied reference have not been presented as direct quotes.

## Privacy and safety

Mood, intensity, reason, and time are used only in the browser to select recommendations. The app stores recent content IDs and coarse feedback in `sessionStorage`; it does not save mood history or send mood data to a server. It is not mental-health treatment or crisis care. High-intensity suggestions use low-energy activities and include gentle safety notes.

## Rights and credits

This is an independent fan-made concept, not affiliated with or endorsed by Rajinikanth, his representatives, film producers, studios, music labels, or other rights holders. See `data/ASSET_RIGHTS.md` for the supplied photos' current rights status. The notice does not grant permission to use third-party material.
