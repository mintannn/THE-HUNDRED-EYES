// A Web Intent opens X's own composer; it never publishes on the visitor's behalf.
export function xPostIntent(text: string) {
  const intent = new URL("https://x.com/intent/tweet");
  intent.searchParams.set("text", text);
  return intent.toString();
}
