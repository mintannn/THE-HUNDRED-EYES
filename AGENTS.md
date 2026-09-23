<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Production deployment

The artwork is deployed to **mintannns-projects/the-hundred-eyes** on Vercel, at **https://eyes.mintan.org**.
Before deployment, verify the authenticated account can access that team and that the local project link matches it. Always pass `--scope mintannns-projects`; do not infer the destination from a default CLI account.
The maintainer uses a separate CLI profile at `~/.config/vercel-mintannn`. See `docs/DEPLOYMENT.md` for commands. Credentials and `.vercel` stay outside Git.
