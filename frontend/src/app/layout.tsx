import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Cognate | Academic Intelligence Workspace',
  description: 'AI-powered semantic analysis and duplicate detection for academic curriculums.',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
        
    );
}

export default RootLayout;
