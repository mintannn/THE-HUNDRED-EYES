export function acceptsOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    // Next's request URL can use its internal listening address. The incoming
    // Host is the public address the browser actually posted to.
    const destination = new URL(request.url);
    const host = request.headers.get("host");
    const publicOrigin = host ? new URL(`${destination.protocol}//${host}`).origin : destination.origin;
    return origin === publicOrigin;
  } catch {
    return false;
  }
}
