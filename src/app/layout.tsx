import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { StorageRecoveryBanner } from "@/components/storage-recovery-banner";
import { StoreProvider } from "@/lib/storage/store-provider";
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
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <StoreProvider>
          <StorageRecoveryBanner />
          <SiteHeader />
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6">
            {children}
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
