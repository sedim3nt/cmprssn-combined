import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CMPRSSN Combined Assessment",
  description: "10-question diagnostic + 12-question survey. Map your full agentic composition profile in one pass.",
  openGraph: {
    title: "CMPRSSN Combined Assessment",
    description: "22 questions. Complete agentic composition profile. Diagnostic + Operational Context.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="orb orb-purple" />
        <div className="orb orb-blue" />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
