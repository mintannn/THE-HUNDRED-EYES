import { jevKey, observeWithJev } from "@/lib/jev-server";
import { acceptsOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const maxDuration = 30;

export function GET() {
  return Response.json({ engine: jevKey() ? "jev" : "mock" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!acceptsOrigin(request)) return new Response(null, { status: 403 });
  if (!jevKey()) return Response.json({ error: "not_configured" }, { status: 503 });
  let text: string;
  try {
    if (Number(request.headers.get("content-length")) > 4096) throw new Error();
    const raw = await request.text();
    if (raw.length > 4096) throw new Error();
    const body = JSON.parse(raw);
    if (typeof body.text !== "string") throw new Error();
    text = body.text.trim();
    if (!text || Array.from(text).length > 140) throw new Error();
  } catch {
    return Response.json({ error: "invalid_post" }, { status: 400 });
  }
  try {
    const observation = await observeWithJev(text, request.signal);
    return Response.json(observation, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
