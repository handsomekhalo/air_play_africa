'use client';

import { useState, useEffect, useRef } from 'react';
import backendApi from '@/utils/backendApi';
import { getCsrfToken } from '@/utils/csrf';
import { v4 as uuidv4 } from 'uuid';
import ListenerNav from '@/app/Components/Listener/ListenerNav';

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

export default function ChartsPage() {
  const [tracks, setTracks]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const audioRef         = useRef(null);
  const listenTimerRef   = useRef(null);
  const streamSessionRef = useRef(null);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await backendApi.get('/media_streaming_management/merit_score_charts/');
        if (res.data.status === 'success') setTracks(res.data.data);
        else setError('Failed to load charts.');
      } catch {
        setError('Could not connect to server.');
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  useEffect(() => {
    return () => { if (listenTimerRef.current) clearInterval(listenTimerRef.current); };
  }, []);

  const handlePlay = async (track) => {
    if (!audioRef.current) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else           { audioRef.current.play();  setIsPlaying(true);  }
      return;
    }
    try {
      const res = await backendApi.get(
        `/media_streaming_management_api/get_listener_play_token/${track.id}/`
      );
      const base    = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim() || 'http://localhost:8000';
      const playUrl = `${base}${res.data.play_url}`;
      if (listenTimerRef.current) clearInterval(listenTimerRef.current);
      audioRef.current.src = playUrl;
      audioRef.current.load();
      await audioRef.current.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      recordStream(track);
    } catch (err) {
      console.error('Playback failed:', err);
    }
  };

  const recordStream = async (track) => {
    const session = uuidv4();
    streamSessionRef.current = session;
    try {
      const csrfToken = await getCsrfToken();
      await backendApi.post(
        '/media_streaming_management_api/record_stream_api/',
        { track: track.id, session_id: session, listen_time: 0 },
        { headers: { 'X-CSRFToken': csrfToken } }
      );
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
        } catch {}
      }, 30000);
    } catch {}
  };

  const colors_top3 = ['#F4B740', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      <ListenerNav />

      <div style={{
        minHeight: '100vh', background: '#0a0a0a', color: '#fff',
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: currentTrack ? 120 : 60,
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 0' }}>

          {/* Header */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800,
            margin: '0 0 4px', letterSpacing: '-0.02em',
          }}>
            🏆 Weekly Charts
          </h1>
          <p style={{ color: '#555', fontSize: 15, margin: '0 0 32px' }}>
            Top tracks ranked by listener engagement
          </p>

          {/* States */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid #222',
                borderTopColor: '#FF6B35', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', margin: '0 auto 16px',
              }} />
              <p style={{ margin: 0 }}>Loading charts…</p>
            </div>
          )}

          {error && (
            <div style={{
              padding: 24, background: '#1a0a0a', border: '1px solid #3a1010',
              borderRadius: 12, color: '#ff6b6b', fontSize: 14,
            }}>⚠️ {error}</div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>🎵</p>
              <p style={{ margin: 0, fontSize: 15 }}>No chart data yet</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#333' }}>
                Charts populate as listeners stream tracks
              </p>
            </div>
          )}

          {/* Track list */}
          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tracks.map((track, i) => {
                const colors    = nameToColor(track.artist_name);
                const isActive  = currentTrack?.id === track.id;
                const rankColor = i < 3 ? colors_top3[i] : '#444';

                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlay(track)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isActive ? '#161616' : '#111',
                      border: isActive ? `1px solid ${colors[0]}44` : '1px solid #1e1e1e',
                      transition: 'all 0.2s ease',
                      animation: `fadeUp 0.3s ease ${i * 0.03}s both`,
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#333'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#1e1e1e'; }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 32, flexShrink: 0, textAlign: 'center',
                      fontSize: i < 3 ? 18 : 14,
                      fontWeight: 800, color: rankColor,
                      fontFamily: "'Syne', sans-serif",
                    }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : track.rank}
                    </div>

                    {/* Cover */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                      background: track.cover_image_url
                        ? `url(${track.cover_image_url}) center/cover`
                        : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 800, color: '#fff',
                      fontFamily: "'Syne', sans-serif",
                    }}>
                      {!track.cover_image_url && track.title?.[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 2px', color: isActive ? '#fff' : '#e0e0e0',
                        fontWeight: 700, fontSize: 15,
                        fontFamily: "'Syne', sans-serif",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {track.title}
                      </p>
                      <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                        {track.artist_name}
                      </p>
                    </div>

                    {/* Genre */}
                    {track.genre && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 20, background: `${colors[0]}22`,
                        color: colors[0], flexShrink: 0,
                      }}>
                        {track.genre}
                      </span>
                    )}

                    {/* Score + duration */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: '0 0 2px', color: '#F4B740', fontSize: 12, fontWeight: 700 }}>
                        ⚡ {Math.round(track.merit_score)}
                      </p>
                      <p style={{ margin: 0, color: '#555', fontSize: 12, fontFamily: 'monospace' }}>
                        {formatDuration(track.duration)}
                      </p>
                    </div>

                    {/* Play indicator */}
                    <div style={{ color: isActive ? colors[0] : '#333', fontSize: 18, flexShrink: 0 }}>
                      {isActive && isPlaying ? '⏸' : '▶'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mini player */}
      {currentTrack && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: '#0D0D0D', borderTop: '1px solid #1f1f1f',
          padding: '12px 24px 16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {(() => {
            const colors = nameToColor(currentTrack.artist_name);
            return (
              <>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: currentTrack.cover_image_url
                    ? `url(${currentTrack.cover_image_url}) center/cover`
                    : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#fff',
                }}>
                  {!currentTrack.cover_image_url && currentTrack.title?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentTrack.title}
                  </p>
                  <p style={{ margin: 0, color: '#888', fontSize: 12 }}>{currentTrack.artist_name}</p>
                </div>
                <button
                  onClick={() => {
                    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
                    else           { audioRef.current.play();  setIsPlaying(true);  }
                  }}
                  style={{
                    width: 44, height: 44, borderRadius: '50%', border: 'none',
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                    color: '#fff', fontSize: 18, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => { audioRef.current?.pause(); if (listenTimerRef.current) clearInterval(listenTimerRef.current); setCurrentTrack(null); setIsPlaying(false); }}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }}
                >✕</button>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}