'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import getMyArtistProfile from '@/app/CreateArtistComponent/artist';
import ArtistDashboardUI from '../Components/DashboardTypeComponent/ArtistDashboardComponent';
export default function ArtistDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyArtistProfile()
      .then((profile) => {
        if (!profile || !profile.id) {
          router.replace('/artist/onboarding');
        }
      })
      .catch(() => {
        router.replace('/artist/onboarding');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Checking artist profile...</p>
      </div>
    );
  }

  return <ArtistDashboardUI />;
}
