'use client';

import backendApi from '@/utils/backendApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DJRegister() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name:       '',
    last_name:        '',
    email:            '',
    password:         '',
    confirm_password: '',
  });
  const [error, setError]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await backendApi.post(
        '/system_management/register_dj/',
        {
          first_name:       form.first_name,
          last_name:        form.last_name,
          email:            form.email,
          password:         form.password,
          confirm_password: form.confirm_password,
        },
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        // Registration done — DJs use the same login as Artists/Admins
        router.replace('/');
      } else {
        setError(response.data.message || 'Registration failed. Try again.');
      }

    } catch (err) {
      console.error('DJ register error:', err);
      const detail = err?.response?.data?.errors;
      setError(
        typeof detail === 'object'
          ? Object.values(detail).flat().join(' ')
          : err?.response?.data?.message || 'A network error occurred. Please check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold text-gray-900">
          Register as a DJ
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Upload mixes and get tipped by listeners
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                value={form.last_name}
                onChange={handleChange}
                required
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-indigo-500 px-3 py-2 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 cursor-not-allowed"
          >
            {isSubmitting ? 'Creating account...' : 'Create DJ account'}
          </button>

        </form>
      </div>
    </div>
  );
}