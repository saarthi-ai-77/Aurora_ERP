import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Aurora ERP — Academic Operations Platform",
  description:
    "Aurora ERP: A modern, role-based academic management system for students, faculty, and administration.",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster 
            position="bottom-right" 
            toastOptions={{ 
              duration: 3000,
              success: { duration: 3000 },
              error: { duration: 4000 },
            }} 
          />
        </Providers>
      </body>
    </html>
  );
}
