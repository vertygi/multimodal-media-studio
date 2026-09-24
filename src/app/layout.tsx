import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Drama Studio — Chinese Drama Shorts & TikTok Engine",
  description: "End-to-end studio for viral Chinese Drama production (Shorts, Reels, TikTok) with Omniroute & fal.ai MiniMax H3 Max.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎬</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-drama-950 text-slate-100 antialiased selection:bg-drama-gold/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
