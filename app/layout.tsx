import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Portfolio Intelligence Agent - JSO",
  description: "AI-powered career improvement tool for the JSO platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-jso-light min-h-screen">
        <div className="flex flex-col min-h-screen">
          {/* JSO Header */}
          <header className="bg-jso-primary text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* JSO Logo */}
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-jso-primary font-bold text-xl">JSO</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Career Portfolio Intelligence Agent</h1>
                    <p className="text-xs sm:text-sm text-blue-200">Prototype Demo</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* JSO Footer */}
          <footer className="bg-jso-dark text-white py-4 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm">
                <p className="text-gray-400">
                  © 2024 JSO Platform | Career Portfolio Intelligence Agent Prototype
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Powered by Google Gemini AI, GitHub API, and Supabase
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
