'use client';

import { useState, useEffect, useRef } from "react";
import { getCsrfToken } from "@/utils/csrf";// ─── Utilities ───────────────────────────────────────────────────
import { getAllTracks } from "@/utils/tracks_api_helper";
import backendApi from "@/utils/backendApi";
import { v4 as uuidv4 } from 'uuid';

// import { getCsrfToken } from "@/utils/csrf"; 


function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Generate a consistent colour from artist name for placeholder avatar
function nameToColor(name = '') {
  const colors = [
    ['#FF6B35', '#FF8C42'],
    ['#00C896', '#00A878'],
    ['#6C63FF', '#8B5CF6'],
    ['#FF3CAC', '#FF6B9D'],
    ['#F7C59F', '#E8A87C'],
    ['#43C6AC', '#191654'],
    ['#FC5C7D', '#6A3093'],
    ['#11998E', '#38EF7D'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function TrackAvatar({ track, size = 56, playing = false }) {
  const [colors] = useState(() => nameToColor(track.artist_name));
  const initial = (track.title?.[0] || '?').toUpperCase();

  if (track.cover_image_url) {
    return (
      <img
        src={track.cover_image_url}
        alt={track.title}
        style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: 'white',
      fontFamily: "'Syne', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {playing ? (
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: 3, borderRadius: 2, background: 'white',
              animation: `bar${i} 0.8s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      ) : initial}
    </div>
  );
}

// ─── Mini Player Bar ─────────────────────────────────────────────

function PlayerBar({ track, audioRef, isPlaying, onPlayPause, onClose }) {
  const [progress, setProgress]   = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [audioRef]);

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
  };

  const colors = nameToColor(track?.artist_name);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: '#0D0D0D',
      borderTop: '1px solid #1f1f1f',
      padding: '12px 24px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        style={{
          height: 3, background: '#2a2a2a', borderRadius: 2,
          cursor: 'pointer', position: 'relative',
        }}
      >
        <div style={{
          height: '100%', borderRadius: 2, width: `${progress}%`,
          background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <TrackAvatar track={track} size={44} playing={isPlaying} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, color: '#fff', fontWeight: 700, fontSize: 14,
            fontFamily: "'Syne', sans-serif",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{track.title}</p>
          <p style={{
            margin: 0, color: '#888', fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}>{track.artist_name}</p>
        </div>

        {/* Time */}
        <span style={{ color: '#555', fontSize: 12, fontFamily: 'monospace', flexShrink: 0 }}>
          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
        </span>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            color: 'white', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#555',
            fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Track Card ──────────────────────────────────────────────────

function TrackCard({ track, isActive, isPlaying, onPlay }) {
  const colors = nameToColor(track.artist_name);
  const genre  = track.ai_genre || track.genre || 'Unknown';
  const mood   = track.ai_mood  || '';

  return (
    <div
      onClick={onPlay}
      style={{
        background: isActive ? '#161616' : '#111111',
        border: isActive
          ? `1px solid ${colors[0]}44`
          : '1px solid #1e1e1e',
        borderRadius: 14,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.borderColor = '#333';
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.borderColor = '#1e1e1e';
      }}
    >
      {/* Active indicator stripe */}
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
          borderRadius: '14px 0 0 14px',
        }} />
      )}

      {/* Avatar */}
      <TrackAvatar track={track} size={52} playing={isActive && isPlaying} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: '0 0 3px', color: isActive ? '#fff' : '#e0e0e0',
          fontWeight: 700, fontSize: 15,
          fontFamily: "'Syne', sans-serif",
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.title}
        </p>
        <p style={{
          margin: '0 0 6px', color: '#888', fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {track.artist_name}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {genre && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 20, background: `${colors[0]}22`,
              color: colors[0], fontFamily: "'DM Sans', sans-serif",
            }}>
              {genre}
            </span>
          )}
          {mood && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: '#1e1e1e', color: '#666',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {mood}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{
          margin: '0 0 4px', color: '#555', fontSize: 13,
          fontFamily: 'monospace',
        }}>
          {formatDuration(track.duration)}
        </p>
        {track.bpm && (
          <p style={{ margin: 0, color: '#444', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
            {track.bpm} BPM
          </p>
        )}
      </div>

      {/* Play icon overlay on hover */}
      <div style={{
        position: 'absolute', right: 16,
        color: isActive ? colors[0] : '#444',
        fontSize: 20, fontWeight: 700,
        display: 'flex', alignItems: 'center',
      }}>
        {isActive && isPlaying ? '⏸' : '▶'}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

const BrowseTracksComponent = () => {
  const [tracks, setTracks]         = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const sessionId = useRef(uuidv4()); // unique per browser session
  const listenTimerRef = useRef(null);
  const streamSessionRef = useRef(null); // stores session_id per track play


  const audioRef = useRef(null);

  // ── Fetch tracks ───────────────────────────────────────────────
useEffect(() => {
  const fetch = async () => {
    try {
      const res = await getAllTracks();
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

  // ── Derive genre list from data ────────────────────────────────
  const genres = ['All', ...new Set(
    tracks
      .map(t => t.ai_genre || t.genre)
      .filter(Boolean)
  )];

  // ── Filter logic ───────────────────────────────────────────────
useEffect(() => {
  let result = tracks;
  if (activeGenre !== 'All') {
    result = result.filter(t =>
      (t.ai_genre || t.genre || '').toLowerCase().includes(activeGenre.toLowerCase())
    );
  }
  if (search.trim()) {
    const term = search.toLowerCase();
    result = result.filter(t =>
      (t.title       || '').toLowerCase().includes(term) ||
      (t.artist_name || '').toLowerCase().includes(term) ||
      (t.ai_genre    || '').toLowerCase().includes(term) ||
      (t.ai_mood     || '').toLowerCase().includes(term)
    );
  }
  setFiltered(result);
}, [search, activeGenre, tracks]);

  // ── Play / pause logic ─────────────────────────────────────────

const handlePlay = async (track) => {
  if (!audioRef.current) return;
  if (currentTrack?.id === track.id) {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
    return;
  }
  try {
    const csrfToken = await getCsrfToken();
    const res = await backendApi.get(
      `/media_streaming_management_api/get_listener_play_token/${track.id}/`,
      { headers: { "X-CSRFToken": csrfToken } }
    );
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const playUrl = `${backendBase}${res.data.play_url}`;
    stopListenTimer();                  // stop previous track timer
    audioRef.current.src = playUrl;
    audioRef.current.load();
    await audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);
    recordStream(track);               // record + start new timer
  } catch (err) {
    console.error("Playback failed:", err);
  }
};
  

const handlePlayPause = () => {
  if (!audioRef.current) return;
  if (isPlaying) {
    audioRef.current.pause();
    setIsPlaying(false);
  } else {
    audioRef.current.play();
    setIsPlaying(true);
  }
};


const handleClose = () => {
  audioRef.current?.pause();
  stopListenTimer();
  setCurrentTrack(null);
  setIsPlaying(false);
};

const recordStream = async (track) => {
  const session = uuidv4();
  streamSessionRef.current = session;
  try {
    const csrfToken = await getCsrfToken();
    await backendApi.post(
      '/media_streaming_management_api/record_stream_api/',
      { track: track.id, session_id: session, listen_time: 0 },
      { headers: { "X-CSRFToken": csrfToken } }
    );
    console.log("Stream recorded:", track.title);
    startListenTimer(session);
  } catch (err) {
    console.log("Stream record skipped:", err?.response?.data?.message);
  }
};


const startListenTimer = (session) => {
  if (listenTimerRef.current) clearInterval(listenTimerRef.current);
  let elapsed = 0;
  listenTimerRef.current = setInterval(async () => {
    elapsed += 30;
    try {
      const csrfToken = await getCsrfToken();
      await backendApi.patch(
        `/media_streaming_management_api/update_stream_api/${session}/`,
        { listen_time: elapsed },
        { headers: { "X-CSRFToken": csrfToken } }
      );
      console.log(`Listen time updated: ${elapsed}s`);
    } catch (err) {
      console.error("Failed to update listen time:", err);
    }
  }, 30000);
};

const stopListenTimer = () => {
  if (listenTimerRef.current) {
    clearInterval(listenTimerRef.current);
    listenTimerRef.current = null;
  }
};


// Cleanup timer on unmount
useEffect(() => {
  return () => {
    if (listenTimerRef.current) clearInterval(listenTimerRef.current);
  };
}, []);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes bar1 { from { height: 6px; } to { height: 18px; } }
        @keyframes bar2 { from { height: 10px; } to { height: 14px; } }
        @keyframes bar3 { from { height: 4px; } to { height: 20px; } }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .track-card-anim {
          animation: fadeUp 0.35s ease both;
        }

        .search-input::placeholder { color: #444; }
        .search-input:focus { outline: none; border-color: #FF6B35 !important; }

        .genre-pill:hover { background: #222 !important; color: #fff !important; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: currentTrack ? 100 : 40,
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '40px 32px 0',
          maxWidth: 900, margin: '0 auto',
        }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36, fontWeight: 800,
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            Browse Music
          </h1>
          <p style={{ color: '#555', fontSize: 15, margin: '0 0 28px' }}>
            {tracks.length} tracks from African artists
          </p>

          {/* Search */}
          <input
            className="search-input"
            type="text"
            placeholder="Search by title, artist, genre or mood…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#141414', border: '1px solid #222',
              borderRadius: 12, padding: '13px 18px',
              color: '#fff', fontSize: 15,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 20,
              transition: 'border-color 0.2s',
            }}
          />

          {/* Genre pills */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28,
          }}>
            {genres.map(g => (
              <button
                key={g}
                className="genre-pill"
                onClick={() => setActiveGenre(g)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  background: activeGenre === g ? '#FF6B35' : '#161616',
                  color: activeGenre === g ? '#fff' : '#666',
                  transition: 'all 0.15s ease',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── Track list ── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid #222',
                borderTopColor: '#FF6B35', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ margin: 0 }}>Loading tracks…</p>
            </div>
          )}

          {error && (
            <div style={{
              padding: 24, background: '#1a0a0a',
              border: '1px solid #3a1010', borderRadius: 12,
              color: '#ff6b6b', fontSize: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>🎵</p>
              <p style={{ margin: 0, fontSize: 15 }}>No tracks found</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#333' }}>
                Try a different search or genre
              </p>
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((track, i) => (
                <div
                  key={track.id}
                  className="track-card-anim"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <TrackCard
                    track={track}
                    isActive={currentTrack?.id === track.id}
                    isPlaying={isPlaying && currentTrack?.id === track.id}
                    onPlay={() => handlePlay(track)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Player bar ── */}
      {currentTrack && (
        <PlayerBar
          track={currentTrack}
          audioRef={audioRef}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default BrowseTracksComponent;
