"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "../../Components/DashboardUIComponents/Metrics";
import {getAdminOverview} from "../../../utils/admin_overview";

import {
  Users,
  Music,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function Admin_Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  
  // useEffect(() => {
  //   fetch("/api/admin/overview")
  //     .then((res) => res.json())
  //     .then(setData)
  //     .catch(() => setData(null))
  //     .finally(() => setLoading(false));
  // }, []);

  if (loading) {
    return <div className="p-8">Loading platform status…</div>;
  }

  if (!data) {
    return <div className="p-8">Unable to load system data.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platforms health & integrity
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Platform Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Artists"
            value={data.totalArtists}
            icon={Users}
          />
          <MetricCard
            title="Active Artists"
            value={data.activeArtists}
            icon={Users}
          />
          <MetricCard
            title="Streams (7 days)"
            value={data.streamsLast7Days}
            icon={Music}
          />
          <MetricCard
            title="Flagged Tracks"
            value={data.flaggedTracks}
            icon={AlertTriangle}
          />
        </div>

        {/* Integrity Banner */}
        <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-6 flex gap-4">
          <div className="rounded-lg bg-emerald/20 p-3">
            <ShieldCheck className="h-6 w-6 text-emerald" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Platform Integrity: {data.integrityStatus}
            </h3>
            <p className="text-sm text-muted-foreground">
              {data.integrityMessage}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}




// import { ShieldCheck, Users, Music, Activity } from "lucide-react";
// import MetricCard from "@/components/ui/MetricCard";

// export default function AdminDashboardPage() {
//   return (
//     <div className="p-8 space-y-8">
//       {/* Header */}
//       <header>
//         <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//         <p className="text-sm text-muted-foreground">
//           Platform health overview
//         </p>
//       </header>

//       {/* Core Metrics */}
//       <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <MetricCard title="Total Artists" value="1,284" icon={Users} />
//         <MetricCard title="Active Artists" value="1,103" icon={Activity} />
//         <MetricCard title="Tracks Uploaded" value="18,492" icon={Music} />
//         <MetricCard title="Streams (7d)" value="2.4M" icon={Music} />
//       </section>

//       {/* System Health */}
//       <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <SystemStatusCard label="New Signups (24h)" value="34" />
//         <SystemStatusCard label="Pending Onboarding" value="7" />
//         <SystemStatusCard label="Failed Uploads" value="0" />
//       </section>

//       {/* Integrity Banner */}
//       <section className="rounded-xl border border-emerald/20 bg-emerald/10 p-6 flex gap-4">
//         <div className="p-3 bg-emerald/20 rounded-lg">
//           <ShieldCheck className="h-6 w-6 text-emerald" />
//         </div>
//         <div>
//           <h3 className="font-semibold">
//             Platform Integrity: Healthy
//           </h3>
//           <p className="text-sm text-muted-foreground">
//             98.7% of streams verified as organic. No system alerts detected.
//           </p>
//         </div>
//       </section>
//     </div>
//   );
// }

// function SystemStatusCard({ label, value }) {
//   return (
//     <div className="rounded-lg border border-border bg-card p-4">
//       <p className="text-sm text-muted-foreground">{label}</p>
//       <p className="text-xl font-semibold">{value}</p>
//     </div>
//   );
// }