'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Reusable auth guard hook.
 * 
 * @param {string} redirectTo - Where to send unauthenticated users
 * @param {string|null} requiredUserType - e.g. 'Listener', 'Artist', null = any logged-in user
 */
export function useAuthGuard(redirectTo = '/listener/login', requiredUserType = null) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRaw = localStorage.getItem('user');

    // No token = not logged in
    if (!token) {
      router.replace(redirectTo);
      return;
    }

    // If a specific user type is required, check it
    if (requiredUserType) {
      try {
        const user = JSON.parse(userRaw);
        if (user?.user_type__name?.toLowerCase() !== requiredUserType.toLowerCase()) {
          router.replace(redirectTo);
        }
      } catch {
        router.replace(redirectTo);
      }
    }
  }, []);
}