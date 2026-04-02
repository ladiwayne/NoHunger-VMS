import { Suspense } from 'react';
import SignUpLoginContent from './components/SignUpLoginContent';

export default function SignUpLoginPage() {
  return (
    <Suspense fallback={null}>
      <SignUpLoginContent />
    </Suspense>
  );
}
