'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyArtistProfile } from '../artist';

export default function ArtistDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyArtistProfile()
      .then((data) => {
        if (!data?.id) {
          router.push('/artist/onboarding');
        } else {
          setProfile(data);
        }
      })
      .catch(() => {
        router.push('/artist/onboarding');
      });
  }, [router]);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Welcome, {profile.stage_name}
      </h1>
      <p className="mt-2 text-gray-600">
        {profile.bio}
      </p>
    </div>
  );
}
