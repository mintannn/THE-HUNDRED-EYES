# Contributing

Issues and pull requests are welcome. Include the device/browser and reproduction steps for visual or interaction bugs.

```sh
npm ci
npx playwright install
npm run dev -- --port 3001
```

The app runs without a key using a disclosed local sketch. To test real Jev responses, copy `.env.example` to an untracked `.env.local` and supply your own key.

Before submitting a change:

- Run `npm run lint`, `npm run build`, and the Playwright tests relevant to the change.
- Check the experience on desktop and a small mobile viewport.
- Keep reaction counts derived from the readings. Preserve the distinction between authored amplification, model scores, and model confidence.
- Reuse `tests/fixtures.ts` so automated browser tests do not call Jev or post to X.
- Keep credentials, private posts and `.env.local` out of code, screenshots, logs and Git history.

Changes to the narrative or visual language benefit from a short explanation and screenshots. Contributions are provided under the project's MIT license.
