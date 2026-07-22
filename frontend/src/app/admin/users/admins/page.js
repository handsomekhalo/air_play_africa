'use client';

import { useEffect, useState } from "react";
import { getAllAdmins, toggleUserActive } from "../../../../utils/admin_artists";
import { useAuth } from "../../../../../AuthContext";
import backendApi from "@/utils/backendApi";
import { getCsrfToken } from "@/utils/csrf";
import Sidebar from "@/app/Components/System_Management_Components/dashboard/SideBarComponent/sidebar";
import { Shield, CheckCircle, XCircle, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
// import { useAuthGuard } from '../../../../../utils/useAuthGuard';
import { useAuthGuard } from '@/utils/useAuthGuard';

const ITEMS_PER_PAGE = 15;

// ─── Create Admin Modal ──────────────────────────────────────────
function CreateAdminModal({ onClose, onCreated, authToken }) {
  useAuthGuard('/login', 'Admin');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError('All fields are required.'); return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.'); return;
    }
    setSubmitting(true);
    try {
      const csrfToken = await getCsrfToken();
      const res = await backendApi.post(
        '/system_management/create_admin/',
        form,
        { headers: { Authorization: `Token ${authToken}`, 'X-CSRFToken': csrfToken } }
      );
      if (res.data.status === 'success' || res.data.id) {
        onCreated();
        onClose();
      } else {
        setError(res.data.message || res.data.details || 'Creation failed.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.details || 'Creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        fontFamily: 'inherit',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create Admin</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={20} />
          </button>
        </div>

        {[
          { label: 'First Name',       name: 'first_name',       type: 'text'     },
          { label: 'Last Name',        name: 'last_name',        type: 'text'     },
          { label: 'Email',            name: 'email',            type: 'email'    },
          { label: 'Password',         name: 'password',         type: 'password' },
          { label: 'Confirm Password', name: 'confirm_password', type: 'password' },
        ].map(field => (
          <div key={field.name} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600,
              color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {field.label}
            </label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 8,
                border: '1px solid #e5e7eb', fontSize: 14, color: '#111',
                background: '#f9fafb', fontFamily: 'inherit',
              }}
            />
          </div>
        ))}

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 14,
            background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={submitting} style={{
            flex: 1, padding: '11px 0', borderRadius: 8,
            border: '1px solid #e5e7eb', background: 'transparent',
            color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 1, padding: '11px 0', borderRadius: 8, border: 'none',
            background: '#111', color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
          }}>
            {submitting ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Row ───────────────────────────────────────────────────
function AdminRow({ admin, onToggle, toggling }) {
  const [expanded, setExpanded] = useState(false);
  const isProcessing = toggling === admin.id;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff', transition: 'background 0.15s',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: admin.is_active
            ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
            : 'linear-gradient(135deg, #9ca3af, #6b7280)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: '#fff',
        }}>
          {(admin.first_name?.[0] || '?').toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#111' }}>
            {admin.first_name} {admin.last_name}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{admin.email}</p>
        </div>

        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
          background: admin.is_active ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${admin.is_active ? '#a7f3d0' : '#fecaca'}`,
          color: admin.is_active ? '#10b981' : '#ef4444',
        }}>
          {admin.is_active ? 'Active' : 'Suspended'}
        </span>

        {expanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </div>

      {expanded && (
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Joined',     value: new Date(admin.date_joined).toLocaleDateString() },
              { label: 'Last Login', value: admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never' },
              { label: 'User Type',  value: admin.user_type__name || 'Admin' },
            ].map(field => (
              <div key={field.label}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600,
                  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#111' }}>{field.value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onToggle(admin.id); }}
            disabled={isProcessing}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: admin.is_active ? '#ef4444' : '#10b981',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            {admin.is_active
              ? <><XCircle size={14} /> Suspend Admin</>
              : <><CheckCircle size={14} /> Activate Admin</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function AdminAdminsPage() {
  const { authToken } = useAuth();

  const [admins, setAdmins]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [toggling, setToggling]     = useState(null);
  const [feedback, setFeedback]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage]             = useState(1);

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

  useEffect(() => { fetchAdmins(); }, []);

  const handleToggle = async (userId) => {
    setToggling(userId);
    try {
      const res = await toggleUserActive(userId);
      setAdmins(prev => prev.map(a => a.id === userId ? { ...a, is_active: res.is_active } : a));
      setFeedback({ type: 'success', message: `Admin ${res.is_active ? 'activated' : 'suspended'}.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update admin status.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setToggling(null);
    }
  };

  // Filter + search
  const filtered = admins.filter(a => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      (a.first_name || '').toLowerCase().includes(term) ||
      (a.last_name  || '').toLowerCase().includes(term) ||
      (a.email      || '').toLowerCase().includes(term);
    const matchesFilter =
      filter === 'all'       ? true :
      filter === 'active'    ? a.is_active :
      filter === 'suspended' ? !a.is_active : true;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = {
    all:       admins.length,
    active:    admins.filter(a => a.is_active).length,
    suspended: admins.filter(a => !a.is_active).length,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1">
        <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6" /> Admin Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  {counts.all} admins · {counts.active} active
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', borderRadius: 8, border: 'none',
                  background: '#111', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Plus size={16} /> New Admin
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {Object.entries(counts).map(([tab, count]) => (
              <button key={tab} onClick={() => { setFilter(tab); setPage(1); }} style={{
                padding: '6px 16px', borderRadius: 20, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: filter === tab ? '#111' : '#f3f4f6',
                color: filter === tab ? '#fff' : '#6b7280',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>
                {tab} ({count})
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '11px 16px', borderRadius: 10,
              border: '1px solid #e5e7eb', fontSize: 14,
              marginBottom: 20, fontFamily: 'inherit',
              background: '#fff', color: '#111',
            }}
          />

          {/* Feedback */}
          {feedback && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: 13, fontWeight: 500,
            }}>
              {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.message}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Loading admins…</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>No admins found.</div>
          ) : (
            paginated.map(admin => (
              <AdminRow key={admin.id} admin={admin} onToggle={handleToggle} toggling={toggling} />
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#fff',
                  fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >← Prev</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: page === n ? '#111' : '#f3f4f6',
                  color: page === n ? '#fff' : '#6b7280',
                  fontSize: 13, cursor: 'pointer', fontWeight: page === n ? 700 : 400,
                }}>{n}</button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#fff',
                  fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >Next →</button>
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateAdminModal
          authToken={authToken}
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchAdmins(); setFeedback({ type: 'success', message: 'Admin created successfully.' }); setTimeout(() => setFeedback(null), 3000); }}
        />
      )}
    </div>
  );
}

//   'use client';


//   import { useEffect, useState } from "react";
//   import { getAllAdmins , toggleUserActive } from "../../../../utils/admin_artists";

// const AdminsTable = () => {
//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(true);

// // const [admins, setAdmins] = useState([]);

// const handleToggleAdmin = async (adminId) => {
//   try {
//     const res = await toggleUserActive(adminId);

//     setAdmins(prev =>
//       prev.map(a =>
//         a.id === adminId
//           ? { ...a, is_active: res.is_active }
//           : a
//       )
//     );
//   } catch (err) {
//     console.error("Failed to toggle admin", err);
//   }
// };





//   useEffect(() => {
//     const fetchAdmins = async () => {
//       try {
//         const data = await getAllAdmins();
//         setAdmins(data.admins || []);
//       } catch (err) {
//         console.error("Failed to load admins", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAdmins();
//   }, []);

//   if (loading) return <p>Loading admins…</p>;

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
//         {admins.map((admin) => (
//           <tr key={admin.id} className="border-b">
//             <td>{admin.first_name}</td>
//             <td>{admin.email}</td>
//             <td>{admin.is_active ? "Active" : "Suspended"}</td>
//             <td className="flex gap-2">
//               {/* actions go here */}
//               <button
//   onClick={() => handleToggleAdmin(admin.id)}
//   className={`px-3 py-1 rounded text-sm ${
//     admin.is_active ? "bg-red-500 text-white" : "bg-green-500 text-white"
//   }`}
// >
//   {admin.is_active ? "Suspend" : "Activate"}
// </button>

//         {/* <button
//           onClick={() => toggleUserActive(admin.id)}
//           className={`px-3 py-1 rounded text-sm ${
//             admin.is_active ? "bg-red-500 text-white" : "bg-green-500 text-white"
//           }`}
//         >
//           {admin.is_active ? "Suspend" : "Activate"}
//         </button> */}

              
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default AdminsTable;
