import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SiteHeader } from "./components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Eurovision-style voting boards for any group decision. Drag your 1, 2, 3, 4, 5, 6, 7, 8, 10, 12 onto items and see who wins.";

export const metadata: Metadata = {
  title: {
    default: "Voting Stage — Eurovision-style voting boards",
    template: "%s · Voting Stage",
  },
  description,
  applicationName: "Voting Stage",
  openGraph: {
    title: "Voting Stage",
    description,
    type: "website",
    siteName: "Voting Stage",
  },
  twitter: {
    card: "summary",
    title: "Voting Stage",
    description,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <SiteHeader />
          <main className="page">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
