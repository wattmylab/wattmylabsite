import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: homelab power and electricity cost calculator`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Work out what your homelab costs to run per year, and whether swapping old servers for efficient kit pays off. Free, no sign-up, UK, US and EU prices.",
  openGraph: { siteName: SITE_NAME, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-panel">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Watts<span className="text-accent-strong">My</span>Lab
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/devices" className="hover:text-foreground">
                Devices
              </Link>
              <Link href="/about" className="hover:text-foreground">
                How it works
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          {SITE_NAME} · {TAGLINE} · Estimates only; measure your own kit for exact figures.
        </footer>
      </body>
    </html>
  );
}
