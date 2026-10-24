'use client';

import { useState } from 'react';
// import LoginPage from './Login_Component/login';
import LoginPage from './Components/Login_Component/login';
import ArtistRegister from './CreateArtistComponent/create_artist';
import DJRegister from './Components/DJ/DJRegister';
// import RegisterPage from './Register_Component/register';// import Dashboard from './Components/System_Management_Component/dashboard/dashboard';
export default function Home() {
  // 'login' | 'artist' | 'dj'
  const [view, setView] = useState('login');

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {view === 'login' && (
          <>
            <LoginPage />
            <p className="text-sm mt-4">
              Don’t have an account?{' '}
              <button
                onClick={() => setView('artist')}
                className="text-indigo-600 hover:underline"
              >
                Register as an Artist
              </button>
              {' · '}
              <button
                onClick={() => setView('dj')}
                className="text-indigo-600 hover:underline"
              >
                Register as a DJ
              </button>
            </p>
          </>
        )}

        {view === 'artist' && (
          <>
            <ArtistRegister />
            <p className="text-sm mt-4">
              Already have an account?{' '}
              <button
                onClick={() => setView('login')}
                className="text-indigo-600 hover:underline"
              >
                Login
              </button>
            </p>
          </>
        )}

        {view === 'dj' && (
          <>
            <DJRegister />
            <p className="text-sm mt-4">
              Already have an account?{' '}
              <button
                onClick={() => setView('login')}
                className="text-indigo-600 hover:underline"
              >
                Login
              </button>
            </p>
          </>
        )}

      </main>
    </div>
  );
}
