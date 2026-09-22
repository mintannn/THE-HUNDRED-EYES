import type { Metadata } from "next";
import "@fontsource/yuji-boku/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "衆目 / THE HUNDRED EYES",
  description: "ひとつのポスト、百の受け取り方。届くことと聞こえることを、同じ暗闇の中で体験するインタラクティブアート。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
