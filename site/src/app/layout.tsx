import type { Viewport } from "next";
import { AnchorScroll } from "@/components/providers/anchor-scroll";
import { MotionProvider } from "@/components/providers/motion-provider";
import { fontVariables } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { getSeoDescription } from "@/lib/data";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata() {
  return rootMetadata(await getSeoDescription());
}

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
};

/**
 * Runs before first paint: flags that JavaScript is available so CSS may
 * hold scroll-reveal content in its start state (see globals.css "Reveal").
 * Without JS the flag is never set and all content stays visible.
 */
const JS_FLAG_SCRIPT = `document.documentElement.classList.add("js")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the pre-paint script adds the `js` class.
    <html lang={siteConfig.htmlLang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG_SCRIPT }} />
      </head>
      <body className="min-h-svh">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-5 py-3 text-ivory focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
        <AnchorScroll />
      </body>
    </html>
  );
}
