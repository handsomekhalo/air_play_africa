'use client';

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/utils/useAuthGuard";
import { getAllTracksAdmin, moderateTrack } from "@/utils/admin_artists";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function StatusBadge({ status }) {
  const map = {
    ready:      { bg: '#dcfce7', color: '#166534', label: 'Ready'      },
    uploading:  { bg: '#dbeafe', color: '#1e40af', label: 'Uploading'  },
    processing: { bg: '#fef9c3', color: '#854d0e', label: 'Processing' },
    failed:     { bg: '#fee2e2', color: '#991b1b', label: 'Rejected'   },
  };
  const style = map[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 12,
      fontWeight: 600, background: style.bg, color: style.color,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {style.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────

const TrackModerationComponent = () => {
  useAuthGuard('/login', 'Admin');

  const [tracks, setTracks]         = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // track id being actioned

  // ── Fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllTracksAdmin();
        if (res.status === 'success') {
          setTracks(res.data);
          setFiltered(res.data);
        } else {
          setError('Failed to load tracks.');
        }
      } catch (err) {
        console.error(err);
        setError('Could not connect to server.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Filter ────────────────────────────────────────────────────
  useEffect(() => {
    let result = tracks;

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(t =>
        (t.title        || '').toLowerCase().includes(term) ||
        (t.artist_name  || '').toLowerCase().includes(term) ||
        (t.genre        || '').toLowerCase().includes(term) ||
        (t.ai_genre     || '').toLowerCase().includes(term)
      );
    }

    setFiltered(result);
  }, [search, statusFilter, tracks]);

  // ── Moderate ─────────────────────────────────────────────────
  const handleModerate = async (trackId, action) => {
    setActionLoading(trackId);
    try {
      const res = await moderateTrack(trackId, action);
      if (res.status === 'success') {
        // Update track status in local state immediately
        setTracks(prev =>
          prev.map(t =>
            t.id === trackId ? { ...t, status: res.new_status } : t
          )
        );
      } else {
        alert(res.message || 'Action failed.');
      }
    } catch (err) {
      console.error('Moderation failed:', err);
      alert('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────
  const stats = {
    total:      tracks.length,
    ready:      tracks.filter(t => t.status === 'ready').length,
    uploading:  tracks.filter(t => t.status === 'uploading').length,
    processing: tracks.filter(t => t.status === 'processing').length,
    rejected:   tracks.filter(t => t.status === 'failed').length,
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '0 0 40px' }}>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total Tracks', value: stats.total,      color: '#6366f1' },
          { label: 'Approved',     value: stats.ready,      color: '#10b981' },
          { label: 'Pending',      value: stats.processing + stats.uploading, color: '#f59e0b' },
          { label: 'Rejected',     value: stats.rejected,   color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '16px 20px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by title, artist or genre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220,
            padding: '9px 14px', borderRadius: 8,
            border: '1px solid #e5e7eb', fontSize: 14,
            fontFamily: 'inherit', color: '#111827',
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: 8,
            border: '1px solid #e5e7eb', fontSize: 14,
            fontFamily: 'inherit', color: '#374151',
            background: '#fff', cursor: 'pointer',
          }}
        >
          <option value="all">All statuses</option>
          <option value="uploading">Uploading</option>
          <option value="processing">Processing</option>
          <option value="ready">Approved</option>
          <option value="failed">Rejected</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <p>Loading tracks…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: 16, background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 8,
          color: '#991b1b', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <p style={{ fontSize: 14 }}>No tracks found.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Title', 'Artist', 'Genre', 'Duration', 'Uploaded', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 700, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((track, i) => (
                <tr
                  key={track.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: actionLoading === track.id ? '#fafafa' : '#fff',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', maxWidth: 200 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </div>
                    {track.ai_mood && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{track.ai_mood}</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>
                    {track.artist_name}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                    {track.ai_genre || track.genre || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {formatDuration(track.duration)}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                    {track.upload_date
                      ? new Date(track.upload_date).toLocaleDateString('en-ZA')
                      : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={track.status} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Approve button — show unless already ready */}
                      {track.status !== 'ready' && (
                        <button
                          onClick={() => handleModerate(track.id, 'approve')}
                          disabled={actionLoading === track.id}
                          style={{
                            padding: '5px 12px', borderRadius: 6,
                            border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                            background: '#dcfce7', color: '#166534',
                            fontFamily: 'inherit',
                            opacity: actionLoading === track.id ? 0.5 : 1,
                          }}
                        >
                          {actionLoading === track.id ? '…' : 'Approve'}
                        </button>
                      )}
                      {/* Reject button — show unless already rejected */}
                      {track.status !== 'failed' && (
                        <button
                          onClick={() => handleModerate(track.id, 'reject')}
                          disabled={actionLoading === track.id}
                          style={{
                            padding: '5px 12px', borderRadius: 6,
                            border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                            background: '#fee2e2', color: '#991b1b',
                            fontFamily: 'inherit',
                            opacity: actionLoading === track.id ? 0.5 : 1,
                          }}
                        >
                          {actionLoading === track.id ? '…' : 'Reject'}
                        </button>
                      )}
                      {/* Already approved and rejected show nothing actionable */}
                      {track.status === 'ready' && track.status === 'failed' && (
                        <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrackModerationComponent;
