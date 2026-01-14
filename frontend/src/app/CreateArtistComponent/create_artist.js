'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerArtist } from './artist';


export default function ArtistRegister() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    // bio: '',
    // location: '',
    // wallet_address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await registerArtist(form);
      setSuccess(true);

      // Clear password from memory
      setForm((prev) => ({ ...prev, password: '' }));

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Artist registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Artist Account</h1>

      {success && (
        <p className="text-green-600 mb-4">
          Account created successfully. Redirecting to login...
        </p>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot (bot protection) */}
        <input type="text" name="company" className="hidden" tabIndex="-1" />

        <input
          name="first_name"
          placeholder="First name"
          required
          onChange={handleChange}
        />

        <input
          name="last_name"
          placeholder="Last name"
          required
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          onChange={handleChange}
        />

        {/* <input
          name="password"
          type="password"
          placeholder="Password"
          required
          onChange={handleChange}
        />

        <textarea
          name="bio"
          placeholder="Bio"
          onChange={handleChange}
        />

        <input
          name="location"
          placeholder="Location"
          onChange={handleChange}
        /> */}

        {/* <input
          name="wallet_address"
          placeholder="Wallet address"
          onChange={handleChange}
        /> */}

        <button
          type="submit"
          disabled={loading || success}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
