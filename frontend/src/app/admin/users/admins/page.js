  'use client';


  import { useEffect, useState } from "react";
  import { getAllAdmins , toggleUserActive } from "../../../../utils/admin_artists";

const AdminsTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

// const [admins, setAdmins] = useState([]);

const handleToggleAdmin = async (adminId) => {
  try {
    const res = await toggleUserActive(adminId);

    setAdmins(prev =>
      prev.map(a =>
        a.id === adminId
          ? { ...a, is_active: res.is_active }
          : a
      )
    );
  } catch (err) {
    console.error("Failed to toggle admin", err);
  }
};





  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const data = await getAllAdmins();
        setAdmins(data.admins || []);
      } catch (err) {
        console.error("Failed to load admins", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  if (loading) return <p>Loading admins…</p>;

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
        {admins.map((admin) => (
          <tr key={admin.id} className="border-b">
            <td>{admin.first_name}</td>
            <td>{admin.email}</td>
            <td>{admin.is_active ? "Active" : "Suspended"}</td>
            <td className="flex gap-2">
              {/* actions go here */}
              <button
  onClick={() => handleToggleAdmin(admin.id)}
  className={`px-3 py-1 rounded text-sm ${
    admin.is_active ? "bg-red-500 text-white" : "bg-green-500 text-white"
  }`}
>
  {admin.is_active ? "Suspend" : "Activate"}
</button>

        {/* <button
          onClick={() => toggleUserActive(admin.id)}
          className={`px-3 py-1 rounded text-sm ${
            admin.is_active ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          {admin.is_active ? "Suspend" : "Activate"}
        </button> */}

              
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminsTable;
