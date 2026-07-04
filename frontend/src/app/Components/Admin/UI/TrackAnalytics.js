"use client";


import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../DashboardUIComponents/UI/Card";
import { Badge } from "../../DashboardUIComponents/UI/Badge";
import { Music, TrendingUp, Award } from "lucide-react";

import backendApi from "@/utils/backendApi";
import { useAuth } from "../../../../../AuthContext";

export const TrackAnalytics = () => {
  const { authToken, isAuthenticated } = useAuth();

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);


  const playTrack = async (track) => {
    const res = await backendApi.get(
      `/media_streaming_management/proxy_get_play_token/${track.id}/`,
      {
        headers: { Authorization: `Token ${authToken}` }
      }
    );

    // setCurrentTrack({
    //   ...track,
    //   playUrl: res.data.play_url,
    // });
    setCurrentTrack({
  ...track,
  playUrl: `http://127.0.0.1:8000${res.data.play_url}`,
});

  };

useEffect(() => {
  if (!authToken || !isAuthenticated) return;

  const fetchData = async () => {
    try {
      const [tracksRes, earningsRes] = await Promise.all([
        backendApi.get('/media_streaming_management/my_tracks/', {
          headers: { Authorization: `Token ${authToken}` }
        }),
        backendApi.get('/media_streaming_management/get_artist_track_earnings/', {
          headers: { Authorization: `Token ${authToken}` }
        })
      ]);

      if (tracksRes.data?.status === 'success' && earningsRes.data?.status === 'success') {
        const earningsMap = {};
        earningsRes.data.data.forEach(e => {
          earningsMap[e.track_id] = e;
        });

        // Merge earnings into tracks
        const merged = tracksRes.data.data.map(t => ({
          ...t,
          earnings:           parseFloat(earningsMap[t.id]?.total_earnings  || 0),
          stream_earnings:    parseFloat(earningsMap[t.id]?.stream_earnings  || 0),
          tip_earnings:       parseFloat(earningsMap[t.id]?.tip_earnings     || 0),
          qualifying_streams: earningsMap[t.id]?.qualifying_streams          || 0,
        }));

        setTracks(merged);
      }
    } catch (error) {
      console.error('Failed to fetch track data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [authToken, isAuthenticated]);

  // ── Adapt raw track data to TrackAnalytics' expected shape ─────
const trackAnalyticsData = tracks.map(t => ({
  id:                 t.id,
  title:              t.title,
  streams:            t.play_count || 0,
  qualifying_streams: t.qualifying_streams || 0,
  earnings:           t.earnings || 0,
  stream_earnings:    t.stream_earnings || 0,
  tip_earnings:       t.tip_earnings || 0,
  listenerScore:      t.merit_score ?? 0,
  verifiedOrganic:    true,
  aiMood:             t.ai_mood || '',
  aiGenre:            t.ai_genre || t.genre || 'Unknown',
}));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Your Tracks Performance
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* AUDIO PLAYER */}
        {/* {currentTrack && (
          <audio
            key={currentTrack.id}
            // src={`/api/tracks/${currentTrack.id}/preview/`}
            // src={`/media_streaming_management_api/proxy_play_track_api/${currentTrack.id}/`}
              src={`/media_streaming_management_api/proxy_play_track_api/${currentTrack.id}/`}

            controls
            autoPlay
            className="w-full mb-4"
          />
        )} */}
        {/* {currentTrack && (
  <audio
    key={currentTrack.id}
    src={currentTrack.playUrl}
    controls
    autoPlay
  />
)} */}
{/* {currentTrack && (
  <audio
    src={currentTrack.playUrl}
    controls
    autoPlay
  />
)} */}
{currentTrack && (
  <audio
    key={currentTrack.id}
    src={currentTrack.playUrl}
    controls
    autoPlay
  />
)}



        {loading && (
          <p className="text-sm text-muted-foreground">Loading tracks…</p>
        )}

        {!loading && tracks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            You haven’t uploaded any tracks yet.
          </p>
        )}

        <div className="space-y-4">
  {trackAnalyticsData.map((track) => (
    <div
      key={track.id}
      className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold">{track.title}</h4>

          <button
            onClick={() => playTrack(tracks.find(t => t.id === track.id))}
            className="text-sm text-primary hover:underline"
          >
            ▶ Play
          </button>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {track.aiMood && (
              <Badge variant="secondary" className="text-xs">
                {track.aiMood}
              </Badge>
            )}
            {track.aiGenre && (
              <Badge variant="outline" className="text-xs">
                {track.aiGenre}
              </Badge>
            )}
            {track.verifiedOrganic && (
              <Badge className="text-xs bg-gold text-charcoal">
                <Award className="h-3 w-3 mr-1" />
                Verified Organic
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
  

        <div>
          <p className="text-xs text-muted-foreground">Earnings</p>
          <p className="text-lg font-bold text-emerald">
            R{Number(track.earnings).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {track.qualifying_streams} streams · R{Number(track.tip_earnings).toFixed(2)} tips
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Listener Score
          </p>
          <p className="text-lg font-bold text-gold">
            {track.listenerScore}
          </p>
        </div>
      </div>
    </div>
  ))}
</div>

        {/* <div className="space-y-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold">{track.title}</h4>

                  <button
                    // onClick={() => setCurrentTrack(track)}
                    onClick={() => playTrack(track)}

                    className="text-sm text-primary hover:underline"
                  >
                    ▶ Play
                  </button>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {track.ai_mood && (
                      <Badge variant="secondary" className="text-xs">
                        {track.ai_mood}
                      </Badge>
                    )}

                    {track.ai_genre && (
                      <Badge variant="outline" className="text-xs">
                        {track.ai_genre}
                      </Badge>
                    )}

                    {track.verified_organic && (
                      <Badge className="text-xs bg-gold text-charcoal">
                        <Award className="h-3 w-3 mr-1" />
                        Verified Organic
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Streams</p>
                  <p className="text-lg font-bold">
                    {Number(track.streams || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-lg font-bold text-emerald">
                    R{Number(track.earnings || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Listener Score
                  </p>
                  <p className="text-lg font-bold text-gold">
                    {track.listener_score || 0}/100
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div> */}
      </CardContent>
    </Card>
  );
};
