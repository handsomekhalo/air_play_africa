'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyArtistProfile, createArtistProfile } from '../artist';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    stage_name: '',
    bio: '',
    location: '',
  });

  // 🔐 Guard: redirect if already onboarded
  useEffect(() => {
    getMyArtistProfile()
      .then((profile) => {
        if (profile?.id) {
          router.push('/artist/dashboard');
        }
      })
      .catch(() => {
        // profile doesn't exist → stay here
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createArtistProfile(form);
      router.push('/artist/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to complete onboarding.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Artist Onboarding
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us about yourself
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900">
              Stage Name
            </label>
            <input
              name="stage_name"
              required
              value={form.stage_name}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">
              Bio
            </label>
            <textarea
              name="bio"
              rows="4"
              value={form.bio}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">
              Location
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-indigo-600"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
}
