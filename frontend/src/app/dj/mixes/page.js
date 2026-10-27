
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import DJNav from '@/app/Components/DJ/DJNav';
import { useAuthGuard } from '@/utils/useAuthGuard';
import { getMyMixes } from '@/utils/mixes_api_helper';

const formatDuration = (seconds) => {
  const total = Math.floor(Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;

  return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

export default function MyMixesPage() {
  const authorized = useAuthGuard('/login');

  const [mixes, setMixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authorized) return;

    let active = true;

    const fetchMixes = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getMyMixes();

        if (!active) return;

        if (response.status !== 'success') {
          throw new Error(
            response.message || 'Unable to load your mixes.'
          );
        }

        // Supports a direct array or a paginated DRF response.
        const data = response.data;

        const items = Array.isArray(data)
          ? data
          : data?.results || [];

        setMixes(items);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load your mixes.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMixes();

    return () => {
      active = false;
    };
  }, [authorized]);

  if (!authorized) return null;

  return (
    <>
      <DJNav />

      <main style={{
        minHeight: '100vh',
        background: '#0b0f17',
        color: '#fff',
        padding: '40px 24px',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto'
        }}>
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 32
          }}>
            <div>
              <h1 style={{
                fontSize: 32,
                fontWeight: 700,
                marginBottom: 8
              }}>
                My Mixes
              </h1>

              <p style={{ color: '#9ca3af' }}>
                Manage and view your uploaded DJ mixes.
              </p>
            </div>

            <Link
              href="/dj/upload"
              style={{
                background: '#FF6B35',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 8,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              + Upload Mix
            </Link>
          </header>

          {loading && (
            <p style={{ color: '#9ca3af' }}>
              Loading your mixes...
            </p>
          )}

          {error && (
            <p role="alert" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}

          {!loading && !error && mixes.length === 0 && (
            <div style={{
              background: '#151922',
              border: '1px solid #293241',
              borderRadius: 14,
              padding: 40,
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>
                No mixes uploaded yet
              </h2>

              <p style={{
                color: '#9ca3af',
                marginBottom: 20
              }}>
                Upload your first DJ mix to get started.
              </p>

              <Link
                href="/dj/upload"
                style={{
                  color: '#FF6B35',
                  fontWeight: 700
                }}
              >
                Upload a Mix
              </Link>
            </div>
          )}

          {!loading && !error && mixes.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20
            }}>
              {mixes.map((mix) => (
                <article
                  key={mix.id}
                  style={{
                    background: '#151922',
                    border: '1px solid #293241',
                    borderRadius: 14,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    height: 170,
                    background: '#202633',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {mix.cover_image_url ? (
                      <img
                        src={mix.cover_image_url}
                        alt={`${mix.title} cover`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: 42,
                        color: '#FF6B35'
                      }}>
                        ♫
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 20 }}>
                    <h2 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 10
                    }}>
                      {mix.title}
                    </h2>

                    <p style={{
                      color: '#9ca3af',
                      fontSize: 13,
                      marginBottom: 8
                    }}>
                      {mix.genre || 'Uncategorised'}
                    </p>

                    <p style={{
                      color: '#9ca3af',
                      fontSize: 13,
                      marginBottom: 8
                    }}>
                      Duration: {mix.duration > 0
                        ? formatDuration(mix.duration)
                        : 'Unknown'}
                    </p>

                    <p style={{
                      color: '#9ca3af',
                      fontSize: 13,
                      marginBottom: 12
                    }}>
                      {mix.play_count || 0} plays
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: mix.status === 'ready' &&
                          mix.is_published
                          ? '#4ade80'
                          : '#fbbf24'
                      }}>
                        {mix.status === 'ready' &&
                        mix.is_published
                          ? 'Published'
                          : mix.status === 'failed'
                            ? 'Failed'
                            : mix.status === 'uploading'
                              ? 'Uploading'
                              : 'Unpublished'}
                      </span>

                      {mix.status === 'ready' &&
                        mix.is_published && (
                        <Link
                          href={`/m/${mix.id}`}
                          style={{
                            color: '#FF6B35',
                            fontSize: 13,
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          View Mix
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
