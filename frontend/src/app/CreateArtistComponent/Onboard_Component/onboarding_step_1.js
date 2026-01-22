'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../AuthContext';
import backendApi from '@/utils/backendApi';

export default function StepOneOnboarding() {
  const router = useRouter();
  const { authToken } = useAuth();
  const [form, setForm] = useState({ bio: '', location: '' });

  const submit = async () => {
    if (!authToken) return;

    try {
      await backendApi.post(
        '/system_management/artist_onboarding_step_1/',
        form
      );

      // ✅ move to step 2a rtist-onboarding?step=1
      // '/system_management/artist_onboarding_step_2/',
      router.push('/artist-onboarding?step=2');
    } catch (err) {
      console.error(
        'Step 1 error:',
        err.response?.data || err.message
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Tell us about you</h1>

      <textarea
        placeholder="Your bio"
        className="w-full border rounded p-2"
        onChange={e => setForm({ ...form, bio: e.target.value })}
      />

      <input
        placeholder="Location"
        className="w-full border rounded p-2"
        onChange={e => setForm({ ...form, location: e.target.value })}
      />

      <button
        onClick={submit}
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        Continue
      </button>
    </div>
  );
}

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '../../../../AuthContext';

// export default function StepOneOnboarding() {
//   const router = useRouter();
//   const { authToken, csrfToken } = useAuth();
//   const [form, setForm] = useState({ bio: '', location: '' });

//   const submit = async () => {
//     if (!authToken) return;

//     const res = await fetch('/system_management/artist_onboarding_step_1/', {
      
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Token ${authToken}`,
//         'X-CSRFToken': csrfToken,
//       },
//       body: JSON.stringify(form),
//       credentials: 'include',
//     });

//     if (res.ok) {
//       console.log("************************************")
//       router.push`/artist-onboarding?step=${artist?.onboarding_step || 1}`
        

//     } else {
//       const data = await res.json();
//       console.error('Step 1 error:', data);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-20 space-y-4">
//       <h1 className="text-2xl font-bold">Tell us about you</h1>

//       <textarea
//         placeholder="Your bio"
//         className="w-full border rounded p-2"
//         onChange={e => setForm({ ...form, bio: e.target.value })}
//       />

//       <input
//         placeholder="Location"
//         className="w-full border rounded p-2"
//         onChange={e => setForm({ ...form, location: e.target.value })}
//       />

//       <button
//         onClick={submit}
//         className="w-full bg-indigo-600 text-white py-2 rounded"
//       >
//         Continue
//       </button>
//     </div>
//   );
// }

// import api from '@/src/api/api';

// export default function StepOneOnboarding() {
//   const router = useRouter();
//   const [form, setForm] = useState({ bio: '', location: '' });

//   const submit = async () => {
//     await api.post('/artist/onboarding/step-1/', form);
//     router.push('/artist/onboarding/step-2');
//   };

//   return (
//     <div className="max-w-md mx-auto mt-20 space-y-4">
//       <h1 className="text-2xl font-bold">Tell us about you</h1>

//       <textarea
//         placeholder="Your bio"
//         className="w-full border rounded p-2"
//         onChange={e => setForm({ ...form, bio: e.target.value })}
//       />

//       <input
//         placeholder="Location"
//         className="w-full border rounded p-2"
//         onChange={e => setForm({ ...form, location: e.target.value })}
//       />

//       <button
//         onClick={submit}
//         className="w-full bg-indigo-600 text-white py-2 rounded"
//       >
//         Continue
//       </button>
//     </div>
//   );
// }
