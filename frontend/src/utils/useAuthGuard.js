'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard(
  redirectTo = '/login',
  requiredRole = null
) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRaw = localStorage.getItem('user');

    if (!token || !userRaw) {
      router.replace('/login');
      return;
    }

    let user;

    try {
      user = JSON.parse(userRaw);
    } catch {
      router.replace('/login');
      return;
    }

    const originalType = user.user_type__name?.toLowerCase();

    const permissions = {
      artist: user.is_artist === true,
      dj: user.is_dj === true,
      listener: originalType === 'listener',
      admin: originalType === 'admin',
    };

    if (
      requiredRole &&
      !permissions[requiredRole.toLowerCase()]
    ) {
      router.replace(redirectTo);
      return;
    }

    setAuthorized(true);

  }, [router, redirectTo, requiredRole]);

  return authorized;
}



// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// /**
//  * Reusable auth guard hook.
//  * 
//  * @param {string} redirectTo - Where to send unauthenticated users
//  * @param {string|null} requiredUserType - e.g. 'Listener', 'Artist', null = any logged-in user
//  */
// export function useAuthGuard(redirectTo = '/listener/login', requiredUserType = null) {
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem('authToken');
//     const userRaw = localStorage.getItem('user');

//     // No token = not logged in
//     if (!token) {
//       router.replace(redirectTo);
//       return;
//     }

//     // If a specific user type is required, check it
//     if (requiredUserType) {
//       try {
//         const user = JSON.parse(userRaw);
//         if (user?.user_type__name?.toLowerCase() !== requiredUserType.toLowerCase()) {
//           router.replace(redirectTo);
//         }
//       } catch {
//         router.replace(redirectTo);
//       }
//     }
//   }, []);
// }