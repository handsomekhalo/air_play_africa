"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "../Admin/UI/Metrics";
import { Button } from "../DashboardUIComponents/UI/Button";
import backendApi from "@/utils/backendApi";
import { useAuth } from "../../../../AuthContext";
import {
  DollarSign, TrendingUp, Users, Music,
  ShieldCheck, AlertTriangle, CheckCircle,
  XCircle, Clock, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Withdrawal Row ──────────────────────────────────────────────
function WithdrawalRow({ withdrawal, onAction }) {
  const [expanded, setExpanded]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes]         = useState('');

  const statusConfig = {
    pending:  { color: '#f59e0b', bg: '#fefce8', border: '#fde68a', label: 'Pending' },
    approved: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Approved' },
    rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Rejected' },
    paid:     { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', label: 'Paid'     },
  };
  const s = statusConfig[withdrawal.status] || statusConfig.pending;

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      await onAction(withdrawal.id, action, notes);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10,
      marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: '#111' }}>
              R{parseFloat(withdrawal.amount).toFixed(2)}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              {withdrawal.artist_name}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 10px',
            borderRadius: 20, background: s.bg,
            border: `1px solid ${s.border}`, color: s.color,
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
        <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          {/* Banking details */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16,
          }}>
            {[
              { label: 'Bank',           value: withdrawal.bank_name },
              { label: 'Account Number', value: withdrawal.account_number },
              { label: 'Account Name',   value: withdrawal.account_name },
              { label: 'Requested',      value: new Date(withdrawal.requested_at).toLocaleString() },
              withdrawal.processed_at && {
                label: 'Processed',
                value: new Date(withdrawal.processed_at).toLocaleString()
              },
            ].filter(Boolean).map(field => (
              <div key={field.label}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: '#111' }}>{field.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Admin notes */}
          {withdrawal.admin_notes && (
            <div style={{
              padding: '10px 12px', background: '#f3f4f6',
              borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#374151',
            }}>
              <strong>Admin note:</strong> {withdrawal.admin_notes}
            </div>
          )}

          {/* Action area — only show relevant actions per status */}
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
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processing}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                    background: '#3b82f6', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: processing ? 0.7 : 1,
                  }}
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processing}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                    background: '#ef4444', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: processing ? 0.7 : 1,
                  }}
                >
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
              <button
                onClick={() => handleAction('mark_paid')}
                disabled={processing}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: '#10b981', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: processing ? 0.7 : 1, alignSelf: 'flex-start',
                }}
              >
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

// ─── Main Admin Dashboard ────────────────────────────────────────
const AdminDashboardUI = () => {
  const { authToken } = useAuth();

  const [withdrawals, setWithdrawals]       = useState([]);
  const [wLoading, setWLoading]             = useState(true);
  const [activeFilter, setActiveFilter]     = useState('pending');
  const [actionFeedback, setActionFeedback] = useState(null);

  // ── Fetch withdrawals ─────────────────────────────────────────
  const fetchWithdrawals = async (statusFilter = activeFilter) => {
    setWLoading(true);
    try {
      const res = await backendApi.get(
        `/media_streaming_management/admin_list_withdrawals/?status=${statusFilter}`,
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') {
        setWithdrawals(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setWLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) return;
    fetchWithdrawals(activeFilter);
  }, [authToken, activeFilter]);

  // ── Process action ────────────────────────────────────────────
  const handleAction = async (withdrawalId, action, notes) => {
    try {
      const res = await backendApi.patch(
        `/media_streaming_management/admin_process_withdrawal/${withdrawalId}/`,
        { action, admin_notes: notes },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') {
        setActionFeedback({ type: 'success', message: res.data.message });
        fetchWithdrawals(activeFilter);  // refresh list
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Action failed.'
      });
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const filterTabs = ['pending', 'approved', 'paid', 'rejected'];

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Platform oversight. Trust. Transparency.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Platform Metrics — still mock for now */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Platform Revenue"  value="R1,248,430"  change="+18.2% this week"  changeType="positive" icon={DollarSign}    variant="gold"    />
          <MetricCard title="Total Streams"     value="2.4M"        change="+210k this week"   changeType="positive" icon={Music}         variant="emerald" />
          <MetricCard title="Active Artists"    value="1,284"       change="+34 new artists"   changeType="positive" icon={Users}         variant="default" />
          <MetricCard title="Flagged Tracks"    value="12"          change="Needs review"      changeType="negative" icon={AlertTriangle} variant="coral"   />
        </div>

        {/* Trust Banner */}
        <div className="mb-8 rounded-xl border border-emerald/20 bg-gradient-to-r from-emerald/10 via-gold/10 to-coral/10 p-6">
          <div className="flex gap-4">
            <div className="rounded-lg bg-emerald/20 p-3">
              <ShieldCheck className="h-6 w-6 text-emerald" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Platform Integrity Status: Healthy</h3>
              <p className="text-sm text-muted-foreground">
                98.7% of streams verified as organic. AI moderation operating normally.
              </p>
            </div>
          </div>
        </div>

        {/* ── Withdrawal Management ── */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              Withdrawal Requests
              {activeFilter === 'pending' && pendingCount > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 20, marginLeft: 4,
                }}>
                  {pendingCount}
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
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Feedback toast */}
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
              <WithdrawalRow
                key={w.id}
                withdrawal={w}
                onAction={handleAction}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardUI;

// "use client";

// import { MetricCard } from "../Admin/UI/Metrics";
// // import { RevenueChart } from "../DashboardUIComponents/ReveneueChart";
// // import { TrackAnalytics } from "../DashboardUIComponents/TrackAnalytics";

// import { Button } from "../DashboardUIComponents/UI/Button";


// import {
//   DollarSign,
//   TrendingUp,
//   Users,
//   Music,
//   ShieldCheck,
//   Download,
//   AlertTriangle,
// } from "lucide-react";

// const AdminDashboardUI= () => {
//   // Mock platform-wide revenue data
//   const revenueData = [
//     { date: "Mon", streams: 1200, tips: 320, downloads: 210 },
//     { date: "Tue", streams: 1350, tips: 410, downloads: 180 },
//     { date: "Wed", streams: 1480, tips: 390, downloads: 260 },
//     { date: "Thu", streams: 1300, tips: 520, downloads: 230 },
//     { date: "Fri", streams: 1700, tips: 610, downloads: 340 },
//     { date: "Sat", streams: 2100, tips: 840, downloads: 520 },
//     { date: "Sun", streams: 2400, tips: 910, downloads: 480 },
//   ];

//   // Top-performing tracks platform-wide
//   const tracks = [
//     {
//       id: "1",
//       title: "Ubuntu Spirit – Sibusiso",
//       streams: 154200,
//       earnings: 1542,
//       listenerScore: 91,
//       verifiedOrganic: true,
//       aiMood: "Uplifting",
//       aiGenre: "Afro-soul",
//     },
//     {
//       id: "2",
//       title: "Motherland Rhythms – Zola Deep",
//       streams: 128900,
//       earnings: 1289,
//       listenerScore: 94,
//       verifiedOrganic: true,
//       aiMood: "Energetic",
//       aiGenre: "Afrobeat",
//     },
//     {
//       id: "3",
//       title: "Sunset Dreams – Luma",
//       streams: 84500,
//       earnings: 845,
//       listenerScore: 76,
//       verifiedOrganic: false,
//       aiMood: "Mellow",
//       aiGenre: "Amapiano",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
//         <div className="container mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//               <p className="text-sm text-muted-foreground">
//                 Platform oversight. Trust. Transparency.
//               </p>
//             </div>

//             {/* <div className="flex items-center gap-3">
//               <Button variant="outline">
//                 <ShieldCheck className="h-4 w-4 mr-2" />
//                 Verify Content
//               </Button>
//               <Button className="bg-gradient-to-r from-gold to-coral hover:opacity-90">
//                 <Download className="h-4 w-4 mr-2" />
//                 Export Reports
//               </Button>
//             </div> */}
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-6 py-8">
//         {/* Platform Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <MetricCard
//             title="Platform Revenue"
//             value="R1,248,430"
//             change="+18.2% this week"
//             changeType="positive"
//             icon={DollarSign}
//             variant="gold"
//           />
//           <MetricCard
//             title="Total Streams"
//             value="2.4M"
//             change="+210k this week"
//             changeType="positive"
//             icon={Music}
//             variant="emerald"
//           />
//           <MetricCard
//             title="Active Artists"
//             value="1,284"
//             change="+34 new artists"
//             changeType="positive"
//             icon={Users}
//             variant="default"
//           />
//           <MetricCard
//             title="Flagged Tracks"
//             value="12"
//             change="Needs review"
//             changeType="negative"
//             icon={AlertTriangle}
//             variant="coral"
//           />
//         </div>

//         {/* Trust Banner */}
//         <div className="mb-8 rounded-xl border border-emerald/20 bg-gradient-to-r from-emerald/10 via-gold/10 to-coral/10 p-6">
//           <div className="flex gap-4">
//             <div className="rounded-lg bg-emerald/20 p-3">
//               <ShieldCheck className="h-6 w-6 text-emerald" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold mb-2">
//                 Platform Integrity Status: Healthy
//               </h3>
//               <p className="text-sm text-muted-foreground">
//                 98.7% of streams verified as organic. AI moderation and
//                 community reporting systems operating normally.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Revenue Chart */}
//         {/* <div className="mb-8">
//           <RevenueChart data={revenueData} />
//         </div> */}

//         {/* Platform Track Analytics */}
//         {/* <TrackAnalytics tracks={tracks} /> */}

//         {/* Payout Oversight */}
//         {/* <div className="mt-8 bg-card border border-border rounded-xl p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h3 className="text-xl font-semibold flex items-center gap-2">
//               <DollarSign className="h-5 w-5 text-gold" />
//               Recent Artist Payouts
//             </h3>
//             <Button variant="outline" size="sm">
//               View All
//             </Button>
//           </div>

//           <div className="space-y-3">
//             {[
//               { artist: "Sibusiso", amount: 2450.8, status: "Completed" },
//               { artist: "Zola Deep", amount: 1890.5, status: "Completed" },
//               { artist: "Luma", amount: 312.2, status: "Pending Review" },
//             ].map((payout, i) => (
//               <div
//                 key={i}
//                 className="flex items-center justify-between rounded-lg bg-muted/50 p-4 transition hover:bg-muted"
//               >
//                 <div>
//                   <p className="font-medium">
//                     R{payout.amount.toFixed(2)} – {payout.artist}
//                   </p>
//                   <p className="text-sm text-muted-foreground">
//                     Artist payout
//                   </p>
//                 </div>
//                 <span
//                   className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     payout.status === "Completed"
//                       ? "bg-emerald/10 text-emerald"
//                       : "bg-coral/10 text-coral"
//                   }`}
//                 >
//                   {payout.status}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div> */}
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;
