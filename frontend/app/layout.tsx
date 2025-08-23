import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../src/components/Web3Provider";
import { AuthProvider } from "../src/contexts/AuthContext";
import { LoadingProvider } from "../src/contexts/LoadingContext";
import ClientOnlyLoader from "../src/components/ClientOnlyLoader";
import Header from "../src/components/Header";
import MobileNav from "../src/components/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURA - Autonomous DeFi Agent",
  description:
    "Autonomous AI agent that revolutionizes DeFi wealth management through intelligent portfolio optimization",
  keywords: [
    "DeFi",
    "Avalanche",
    "AI Agent",
    "Autonomous Trading",
    "Yield Optimization",
    "Machine Learning",
    "Blockchain",
  ],
  authors: [{ name: "AURA Team" }],
  openGraph: {
    title: "AURA - Autonomous DeFi Agent",
    description:
      "Autonomous AI agent that revolutionizes DeFi wealth management through intelligent portfolio optimization",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AURA - Autonomous DeFi Agent",
    description:
      "Autonomous AI agent that revolutionizes DeFi wealth management through intelligent portfolio optimization",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-900 text-white`}>
        <Web3Provider>
          <AuthProvider>
            <LoadingProvider>
              <ClientOnlyLoader />
              <Header />
              <MobileNav />
              <main className="pt-16 min-h-screen">{children}</main>
            </LoadingProvider>
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
