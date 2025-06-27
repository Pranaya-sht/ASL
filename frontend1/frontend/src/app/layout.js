// app/layout.js
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import ClientLayout from '@/components/ClientLayout';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap'
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
});

export const metadata = {
  title: {
    default: 'ASL Learn - Interactive Sign Language Learning',
    template: '%s | ASL Learn'
  },
  description: 'Master American Sign Language with real-time hand tracking, interactive lessons, and personalized feedback. Start your ASL journey today.',
  keywords: ['ASL', 'American Sign Language', 'Learning', 'Hand Tracking', 'Interactive', 'Education'],
  authors: [{ name: 'ASL Learn Team' }],
  creator: 'ASL Learn',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://asllearn.com',
    siteName: 'ASL Learn',
    title: 'ASL Learn - Interactive Sign Language Learning',
    description: 'Master American Sign Language with real-time hand tracking and interactive lessons.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ASL Learn - Interactive Sign Language Learning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASL Learn - Interactive Sign Language Learning',
    description: 'Master American Sign Language with real-time hand tracking and interactive lessons.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="flex flex-col min-h-screen">
            <ClientLayout>
              <main className="flex-1">
                {children}
              </main>
            </ClientLayout>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </ThemeProvider>

        {/* Global styles for toast theming */}

      </body>
    </html>
  );
}