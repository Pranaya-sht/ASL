/// app/layout.tsx (or wherever your RootLayout is)
// app/layout.js
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import ClientLayout from '@/components/ClientLayout';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata = {
  title: 'ASL Tracker',
  description: 'Track and learn ASL in real-time',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster position="top-right" />
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}




// app/layout.tsx (or wherever your RootLayout is defined)
// import ClientLayout from '../components/ClientLayout';
// import { ThemeProvider } from 'next-themes';
// import { Toaster } from 'react-hot-toast';

// export const metadata = {
//   title: "ASL Tracker",
//   description: "Track and learn ASL in real-time",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className="antialiased">
//         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
//           <Toaster position="top-right" />
//           <ClientLayout>{children}</ClientLayout>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }

