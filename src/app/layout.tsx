import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kapot Money",
    template: "%s | Kapot Money",
  },
  description: "Личные финансы: кошельки, операции, бюджеты и отчёты.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f7f9",
};

const themeScript = `try { const saved = localStorage.getItem('kapot-theme'); if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved; } catch {}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
