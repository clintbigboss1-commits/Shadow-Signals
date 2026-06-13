'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isLoggedIn } from '../../lib/auth';
import OnboardingModal from '../../components/OnboardingModal';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.replace('/signup');
  }, [router]);

  const user = getUser();

  return (
    <div style={{ minHeight: '100vh', background: '#030711' }}>
      <OnboardingModal
        userName={user?.name}
        onDone={() => router.replace('/dashboard')}
      />
    </div>
  );
}
