"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "../../Components/Admin/UI/Metrics";
import { getAdminOverview } from "../../../utils/admin_overview";
import Sidebar from "@/app/Components/System_Management_Components/dashboard/SideBarComponent/sidebar";
import backendApi from "@/utils/backendApi";
import { useAuth } from "../../../../AuthContext";
import {
  Users, Music, ShieldCheck, AlertTriangle,
  DollarSign, CheckCircle, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Withdrawal Row ──────────────────────────────────────────────
function WithdrawalRow({ withdrawal, onAction }) {
  const [expanded, setExpanded]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes]           = useState('');

  const statusConfig = {
    pending:  { color: '#f59e0b', bg: '#fefce8', border: '#fde68a', label: 'Pending'  },
    approved: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Approved' },
    rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Rejected' },
    paid:     { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', label: 'Paid'     },
  };
  const s = statusConfig[withdrawal.status] || statusConfig.pending;

  const handleAction = async (action) => {
    setProcessing(true);
    try { await onAction(withdrawal.id, action, notes); }
    finally { setProcessing(false); }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff', transition: 'background 0.15s',
        }}
      >
        <div>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: '#111' }}>
            R{parseFloat(withdrawal.amount).toFixed(2)}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{withdrawal.artist_name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: s.bg, border: `1px solid ${s.border}`, color: s.color,
          }}>
            {s.label}
          </span>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>
            {new Date(withdrawal.requested_at).toLocaleDateString()}
          </span>
          {expanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Bank',           value: withdrawal.bank_name },
              { label: 'Account Number', value: withdrawal.account_number },
              { label: 'Account Name',   value: withdrawal.account_name },
              { label: 'Requested',      value: new Date(withdrawal.requested_at).toLocaleString() },
              withdrawal.processed_at && { label: 'Processed', value: new Date(withdrawal.processed_at).toLocaleString() },
            ].filter(Boolean).map(field => (
              <div key={field.label}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: '#111' }}>{field.value || '—'}</p>
              </div>
            ))}
          </div>

          {withdrawal.admin_notes && (
            <div style={{ padding: '10px 12px', background: '#f3f4f6', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#374151' }}>
              <strong>Admin note:</strong> {withdrawal.admin_notes}
            </div>
          )}

          {withdrawal.status === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                placeholder="Optional admin notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #e5e7eb', fontSize: 13,
                  fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleAction('approve')} disabled={processing} style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: processing ? 0.7 : 1,
                }}>
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleAction('reject')} disabled={processing} style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: processing ? 0.7 : 1,
                }}>
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          )}

          {withdrawal.status === 'approved' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Mark as paid once you've processed the bank transfer manually.
              </p>
              <button onClick={() => handleAction('mark_paid')} disabled={processing} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                opacity: processing ? 0.7 : 1, alignSelf: 'flex-start',
              }}>
                <CheckCircle size={14} /> Mark as Paid
              </button>
            </div>
          )}

          {(withdrawal.status === 'paid' || withdrawal.status === 'rejected') && (
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
              This withdrawal has been {withdrawal.status}. No further actions available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function Admin_Dashboard() {
  const { authToken }  = useAuth();
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wLoading, setWLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [actionFeedback, setActionFeedback] = useState(null);

  // ── Platform overview ─────────────────────────────────────────
  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await getAdminOverview();
        setData(data);
      } catch (err) {
        console.error("Failed to load admin overview", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  // ── Withdrawals ───────────────────────────────────────────────
  const fetchWithdrawals = async (statusFilter) => {
    if (!authToken) return;
    setWLoading(true);
    try {
      const res = await backendApi.get(
        `/media_streaming_management/admin_list_withdrawals/?status=${statusFilter}`,
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') setWithdrawals(res.data.data);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setWLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(activeFilter);
  }, [authToken, activeFilter]);

  const handleAction = async (withdrawalId, action, notes) => {
    try {
      const res = await backendApi.patch(
        `/media_streaming_management/admin_process_withdrawal/${withdrawalId}/`,
        { action, admin_notes: notes },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') {
        setActionFeedback({ type: 'success', message: res.data.message });
        fetchWithdrawals(activeFilter);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.response?.data?.message || 'Action failed.' });
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  if (loading) return <div className="p-8">Loading platform status…</div>;
  if (!data)   return <div className="p-8">Unable to load system data.</div>;

  const filterTabs = ['pending', 'approved', 'paid', 'rejected'];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform health & integrity</p>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Total Artists"    value={data.totalArtists}      icon={Users}         />
            <MetricCard title="Active Artists"   value={data.activeArtists}     icon={Users}         />
            <MetricCard title="Streams (7 days)" value={data.streamsLast7Days}  icon={Music}         />
            <MetricCard title="Flagged Tracks"   value={data.flaggedTracks}     icon={AlertTriangle} />
          </div>

          {/* Integrity Banner */}
          <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-6 flex gap-4 mb-8">
            <div className="rounded-lg bg-emerald/20 p-3">
              <ShieldCheck className="h-6 w-6 text-emerald" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Platform Integrity: {data.integrityStatus}</h3>
              <p className="text-sm text-muted-foreground">{data.integrityMessage}</p>
            </div>
          </div>

          {/* ── Withdrawal Management ── */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold" />
                Withdrawal Requests
                {activeFilter === 'pending' && withdrawals.length > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 20, marginLeft: 4,
                  }}>
                    {withdrawals.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => fetchWithdrawals(activeFilter)}
                style={{
                  background: 'none', border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 12px',
                  fontSize: 13, color: '#6b7280', cursor: 'pointer',
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: activeFilter === tab ? '#111' : '#f3f4f6',
                    color: activeFilter === tab ? '#fff' : '#6b7280',
                    textTransform: 'capitalize', transition: 'all 0.15s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {actionFeedback && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: actionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: actionFeedback.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: 13, fontWeight: 500,
              }}>
                {actionFeedback.type === 'success' ? '✅' : '⚠️'} {actionFeedback.message}
              </div>
            )}

            {/* List */}
            {wLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                Loading withdrawals…
              </div>
            ) : withdrawals.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                No {activeFilter} withdrawal requests.
              </div>
            ) : (
              withdrawals.map(w => (
                <WithdrawalRow key={w.id} withdrawal={w} onAction={handleAction} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}




// "use client";

// import { useEffect, useState } from "react";
// import { MetricCard } from "../../Components/Admin/UI/Metrics";
// import {getAdminOverview} from "../../../utils/admin_overview";
// import Sidebar from "@/app/Components/System_Management_Components/dashboard/SideBarComponent/sidebar";

// import {
//   Users,
//   Music,
//   ShieldCheck,
//   AlertTriangle,
// } from "lucide-react";

// export default function Admin_Dashboard() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

// useEffect(() => {
//   const loadOverview = async () => {
//     try {
//       const data = await getAdminOverview();
//       setData(data);
//     } catch (err) {
//       console.error("Failed to load admin overview", err);
//       setData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   loadOverview();
// }, []);

  
 
//   if (loading) {
//     return <div className="p-8">Loading platform status…</div>;
//   }

//   if (!data) {
//     return <div className="p-8">Unable to load system data.</div>;
//   }

//   return (
//     // <div className="min-h-screen bg-background">
//     <div className="min-h-screen flex bg-background">
//       <Sidebar />

//         <div className="flex-1">
//            {/* Header */}
//       <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
//         <div className="container mx-auto px-6 py-4">
//           <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//           <p className="text-sm text-muted-foreground">
//             Platforms health & integrity
//           </p>
//         </div>
//       </header>

//       <main className="container mx-auto px-6 py-8">
//         {/* Platform Health Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <MetricCard
//             title="Total Artists"
//             value={data.totalArtists}
//             icon={Users}
//           />
//           <MetricCard
//             title="Active Artists"
//             value={data.activeArtists}
//             icon={Users}
//           />
//           <MetricCard
//             title="Streams (7 days)"
//             value={data.streamsLast7Days}
//             icon={Music}
//           />
//           <MetricCard
//             title="Flagged Tracks"
//             value={data.flaggedTracks}
//             icon={AlertTriangle}
//           />
//         </div>

//         {/* Integrity Banner */}
//         <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-6 flex gap-4">
//           <div className="rounded-lg bg-emerald/20 p-3">
//             <ShieldCheck className="h-6 w-6 text-emerald" />
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold">
//               Platform Integrity: {data.integrityStatus}
//             </h3>
//             <p className="text-sm text-muted-foreground">
//               {data.integrityMessage}
//             </p>
//           </div>
//         </div>
        
//       </main>
//     </div>
//     {/* header + main content */}
//   </div>


     
//   );
// }
