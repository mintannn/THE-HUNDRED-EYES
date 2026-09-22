import type { CSSProperties } from "react";

export default function Icon({ name, size = 18, style }: { name: string; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
      {name === "eye" && <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></>}
      {name === "arrow" && <><path d="M4 12h15M14 6l6 6-6 6" /></>}
      {name === "close" && <path d="m6 6 12 12M18 6 6 18" />}
      {name === "love" && <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />}
      {name === "useful" && <path d="M6 3h12v18l-6-4-6 4V3Z" />}
      {name === "meh" && <><path d="M7 15h10M7 9h.01M17 9h.01" /><circle cx="12" cy="12" r="9" /></>}
      {name === "annoying" && <><path d="m5 7 5 2m9-2-5 2M8 17c2-2 6-2 8 0" /><circle cx="12" cy="12" r="10" /></>}
      {name === "gross" && <><path d="m7 7 3 3m0-3-3 3m7-3 3 3m0-3-3 3M8 16h8" /><circle cx="12" cy="12" r="10" /></>}
      {name === "envy" && <><path d="m12 2 8 10-8 10-8-10 8-10ZM4 12h16" /></>}
      {name === "sound" && <><path d="m11 4-5 4H2v8h4l5 4V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}
      {name === "mute" && <><path d="m11 4-5 4H2v8h4l5 4V4Zm5 5 6 6m0-6-6 6" /></>}
      {name === "orbit" && <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)" /><path d="M7 3a10 10 0 0 1 13 12M17 21A10 10 0 0 1 4 9" /></>}
      {name === "expand" && <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />}
      {name === "reset" && <><path d="M3 10a9 9 0 1 1 1 7M3 4v6h6" /></>}
      {name === "info" && <><circle cx="12" cy="12" r="10" /><path d="M12 11v6M12 7h.01" /></>}
      {name === "chevron" && <path d="m9 5 7 7-7 7" />}
      {name === "down" && <path d="m6 9 6 6 6-6" />}
      {name === "profile" && <><circle cx="12" cy="8" r="4" fill="currentColor" stroke="none" /><path d="M4 22v-3a8 8 0 0 1 16 0v3Z" fill="currentColor" stroke="none" /></>}
      {name === "globe" && <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 7h14M5 17h14" /></>}
      {name === "image" && <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>}
      {name === "gif" && <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M8 9H5v6h3v-3H6m5-3v6m4 0V9h4m-4 3h3" /></>}
      {name === "poll" && <><path d="M5 3v18M9 6h9M9 12h12M9 18h6" /></>}
      {name === "smile" && <><circle cx="12" cy="12" r="9" /><path d="M8 14a4 4 0 0 0 8 0M8 9h.01M16 9h.01" /></>}
      {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4m8-4v4M7 14h3m4 0h3m-10 3h3" /></>}
      {name === "location" && <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>}
      {name === "reply" && <path d="M21 11c0 5-4 8-9 8l-6 3v-5c-2-1-3-3-3-6 0-5 4-8 9-8s9 3 9 8Z" />}
      {name === "repost" && <><path d="m3 7 3-3 3 3M6 4v12h8m7 1-3 3-3-3m3 3V8h-8" /></>}
      {name === "views" && <path d="M4 21V11m5 10V3m6 18V8m5 13V14" />}
    </svg>
  );
}
