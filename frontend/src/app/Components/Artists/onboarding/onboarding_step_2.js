'use client';


// import api from '@/src/api/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../AuthContext';


import backendApi from '../../../../utils/backendApi';

export default function StepTwoOnboarding() {
  const router = useRouter();
  const { authToken } = useAuth();
  const [wallet, setWallet] = useState('');


  const submit = async () => {
  try {
    await backendApi.post(
      'system_management/artist_onboarding_step_2/',
      { wallet_address: wallet || null }
    );
    router.push('/artist/dashboard');
  } catch (err) {
    // Only show error for real validation failures
    // not for "already onboarded"
    const message = err.response?.data?.message;
    if (message && message !== 'Artist already onboarded') {
      console.error('Step 2 error:', message);
      alert(message);
    } else {
      // Already onboarded or skip — just proceed
      router.push('/artist/dashboard');
    }
  }
};
  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Connect your wallet</h1>

      <input
        placeholder="Wallet address (optional)"
        className="w-full border rounded p-2"
        onChange={e => setWallet(e.target.value)}
      />

      <button
        onClick={submit}
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        Finish onboarding
      </button>

      {/* Optional skip */}
      {/* <button
        onClick={() => router.push('/artist/dashboard')}
        className="w-full text-sm text-gray-500 underline"
      >
        Skip for now
      </button> */}
      <button
  onClick={submit}  // ← same as finish, wallet is already '' so it sends null
  className="w-full text-sm text-gray-500 underline"
>
  Skip for now
</button>


    </div>
  );
}


