# THE HUNDRED EYES / 衆目

One post, a hundred readings. An interactive media artwork about the difference between what reaches people and what becomes audible.

By [@uniminyo](https://x.com/uniminyo) · [日本語](./README.md)

## The experience

Posting sends one wave of blinks outward from the words. The eyes stay where they are. Stronger voices receive light and a short thought; everyone else remains faintly present.

Opening post analytics illuminates the same hundred eyes and shows their reaction counts. There is no prescribed indifferent majority. The archive expands each person in place, with a matching eye portrait and four emotional dimensions.

Rewriting reaches the same people again. Analytics show changes from the preceding post. Nothing is evaluated while typing; identical words reuse their result within the session. After a pause, the visitor's words and revisions remain, followed by “その言葉は、誰のために。” — Who are those words for?

- **判定基準** in artwork information exposes the criteria actually passed to Jev. The explanation and API use shared definitions.
- **Xでポスト** in analytics opens X's own composer with the current post text. The visitor confirms publication on X. No results or promotional copy are appended automatically.
- Mobile, reduced motion and a lightweight WebGL fallback are supported. Sound is optional.

## Run locally

```sh
npm ci
npm run dev -- --port 3001
```

Open `http://localhost:3001`. Without a key, a clearly disclosed local rule-based sketch is used. To enable Jev, create a Git-ignored `.env.local`:

```dotenv
TYPESAFE_API_KEY=your_key_here
JEV_MODEL=jev-latest
```

Never expose the key through a `NEXT_PUBLIC_` variable. See [.env.example](./.env.example).

## Model and authorship

Each person receives one Choice and four independent Scores: interest, affection, discomfort and desire to speak. The 500 questions are sent in four parallel requests of 25 people. Only a complete, validated response updates the room; failures preserve the previous observation.

Persona definitions, short thoughts and reach are authored. Jev does not generate the displayed prose. Reaction counts emerge from the readings, and confidence is not used as emotional intensity. These are fictional observers, not measured people or X analytics.

Blink timing is artistic choreography, not Jev execution telemetry. Only explicitly posted text is sent to TypeSafe.

## Validate and deploy

```sh
npm run lint
npm run build
npm run test:e2e
```

Automated checks use local or synthetic responses; they do not send live posts to Jev or X. Install test browsers with `npx playwright install` if needed.

- [Current implementation, previews and live connection records (Japanese)](./docs/ATTENTION-EXPERIENCE.md)
- [Vercel deployment instructions (Japanese)](./docs/DEPLOYMENT.md)

Earlier design records remain in `docs` and Git history. Historical descriptions of fixed counts or evaluation while typing do not describe this build.
