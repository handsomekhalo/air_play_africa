'use client';

import { useEffect, useState } from "react";
import { getAllArtists, toggleUserActive } from "../../../../utils/admin_artists";
import { useAuth } from "../../../../../AuthContext";
import Sidebar from "@/app/Components/System_Management_Components/dashboard/SideBarComponent/sidebar";
import { Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

function ArtistRow({ artist, onToggle, toggling }) {
  const [expanded, setExpanded] = useState(false);
  const isProcessing = toggling === artist.id;

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
          transition: 'background 0.15s',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: artist.is_active
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #9ca3af, #6b7280)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: '#fff',
        }}>
          {(artist.first_name?.[0] || '?').toUpperCase()}
        </div>

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#111' }}>
            {artist.first_name} {artist.last_name}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{artist.email}</p>
        </div>

        {/* Onboarded badge */}
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px',
          borderRadius: 20, flexShrink: 0,
          background: artist.is_onboarded ? '#eff6ff' : '#fefce8',
          border: `1px solid ${artist.is_onboarded ? '#bfdbfe' : '#fde68a'}`,
          color: artist.is_onboarded ? '#3b82f6' : '#f59e0b',
        }}>
          {artist.is_onboarded ? 'Onboarded' : 'Incomplete'}
        </span>

        {/* Active badge */}
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px',
          borderRadius: 20, flexShrink: 0,
          background: artist.is_active ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${artist.is_active ? '#a7f3d0' : '#fecaca'}`,
          color: artist.is_active ? '#10b981' : '#ef4444',
        }}>
          {artist.is_active ? 'Active' : 'Suspended'}
        </span>

        {expanded
          ? <ChevronUp size={16} color="#9ca3af" />
          : <ChevronDown size={16} color="#9ca3af" />
        }
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Location',       value: artist.location || '—' },
              { label: 'Joined',         value: new Date(artist.date_joined).toLocaleDateString() },
              { label: 'Onboarding Step', value: artist.onboarding_step ?? '—' },
              { label: 'Bio',            value: artist.bio || '—' },
              { label: 'Wallet Address', value: artist.wallet_address || '—' },
              { label: 'Last Login',     value: artist.last_login ? new Date(artist.last_login).toLocaleDateString() : 'Never' },
            ].map(field => (
              <div key={field.label}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600,
                  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#111',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          {/* Toggle action */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(artist.id); }}
            disabled={isProcessing}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: artist.is_active ? '#ef4444' : '#10b981',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            {artist.is_active
              ? <><XCircle size={14} /> Suspend Artist</>
              : <><CheckCircle size={14} /> Activate Artist</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminArtistsPage() {
  const { authToken } = useAuth();

  const [artists, setArtists]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [toggling, setToggling] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await getAllArtists();
        setArtists(data.artists || []);
      } catch (err) {
        console.error("Failed to load artists", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const handleToggle = async (userId) => {
    setToggling(userId);
    try {
      const res = await toggleUserActive(userId);
      setArtists(prev =>
        prev.map(a => a.id === userId ? { ...a, is_active: res.is_active } : a)
      );
      setFeedback({
        type: 'success',
        message: `Artist ${res.is_active ? 'activated' : 'suspended'} successfully.`
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update artist status.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setToggling(null);
    }
  };

  const filtered = artists.filter(a => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      (a.first_name || '').toLowerCase().includes(term) ||
      (a.last_name  || '').toLowerCase().includes(term) ||
      (a.email      || '').toLowerCase().includes(term);
    const matchesFilter =
      filter === 'all'       ? true :
      filter === 'active'    ? a.is_active :
      filter === 'suspended' ? !a.is_active :
      filter === 'onboarded' ? a.is_onboarded :
      filter === 'incomplete'? !a.is_onboarded : true;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    all:        artists.length,
    active:     artists.filter(a => a.is_active).length,
    suspended:  artists.filter(a => !a.is_active).length,
    onboarded:  artists.filter(a => a.is_onboarded).length,
    incomplete: artists.filter(a => !a.is_onboarded).length,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1">
        <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" /> Artist Management
            </h1>
            <p className="text-sm text-muted-foreground">
              {counts.all} artists · {counts.active} active · {counts.suspended} suspended
            </p>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([tab, count]) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: filter === tab ? '#111' : '#f3f4f6',
                  color: filter === tab ? '#fff' : '#6b7280',
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
            placeholder="Search by name or email…"
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

          {/* List */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>
              Loading artists…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>
              No {filter !== 'all' ? filter : ''} artists found.
            </div>
          ) : (
            filtered.map(artist => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}