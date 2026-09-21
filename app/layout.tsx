import type { Metadata } from "next";
import { DotGothic16, Press_Start_2P } from "next/font/google";
import "./globals.css";

// 写実の目を、冷たいピクセルフォントの計測値が採寸する。その対比を作る
const dot = DotGothic16({ variable: "--font-dot", weight: "400", subsets: ["latin"], display: "swap" });
const press = Press_Start_2P({ variable: "--font-press", weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "衆目 / THE HUNDRED EYES",
  description: "一文を書くと、100人の他人が同時にあなたを見る。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dot.variable} ${press.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
