  'use client';


  import { useEffect, useState } from "react";
  import { getAllAdmins } from "../../../../utils/admin_artists";

const ArtistsTable = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await getAllAdmins();
        setArtists(data.admins || []);
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
        {artists.map((admin) => (
          <tr key={admin.id} className="border-b">
            <td>{admin.first_name}</td>
            <td>{admin.email}</td>
            <td>{admin.is_active ? "Active" : "Suspended"}</td>
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
