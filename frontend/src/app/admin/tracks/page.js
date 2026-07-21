'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../AuthContext';
import backendApi from '@/utils/backendApi';
import Sidebar from '@/app/Components/System_Management_Components/dashboard/SideBarComponent/sidebar';
import { Music, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
  // import { useAuthGuard } from '../../../../utils/useAuthGuard';
import { useAuthGuard } from '@/utils/useAuthGuard';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const STATUS_CONFIG = {
  ready:     { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', label: 'Ready'     },
  uploading: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Uploading' },
  failed:    { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Failed'    },
};

function TrackRow({ track, onAction, actionLoading }) {
  
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes]       = useState('');
  const s = STATUS_CONFIG[track.status] || STATUS_CONFIG.failed;
  const isProcessing = actionLoading === track.id;

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10,
      marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff',
        }}
      >
        {/* Cover / avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: track.cover_image_url
            ? `url(${track.cover_image_url}) center/cover`
            : 'linear-gradient(135deg, #FF6B35, #FF8C42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#fff', fontWeight: 700,
        }}>
          {!track.cover_image_url && (track.title?.[0] || '?').toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#111',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {track.title}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            {track.artist_name} · {formatDuration(track.duration)}
            {track.bpm ? ` · ${track.bpm} BPM` : ''}
          </p>
        </div>

        {/* Genre / mood badges */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {track.ai_genre && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 20, background: '#f3f4f6', color: '#374151',
            }}>
              {track.ai_genre}
            </span>
          )}
          {track.ai_mood && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: '#f3f4f6', color: '#6b7280',
            }}>
              {track.ai_mood}
            </span>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 12, fontWeight: 600, padding: '3px 10px',
          borderRadius: 20, flexShrink: 0,
          background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        }}>
          {s.label}
        </span>

        {/* Upload date */}
        <span style={{ color: '#9ca3af', fontSize: 12, flexShrink: 0 }}>
          {new Date(track.upload_date).toLocaleDateString()}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>

          {/* AI description */}
          {track.ai_description && (
            <p style={{
              margin: '0 0 14px', fontSize: 13, color: '#374151',
              background: '#f3f4f6', padding: '10px 12px', borderRadius: 8,
              lineHeight: 1.6,
            }}>
              {track.ai_description}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            {[
              { label: 'Plays',      value: track.play_count || 0 },
              { label: 'Merit Score', value: track.merit_score || 0 },
              { label: 'File Size',  value: track.file_size ? `${(track.file_size/1024/1024).toFixed(1)} MB` : '—' },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600,
                  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Admin notes */}
          <textarea
            placeholder="Optional moderation notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid #e5e7eb', fontSize: 13,
              fontFamily: 'inherit', resize: 'vertical',
              boxSizing: 'border-box', marginBottom: 12,
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onAction(track.id, 'approve', notes)}
              disabled={isProcessing || track.status === 'ready'}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: track.status === 'ready' ? '#d1d5db' : '#10b981',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              <CheckCircle size={14} />
              {track.status === 'ready' ? 'Already Live' : 'Approve'}
            </button>
            <button
              onClick={() => onAction(track.id, 'reject', notes)}
              disabled={isProcessing || track.status === 'failed'}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: track.status === 'failed' ? '#d1d5db' : '#ef4444',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              <XCircle size={14} />
              {track.status === 'failed' ? 'Already Rejected' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTracksPage() {
  useAuthGuard('/login', 'Admin');

  const { authToken } = useAuth();

  const [tracks, setTracks]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch]           = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback]       = useState(null);

  const fetchTracks = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await backendApi.get(
        '/media_streaming_management/get_all_tracks_admin/',
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') setTracks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTracks(); }, [authToken]);

  const handleAction = async (trackId, action, notes) => {
    setActionLoading(trackId);
    try {
      const res = await backendApi.patch(
        `/media_streaming_management/moderate_track/${trackId}/`,
        { action, notes },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') {
        setFeedback({ type: 'success', message: res.data.message });
        fetchTracks();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Action failed.'
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter + search
  const filtered = tracks.filter(t => {
    const matchesStatus = activeFilter === 'all' || t.status === activeFilter;
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      (t.title || '').toLowerCase().includes(term) ||
      (t.artist_name || '').toLowerCase().includes(term) ||
      (t.ai_genre || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all:       tracks.length,
    ready:     tracks.filter(t => t.status === 'ready').length,
    uploading: tracks.filter(t => t.status === 'uploading').length,
    failed:    tracks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1">
        <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Music className="h-6 w-6" /> Track Moderation
                </h1>
                <p className="text-sm text-muted-foreground">
                  Review and approve artist uploads
                </p>
              </div>
              <button
                onClick={fetchTracks}
                style={{
                  background: 'none', border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 14px',
                  fontSize: 13, color: '#6b7280', cursor: 'pointer',
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([tab, count]) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: activeFilter === tab ? '#111' : '#f3f4f6',
                  color: activeFilter === tab ? '#fff' : '#6b7280',
                  textTransform: 'capitalize', transition: 'all 0.15s',
                }}
              >
                {tab} ({count})
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by title, artist or genre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '11px 16px', borderRadius: 10,
              border: '1px solid #e5e7eb', fontSize: 14,
              marginBottom: 20, fontFamily: 'inherit',
              background: '#fff', color: '#111',
            }}
          />

          {/* Feedback */}
          {feedback && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: 13, fontWeight: 500,
            }}>
              {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.message}
            </div>
          )}

          {/* Track list */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>
              Loading tracks…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>
              No {activeFilter !== 'all' ? activeFilter : ''} tracks found.
            </div>
          ) : (
            filtered.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                onAction={handleAction}
                actionLoading={actionLoading}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}

// 'use client';

// import TrackModerationComponent from '@/components/admin/TrackModerationComponent';


// export default function Page() {
//   return (
//     <div style={{ padding: '32px 24px' }}>
//       <div style={{ marginBottom: 24 }}>
//         <h1 style={{
//           fontSize: 22, fontWeight: 700,
//           color: '#111827', margin: '0 0 4px',
//           fontFamily: "'DM Sans', sans-serif",
//         }}>
//           Track Moderation
//         </h1>
//         <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
//           Review and approve or reject artist uploads
//         </p>
//       </div>
//       <TrackModerationComponent />
//     </div>
//   );
// }
