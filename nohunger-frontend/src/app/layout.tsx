import type { Metadata } from 'next';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'NHI - Champions Hub',
  description:
    'NHI Champions Hub empowers volunteers to join activities, track impact, and support food security across Nigeria.',
  icons: { icon: '/assets/images/NoHunger-Logo-Icon.png' },
  keywords: [
    'NHI',
    'No Hunger Initiatives',
    'volunteer management',
    'food bank',
    'volunteer activities',
    'hours tracking',
    'community service',
    'Nigeria',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'NHI - Champions Hub',
    description:
      'NHI Champions Hub empowers volunteers to join activities, track impact, and support food security across Nigeria.',
    url: 'https://volunteer.nohungerfoodbank.org',
    siteName: 'NHI - Champions Hub',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NHI - Champions Hub',
    description: 'NHI Champions Hub empowers volunteers to join activities and track community impact.',
  },
  metadataBase: new URL('https://volunteer.nohungerfoodbank.org'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '14px',
                borderRadius: '0.625rem',
                border: '1px solid hsl(30, 15%, 88%)',
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.10)',
              },
            }}
            richColors
          />
        </AuthProvider>
      </body>
    </html>
  );
}
