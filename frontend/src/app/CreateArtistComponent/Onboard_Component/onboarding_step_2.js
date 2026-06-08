'use client';


// import api from '@/src/api/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../AuthContext';


import backendApi from '@/utils/backendApi';

export default function StepTwoOnboarding() {
  const router = useRouter();
  const { authToken } = useAuth();
  const [wallet, setWallet] = useState('');

  const submit = async () => {
    if (!authToken) return;

    try {
      await backendApi.post(
        'system_management/artist_onboarding_step_2/',
        { wallet_address: wallet || null } // ✅ optional
      );
      router.push('/Components/System_Management_Components/dashboard');
    } catch (err) {
      console.error(
        'Step 2 error:',
        err.response?.data || err.message
      );
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
      <button
        onClick={() => router.push('/Components/System_Management_Components/dashboard')}
        className="w-full text-sm text-gray-500 underline"
      >
        Skip for now
      </button>
    </div>
  );
}


// export default function StepTwoOnboarding() {
//   const router = useRouter();
//   const { authToken, csrfToken } = useAuth();
//   const [wallet, setWallet] = useState('');

//   const submit = async () => {
//     if (!authToken) return;

//     const res = await fetch('/system_management_api/artist_onboarding_step_2/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Token ${authToken}`,
//         'X-CSRFToken': csrfToken,
//       },
//       body: JSON.stringify({ wallet_address: wallet }),
//       credentials: 'include',
//     });

//     if (res.ok) {
//       router.push('/artist/dashboard');
//     } else {
//       const data = await res.json();
//       console.error('Step 2 error:', data);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-20 space-y-4">
//       <h1 className="text-2xl font-bold">Connect your wallet</h1>

//       <input
//         placeholder="Wallet address"
//         className="w-full border rounded p-2"
//         onChange={e => setWallet(e.target.value)}
//       />

//       <button
//         onClick={submit}
//         className="w-full bg-indigo-600 text-white py-2 rounded"
//       >
//         Finish onboarding
//       </button>
//     </div>
//   );
// }

// export default function StepTwoOnboarding() {
//   const router = useRouter();
//   const [wallet, setWallet] = useState('');

//   const submit = async () => {
//     await api.post('/artist/onboarding/step-2/', {
//       wallet_address: wallet
//     });
//     router.push('/artist/dashboard');
//   };

//   return (
//     <div className="max-w-md mx-auto mt-20 space-y-4">
//       <h1 className="text-2xl font-bold">Connect your wallet</h1>

//       <input
//         placeholder="Wallet address"
//         className="w-full border rounded p-2"
//         onChange={e => setWallet(e.target.value)}
//       />

//       <button
//         onClick={submit}
//         className="w-full bg-indigo-600 text-white py-2 rounded"
//       >
//         Finish onboarding
//       </button>
//     </div>
//   );
// }
