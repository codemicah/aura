import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../src/components/Web3Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal DeFi Wealth Manager",
  description: "AI-powered financial advisor that optimizes yields across Avalanche DeFi protocols",
  keywords: ["DeFi", "Avalanche", "Yield Optimization", "Personal Finance", "AI", "Blockchain"],
  authors: [{ name: "Personal DeFi Wealth Manager Team" }],
  openGraph: {
    title: "Personal DeFi Wealth Manager",
    description: "AI-powered financial advisor that optimizes yields across Avalanche DeFi protocols",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal DeFi Wealth Manager",
    description: "AI-powered financial advisor that optimizes yields across Avalanche DeFi protocols",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
