# THE HUNDRED EYES — Jev use case

- **Live artwork:** https://eyes.mintan.org
- **Source:** https://github.com/mintannn/THE-HUNDRED-EYES
- **Author:** [@uniminyo](https://x.com/uniminyo)
- **License:** MIT
- **Category:** Interactive media art / real-time interfaces / parallel structured decisions
- **Preview:** [1200 × 630 screenshot](../public/og/the-hundred-eyes.jpg)

## Short description

One post, a hundred readings. THE HUNDRED EYES is a browser-based media artwork that turns Jev's typed decisions into a room of a hundred individual eyes. Four fixed, amplified perspectives appear first; opening analytics reveals the same audience counted equally. Rewriting reaches the same people again, exposing the distance between a loud impression and the full distribution.

## How it uses Jev

A post is the shared `state`. Each authored observer contributes one six-option **Choice** and four independent **Scores**: interest, affection, discomfort and desire to speak. The app sends 500 questions in four parallel batches of 25 observers, validates the complete response, then updates the room.

The output is consumed as structured data: scores shape eyes and gaze, choices select color and a short authored thought, and counts form the analytics. No free-form prose is generated or parsed. Reaction totals are never preset. The four amplified observers and their reach are authored properties; confidence remains separate from emotional intensity.

This is a use of Jev's independent typed judgements as material for an artwork. It does not claim that no other model could reproduce the effect, that the simulated people predict real audiences, or that the blink animation measures model latency.

## Implementation to inspect

| Part | Source |
| --- | --- |
| The 100 fictional observers and reaction criteria | [`lib/personas.ts`](../lib/personas.ts) |
| Shared Score rubrics | [`lib/judgement-criteria.ts`](../lib/judgement-criteria.ts) |
| Question construction, parallel requests, response validation | [`lib/jev-server.ts`](../lib/jev-server.ts) |
| Server-only endpoint | [`app/api/observe/route.ts`](../app/api/observe/route.ts) |
| Fixed reach and interpretation of the readings | [`lib/experience.ts`](../lib/experience.ts) |
| Spatial eyes, radial blinks and progressive disclosure | [`components/EyesScene.tsx`](../components/EyesScene.tsx) |
| Synthesis of the ambient audio | [`components/Ambience.tsx`](../components/Ambience.tsx) |

## Try it

Post an ordinary sentence, pause with the amplified thoughts, then open **ポストアナリティクス**. Inspect a person through their eye or **100人の内側**, rewrite the sentence, and observe what changed.

The app is usable without an API key in its explicitly disclosed local sketch mode. Live Jev access requires the developer's own TypeSafe key. Only explicitly posted text is sent to TypeSafe; the app has no post database.

## One-line directory entry

```md
- [THE HUNDRED EYES](https://github.com/mintannn/THE-HUNDRED-EYES) — An interactive media artwork using Jev Choice + Score to turn one post into 100 fictional readings: four amplified voices first, the full audience on reveal. [Live demo](https://eyes.mintan.org). MIT.
```

This entry is prepared for a project directory submission. It does not imply acceptance into an official or community showcase.
