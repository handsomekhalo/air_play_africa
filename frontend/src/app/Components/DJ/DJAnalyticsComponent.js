
'use client';

import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../../utils/useAuthGuard';
import { getDJAnalytics } from '../../../utils/mixes_api_helper';
import DJNav from '@/app/Components/DJ/DJNav';

const formatDuration = (seconds) => {
  const value = Math.floor(Number(seconds) || 0);

  if (value >= 3600) {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  const minutes = Math.floor(value / 60);
  const remaining = value % 60;

  return minutes > 0
    ? `${minutes}m ${remaining}s`
    : `${remaining}s`;
};

const formatMoney = (amount) =>
  `R${Number(amount || 0).toFixed(2)}`;

function StatCard({ label, value }) {
  return (
    <div style={{
      background: '#151922',
      border: '1px solid #293241',
      borderRadius: 14,
      padding: 24
    }}>
      <p style={{
        color: '#9ca3af',
        fontSize: 13,
        marginBottom: 10
      }}>
        {label}
      </p>
      <h2 style={{
        color: '#fff',
        fontSize: 28,
        fontWeight: 700
      }}>
        {value}
      </h2>
    </div>
  );
}

export default function DJAnalyticsComponent() {
  const authorized = useAuthGuard('/login');

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authorized) return;

    let active = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getDJAnalytics();

        if (!active) return;

        if (response.status !== 'success') {
          throw new Error(
            response.message || 'Unable to load analytics.'
          );
        }

        setAnalytics(response.data);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load DJ analytics.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAnalytics();

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
        padding: '40px 24px'
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto'
        }}>
          <header style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 700
            }}>
              DJ Analytics
            </h1>
            <p style={{
              color: '#9ca3af',
              marginTop: 8
            }}>
              Track your mixes, listening activity and earnings.
            </p>
          </header>

          {loading && <p>Loading analytics...</p>}

          {error && (
            <p role="alert" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}

          {!loading && !error && analytics && (
            <>
              <section style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 32
              }}>
                <StatCard
                  label="Total Mixes"
                  value={analytics.total_mixes}
                />
                <StatCard
                  label="Total Plays"
                  value={analytics.total_plays}
                />
                <StatCard
                  label="Listening Time"
                  value={formatDuration(
                    analytics.total_listening_seconds
                  )}
                />
                <StatCard
                  label="Average Listening"
                  value={formatDuration(
                    analytics.average_listening_seconds
                  )}
                />
                <StatCard
                  label="Signed-in Listeners"
                  value={analytics.unique_listeners}
                />
                <StatCard
                  label="Total Tips"
                  value={analytics.total_tips}
                />
                <StatCard
                  label="DJ Earnings"
                  value={formatMoney(
                    analytics.total_earnings
                  )}
                />
              </section>

              <section style={{
                background: '#151922',
                border: '1px solid #293241',
                borderRadius: 14,
                padding: 24
              }}>
                <h2 style={{
                  fontSize: 21,
                  fontWeight: 700,
                  marginBottom: 20
                }}>
                  Top Performing Mixes
                </h2>

                {analytics.top_mixes.length === 0 ? (
                  <p style={{ color: '#9ca3af' }}>
                    No mixes uploaded yet.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      textAlign: 'left'
                    }}>
                      <thead>
                        <tr style={{
                          color: '#9ca3af',
                          borderBottom: '1px solid #293241'
                        }}>
                          <th style={{ padding: 12 }}>Mix</th>
                          <th style={{ padding: 12 }}>Plays</th>
                          <th style={{ padding: 12 }}>Listening</th>
                          <th style={{ padding: 12 }}>Tips</th>
                          <th style={{ padding: 12 }}>Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_mixes.map((mix) => (
                          <tr
                            key={mix.id}
                            style={{
                              borderBottom:
                                '1px solid #293241'
                            }}
                          >
                            <td style={{ padding: 12 }}>
                              {mix.title}
                            </td>
                            <td style={{ padding: 12 }}>
                              {mix.play_count}
                            </td>
                            <td style={{ padding: 12 }}>
                              {formatDuration(
                                mix.total_listening_seconds
                              )}
                            </td>
                            <td style={{ padding: 12 }}>
                              {mix.total_tips}
                            </td>
                            <td style={{ padding: 12 }}>
                              {formatMoney(mix.dj_earnings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </> /* 🌟 Added the missing closing tag here */
  );
}