  'use client';

  import { useEffect, useState } from "react";
  import { getAllArtists, toggleUserActive} from "../../../../utils/admin_artists";
  


  const ArtistsTable = () => {
  const [artists, setArtists] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredArtists = artists.filter(a => {
    const term = search.toLowerCase();
    return (
      (a.first_name || '').toLowerCase().includes(term) ||
      (a.last_name || '').toLowerCase().includes(term) ||
      (a.email || '').toLowerCase().includes(term)
    );
  });

  const handleToggleArtist = async (artistId) => {
    try {
      const res = await toggleUserActive(artistId);
      setArtists(prev =>
        prev.map(a =>
          a.id === artistId ? { ...a, is_active: res.is_active } : a
        )
      );
    } catch (err) {
      console.error("Failed to toggle artist", err);
    }
  };

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
    <div>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full text-sm"
      />
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
          {filteredArtists.map((artist) => (
            <tr key={artist.id} className="border-b">
              <td>{artist.first_name} {artist.last_name}</td>
              <td>{artist.email}</td>
              <td>{artist.is_active ? "Active" : "Suspended"}</td>
              <td className="flex gap-2">
                <button
                  onClick={() => handleToggleArtist(artist.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    artist.is_active
                      ? "bg-red-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {artist.is_active ? "Suspend" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArtistsTable;
// const ArtistsTable = () => {
//   const [artists, setArtists] = useState([]);
//   const [search, setSearch] = useState("");

//   const [loading, setLoading] = useState(true);

//   // const [artists, setArtists] = useState([]);

//   const filteredArtists = artists.filter(a =>
//   a.name.toLowerCase().includes(search.toLowerCase()) ||
//   a.email.toLowerCase().includes(search.toLowerCase())
// );


// const handleToggleArtist = async (artistId) => {
//   try {
//     const res = await toggleUserActive(artistId);

//     setArtists(prev =>
//       prev.map(a =>
//         a.id === artistId
//           ? { ...a, is_active: res.is_active }
//           : a
//       )
//     );
//   } catch (err) {
//     console.error("Failed to toggle artist", err);
//   }
// };


//   useEffect(() => {
//     const fetchArtists = async () => {
//       try {
//         const data = await getAllArtists();
//         setArtists(data.artists || []);
//       } catch (err) {
//         console.error("Failed to load artists", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchArtists();
//   }, []);

//   if (loading) return <p>Loading artists…</p>;

//   return (
    
//     <table className="min-w-full text-sm">
//       <thead>
//         <tr className="border-b">
//           <th>Name</th>
//           <th>Email</th>
//           <th>Status</th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {artists.map((artist) => (
//           <tr key={artist.id} className="border-b">
//             <td>{artist.first_name}</td>
//             <td>{artist.email}</td>
//             <td>{artist.is_active ? "Active" : "Suspended"}</td>
//             <td className="flex gap-2">
//               {/* actions go here */}
//                       <button
//   onClick={() => handleToggleArtist(artist.id)}
//   className={`px-3 py-1 rounded text-sm ${
//     artist.is_active ? "bg-red-500 text-white" : "bg-green-500 text-white"
//   }`}
// >
//   {artist.is_active ? "Suspend" : "Activate"}
// </button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default ArtistsTable;
