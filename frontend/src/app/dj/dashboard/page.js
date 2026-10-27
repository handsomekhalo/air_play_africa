
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../utils/useAuthGuard';
import { getMyMixes } from '../../../utils/mixes_api_helper';
import DJNav from '@/app/Components/DJ/DJNav';

export default function DJDashboardPage() {
  const router = useRouter();
  const authorized = useAuthGuard('/browse', 'DJ');

  const [mixes, setMixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    const fetchMixes = async () => {
      try {
        setLoading(true);

        const response = await getMyMixes();

        if (!cancelled) {
          if (response.status === 'success') {
            setMixes(response.data || []);
          } else {
            setError(response.message || 'Failed to load mixes.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            'Could not load your mixes.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMixes();

    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const totalStreams = mixes.reduce(
    (total, mix) => total + (Number(mix.play_count) || 0),
    0
  );

  const publishedMixes = mixes.filter(
    (mix) => mix.is_published && mix.status === 'ready'
  ).length;

  if (!authorized) return null;

  return (
    <>
      <DJNav />
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div>
            <p className="text-orange-400 text-sm font-semibold mb-2">
              AIRPLAY AFRICA
            </p>
            <h1 className="text-3xl font-bold">DJ Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Manage your mixes and track your audience.
            </p>
          </div>

          <button
            onClick={() => router.push('/dj/upload')}
            className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-lg font-semibold"
          >
            + Upload Mix
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard title="Total Mixes" value={mixes.length} />
          <StatCard title="Total Plays" value={totalStreams} />
          <StatCard title="Published Mixes" value={publishedMixes} />
        </div>

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">My Mixes</h2>

          <button
            onClick={() => router.push('/browse/mixes')}
            className="text-orange-400 hover:text-orange-300 text-sm"
          >
            Explore Mixes
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading your mixes...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : mixes.length === 0 ? (
          <div className="border border-[#292929] rounded-xl p-12 text-center bg-[#141414]">
            <h3 className="text-xl font-semibold mb-2">
              No mixes uploaded yet
            </h3>
            <p className="text-gray-400 mb-6">
              Upload your first DJ mix to get started.
            </p>
            <button
              onClick={() => router.push('/dj/upload')}
              className="bg-orange-500 px-5 py-3 rounded-lg font-semibold"
            >
              Upload Your First Mix
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mixes.map((mix) => (
              <div
                key={mix.id}
                className="flex flex-wrap items-center justify-between gap-4 bg-[#141414] border border-[#292929] rounded-xl p-5"
              >
                <div className="flex items-center gap-4">
                  {mix.cover_image_url ? (
                    <img
                      src={mix.cover_image_url}
                      alt={mix.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#292929] flex items-center justify-center">
                      ♪
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold">{mix.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {mix.genre || 'Uncategorised'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {mix.play_count || 0} plays
                    </p>
                  </div>
                </div>

                <span className="text-sm text-gray-300 capitalize">
                  {mix.status}
                  {mix.status === 'ready' && !mix.is_published
                    ? ' · Unpublished'
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
     </>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-[#141414] border border-[#292929] rounded-xl p-6">
      <p className="text-gray-400 text-sm mb-3">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
