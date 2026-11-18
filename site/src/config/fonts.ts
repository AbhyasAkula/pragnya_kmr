import { Cormorant_Garamond, Montserrat } from "next/font/google";

/** Display serif — headings. Pairing from UI UX Pro Max "Luxury Serif". */
export const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

/** Geometric sans — body, UI and labels. */
export const fontSans = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontSans.variable}`;
