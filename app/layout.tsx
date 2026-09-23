import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "@fontsource/yuji-boku/400.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  authors: [{ name: "@uniminyo", url: "https://x.com/uniminyo" }],
  openGraph: {
    type: "website", locale: "ja_JP", url: "/", siteName: SITE_TITLE,
    title: SITE_TITLE, description: SITE_DESCRIPTION,
    images: [{
      url: "/og/the-hundred-eyes.jpg", width: 1200, height: 630,
      alt: "暗闇に浮かぶ百の目と中央の投稿画面。衆目 / THE HUNDRED EYES。",
    }],
  },
  twitter: {
    card: "summary_large_image", creator: "@uniminyo",
    title: SITE_TITLE, description: SITE_DESCRIPTION,
    images: [{
      url: "/og/the-hundred-eyes.jpg",
      alt: "暗闇に浮かぶ百の目と中央の投稿画面。衆目 / THE HUNDRED EYES。",
    }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
