"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./UI/Card";
import { Badge } from "./UI/Badge";

import { Music, TrendingUp, Award } from "lucide-react";

export const TrackAnalytics = ({ tracks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Your Tracks Performance
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {track.title}
                  </h4>

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
                  <p className="text-xs text-muted-foreground">Streams</p>
                  <p className="text-lg font-bold">
                    {Number(track.streams).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-lg font-bold text-emerald">
                    R{Number(track.earnings).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Listener Score
                  </p>
                  <p className="text-lg font-bold text-gold">
                    {track.listenerScore}/100
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
