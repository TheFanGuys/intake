import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "../lib/data";

export const metadata = {
  title: APP_NAME + " — " + APP_TAGLINE,
  description: "Plain-language facts on food ingredients, additives, and local water quality.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
