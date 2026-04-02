import type { Metadata } from 'next';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Nohunger Initiative — Champion Hub',
  description:
    'The friendly home for Nohunger Champions to join activities, track hours, and make impact across Nigeria.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Nohunger Initiative — Champion Hub',
    description:
      'Join Nohunger Champions fighting hunger across Nigeria. Track events, log hours, and do good together.',
    url: 'https://volunteer.nohungerfoodbank.org',
    siteName: 'Nohunger Initiative',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nohunger Initiative — Champion Hub',
    description: 'Join Nohunger Champions fighting hunger across Nigeria.',
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
