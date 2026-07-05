'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import backendApi from '@/utils/backendApi';
import { getCsrfToken } from '@/utils/csrf';
import { v4 as uuidv4 } from 'uuid';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function nameToColor(name = '') {
  const colors = [
    ['#FF6B35', '#FF8C42'], ['#00C896', '#00A878'],
    ['#6C63FF', '#8B5CF6'], ['#FF3CAC', '#FF6B9D'],
    ['#43C6AC', '#191654'], ['#FC5C7D', '#6A3093'],
    ['#11998E', '#38EF7D'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function PublicTrackPage({ trackId }) {
  const router   = useRouter();
  const audioRef = useRef(null);
  const streamSessionRef = useRef(null);
  const listenTimerRef   = useRef(null);

  const [track, setTrack]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied]     = useState(false);

  // ── Fetch public track data ───────────────────────────────────
  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const res = await backendApi.get(
          `/media_streaming_management_api/get_public_track_api/${trackId}/`
        );
        if (res.data.status === 'success') {
          setTrack(res.data.data);
        } else {
          setError('Track not found.');
        }
      } catch {
        setError('Track not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrack();
  }, [trackId]);

  // ── Audio time tracking ───────────────────────────────────────
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
  }, []);

  useEffect(() => {
    return () => { if (listenTimerRef.current) clearInterval(listenTimerRef.current); };
  }, []);

  // ── Play ──────────────────────────────────────────────────────
  const handlePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If already loaded, just resume
    if (audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    try {
      const res = await backendApi.get(
        `/media_streaming_management_api/get_listener_play_token/${trackId}/`
      );
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      audioRef.current.src = `${backendBase}${res.data.play_url}`;
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
      recordStream();
    } catch (err) {
      console.error('Playback failed:', err);
    }
  };

  const recordStream = async () => {
    const session = uuidv4();
    streamSessionRef.current = session;
    try {
      const csrfToken = await getCsrfToken();
      await backendApi.post(
        '/media_streaming_management_api/record_stream_api/',
        { track: trackId, session_id: session, listen_time: 0 },
        { headers: { 'X-CSRFToken': csrfToken } }
      );
      startListenTimer(session);
    } catch (err) {
      console.log('Stream record skipped:', err?.response?.data?.message);
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
          { headers: { 'X-CSRFToken': csrfToken } }
        );
      } catch (err) {
        console.error('Failed to update listen time:', err);
      }
    }, 30000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── States ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #222', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: '#ff6b6b', fontSize: 16 }}>⚠️ {error}</p>
      <button onClick={() => router.push('/')} style={{ color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        Go to AirPlay Africa →
      </button>
    </div>
  );

  const colors = nameToColor(track.artist_name);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          animation: 'fadeUp 0.4s ease both',
        }}>
          {/* Cover / Avatar */}
          <div style={{
            width: '100%', aspectRatio: '1',
            borderRadius: 20, marginBottom: 24,
            background: track.cover_image_url
              ? `url(${track.cover_image_url}) center/cover`
              : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 80, fontWeight: 800, color: 'white',
            fontFamily: "'Syne', sans-serif",
            boxShadow: `0 32px 80px ${colors[0]}44`,
          }}>
            {!track.cover_image_url && track.title?.[0]?.toUpperCase()}
          </div>

          {/* Track info */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              margin: '0 0 6px', color: '#fff',
              fontSize: 28, fontWeight: 800,
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '-0.02em',
            }}>{track.title}</h1>
            <p style={{ margin: '0 0 10px', color: '#888', fontSize: 16 }}>
              {track.artist_name}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {track.genre && (
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px',
                  borderRadius: 20, background: `${colors[0]}22`, color: colors[0],
                }}>
                  {track.genre}
                </span>
              )}
              {track.mood && (
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 20,
                  background: '#1e1e1e', color: '#666',
                }}>
                  {track.mood}
                </span>
              )}
              {track.bpm && (
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 20,
                  background: '#1e1e1e', color: '#666',
                }}>
                  {track.bpm} BPM
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 4, background: '#1e1e1e', borderRadius: 2,
            marginBottom: 12, cursor: 'pointer', position: 'relative',
          }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              if (audioRef.current?.duration) audioRef.current.currentTime = pct * audioRef.current.duration;
            }}
          >
            <div style={{
              height: '100%', borderRadius: 2, width: `${progress}%`,
              background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
              transition: 'width 0.1s linear',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>
              {formatDuration(Math.floor(currentTime))}
            </span>
            <span style={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>
              {formatDuration(track.duration)}
            </span>
          </div>

          {/* Play button */}
          <button
            onClick={handlePlay}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
              color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Syne', sans-serif", marginBottom: 12,
              boxShadow: `0 8px 24px ${colors[0]}44`,
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 10,
                border: '1px solid #2a2a2a', background: 'transparent',
                color: copied ? '#4ade80' : '#888',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
            <button
              onClick={() => router.push('/browse')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 10,
                border: `1px solid ${colors[0]}44`, background: `${colors[0]}15`,
                color: colors[0], fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Browse More →
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', color: '#333', fontSize: 12 }}>
              Streamed on
            </p>
            <p style={{
              margin: 0, color: '#FF6B35', fontSize: 14, fontWeight: 700,
              fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em',
            }}>
              AirPlay Africa
            </p>
            <p style={{ margin: '4px 0 0', color: '#2a2a2a', fontSize: 11 }}>
              {track.play_count?.toLocaleString()} plays
            </p>
          </div>
        </div>
      </div>
    </>
  );
}