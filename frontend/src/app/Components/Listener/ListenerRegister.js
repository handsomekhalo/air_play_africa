'use client';

import backendApi from '@/utils/backendApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getCsrfToken } from '@/utils/csrf';
import Link from 'next/link';

export default function ListenerRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name:       '',
    last_name:        '',
    email:            '',
    password:         '',
    confirm_password: '',
  });
  const [error, setError]           = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side password match check before hitting API
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await backendApi.post(
        '/system_management/register_user/',
        {
          first_name:       form.first_name,
          last_name:        form.last_name,
          email:            form.email,
          password:         form.password,
          confirm_password: form.confirm_password,
        },
        {
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.status === 'success') {
        // Registration done — send them to login
        router.replace('/listener/login');
      } else {
        setError(response.data.message || 'Registration failed. Try again.');
      }

    } catch (err) {
      console.error('Register error:', err);
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Start listening to African music
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* First + Last name row */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm password */}
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

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-indigo-500 px-3 py-2 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 cursor-not-allowed"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/listener/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
