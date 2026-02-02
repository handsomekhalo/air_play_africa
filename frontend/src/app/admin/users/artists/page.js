"use client";

import { useEffect, useState } from "react";
import { getAdminArtists } from "../../../utils/admin_artists";

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const data = await getAdminArtists();
        setArtists(data);
      } catch (err) {
        console.error("Failed to load artists", err);
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, []);

  if (loading) {
    return <div className="p-8">Loading artists…</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Artists</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide artist accounts
        </p>
      </div>

      {/* Artists Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((artist) => (
              <tr
                key={artist.id}
                className="border-t border-border hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">
                  {artist.first_name} {artist.last_name}
                </td>
                <td className="px-4 py-3">{artist.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      artist.status === "active"
                        ? "bg-emerald/10 text-emerald"
                        : "bg-coral/10 text-coral"
                    }`}
                  >
                    {artist.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(artist.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
