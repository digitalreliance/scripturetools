import type { Metadata, Viewport } from "next";
import { Archivo, Libre_Baskerville } from "next/font/google";
import { CommandPalette } from "@/components/command/CommandPalette";
import { DeviceBootScript } from "@/components/device/DeviceBootScript";
import { DeviceGate } from "@/components/device/DeviceGate";
import { SITE } from "@/lib/site";
import "./globals.css";

/** UI and display: a grotesk with a width axis (62–125). */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

/** Scripture text: Baskerville, the face of the 1763 Cambridge Bible. */
const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-baskerville",
  style: ["normal", "italic"],
  display: "swap",
});

/** Every route in this app is static content: enforce it at build time. */
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}: ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141210",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${archivo.variable} ${baskerville.variable}`}
    >
      <head>
        <DeviceBootScript />
      </head>
      <body className="min-h-dvh">
        {children}
        <CommandPalette />
        <DeviceGate />
      </body>
    </html>
  );
}
