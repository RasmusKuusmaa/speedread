import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const passageSerif = Source_Serif_4({
  variable: "--font-passage-serif",
  subsets: ["latin"],
});

const chromeSans = Inter({
  variable: "--font-chrome-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reading trainer",
  description: "Train reading comprehension and rate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${passageSerif.variable} ${chromeSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
