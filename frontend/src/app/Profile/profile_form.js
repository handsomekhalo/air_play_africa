'use client';


import { useEffect, useState } from 'react';
// import {
//   getMyArtistProfile,
//   updateMyArtistProfile,
// } from '@/services/artistProfile';
import { getArtistProfile, updateMyArtistProfile } from '@/app/CreateArtistComponent/artist.js';
// import updateMyArtistProfile from '@/app/CreateArtistComponent/artist.js';
import backendApi from '@/utils/backendApi';



export default function ProfileForm() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    location: '',
  });

  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 🔹 Fetch profile on open
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await backendApi.get(
        '/system_management/get_artist_profile/',
        { withCredentials: true }
      );

      if (res.data?.status === 'success') {
        const artist = res.data.data;

        setForm({
          first_name: artist.user?.first_name || '',
          last_name: artist.user?.last_name || '',
          email: artist.user?.email || '',
          bio: artist.bio || '',
          location: artist.location || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false); // 🔥 THIS IS THE KEY LINE
    }
  };

  fetchProfile();
}, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 Optimistic save
  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    const csrfToken =
      localStorage.getItem('csrfToken') ||
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

    if (!csrfToken) {
      setError('CSRF token missing');
      setSaving(false);
      return;
    }

    // 1️⃣ Optimistic UI already updated (form state)
    try {
      await updateMyArtistProfile(form, csrfToken);

      // 2️⃣ Persist to localStorage (important!)
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem(
        'user',
        JSON.stringify({ ...user, ...form })
      );

      setInitialForm(form); // new snapshot
    } catch (err) {
      console.error(err);

      // 3️⃣ Rollback on failure
      if (initialForm) setForm(initialForm);
      setError('Failed to update profile. Changes reverted.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
  return (
    <div className="py-8 text-center text-gray-500">
      Loading profile…
    </div>
  );
}


  // if (loading) {
  //   return <p className="text-sm text-gray-500">Loading profile...</p>;
  // }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
      <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />

      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">
          Email (Read only)
        </label>
        <input
          value={form.email}
          disabled
          className="w-full border p-2 rounded bg-gray-100"
        />
      </div>

      <Textarea label="Bio" name="bio" value={form.bio} onChange={handleChange} />
      <Input label="Location" name="location" value={form.location} onChange={handleChange} />

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Update Profile'}
      </button>
      
    </div>
    
  );
  
}


/* 🔹 Small reusable inputs */
const Input = ({ label, ...props }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
      {label}
    </label>
    <textarea
      {...props}
      rows="3"
      className="w-full border p-2 rounded resize-none focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);


// import { useState, useEffect } from 'react';

// export default function ProfileForm() {
//   const [form, setForm] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     bio: '',
//     location: '',
//   });

//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem('user'));
//     if (user) {
//       setForm({
//         first_name: user.first_name || '',
//         last_name: user.last_name || '',
//         email: user.email || '',
//         bio: user.bio || '',
//         location: user.location || '',
//       });
//     }
//   }, []);

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async () => {
//     console.log('Updating profile:', form);
//     // 🔜 backend call goes here
//   };

//   return (
//   <div className="space-y-4"> {/* Reduced from 6 to 4 */}
//     <div>
//       <label className="text-xs font-semibold text-gray-500 uppercase ml-1">First Name</label>
//       <input
//         name="first_name"
//         placeholder="First name"
//         value={form.first_name}
//         onChange={handleChange}
//         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//       />
//     </div>

//     <div>
//       <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Last Name</label>
//       <input
//         name="last_name"
//         placeholder="Last name"
//         value={form.last_name}
//         onChange={handleChange}
//         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//       />
//     </div>

//     <div>
//       <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Email (ReadOnly)</label>
//       <input
//         name="email"
//         disabled
//         value={form.email}
//         className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
//       />
//     </div>

//     <div>
//       <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Bio</label>
//       <textarea
//         name="bio"
//         placeholder="Tell us about yourself..."
//         value={form.bio}
//         onChange={handleChange}
//         rows="3" // Limits the initial height
//         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
//       />
//     </div>

//     <div>
//       <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Location</label>
//       <input
//         name="location"
//         placeholder="Location"
//         value={form.location}
//         onChange={handleChange}
//         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//       />
//     </div>

//     <button
//       onClick={handleSubmit}
//       className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mt-2"
//     >
//       Update Profile
//     </button>
//   </div>
// );

//   return (
//     <div className="space-y-6 ">
//       <input
//         name="first_name"
//         placeholder="First name"
//         value={form.first_name}
//         onChange={handleChange}
//         className="w-full border p-2 rounded"
//       />

//       <input
//         name="last_name"
//         placeholder="Last name"
//         value={form.last_name}
//         onChange={handleChange}
//         className="w-full border p-2 rounded"
//       />

//       <input
//         name="email"
//         disabled
//         value={form.email}
//         className="w-full border p-2 rounded bg-gray-100"
//       />

//       <textarea
//         name="bio"
//         placeholder="Bio"
//         value={form.bio}
//         onChange={handleChange}
//         className="w-full border p-2 rounded"
//       />

//       <input
//         name="location"
//         placeholder="Location"
//         value={form.location}
//         onChange={handleChange}
//         className="w-full border p-2 rounded"
//       />

//       <button
//         onClick={handleSubmit}
//         className="w-full bg-black text-white py-2 rounded"
//       >
//         Update Profile
//       </button>
//     </div>
//   );
// }
