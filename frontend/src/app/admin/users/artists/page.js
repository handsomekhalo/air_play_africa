  'use client';

  import { useEffect, useState } from "react";
  import { getAllArtists } from "../../../../utils/admin_artists";

const ArtistsTable = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading artists…</p>;

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b">
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {artists.map((artist) => (
          <tr key={artist.id} className="border-b">
            <td>{artist.first_name}</td>
            <td>{artist.email}</td>
            <td>{artist.is_active ? "Active" : "Suspended"}</td>
            <td className="flex gap-2">
              {/* actions go here */}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ArtistsTable;
