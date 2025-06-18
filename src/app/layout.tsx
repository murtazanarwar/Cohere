import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { Modals } from "@/components/modals";
import { Toaster } from "@/components/ui/sonner";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
;

import "./globals.css";
import { JotaiProvider } from "@/components/jotai-provider";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cohere",
  description: "Buisness Communication Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body className={inter.className}>
          <ConvexClientProvider>
            <ReactQueryProvider>
              <NuqsAdapter>
                <JotaiProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                  <Toaster />
                  <Modals />
                  {children}
                </ThemeProvider>
                </JotaiProvider>
              </NuqsAdapter>
            </ReactQueryProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}