import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "VARLOS KDS · Kitchen Manager",
  description:
    "Live Kitchen Display System for the VARLOS Smart Canteen — table-slot orders, SLAs, batching and student alerts.",
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster
          className="font-sans"
          theme="dark"
          position="top-right"
          offset={{ top: 100, right: 16 }}
          mobileOffset={{ top: 96, right: 12 }}
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "border-border/80 bg-card text-card-foreground",
              description: "text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
