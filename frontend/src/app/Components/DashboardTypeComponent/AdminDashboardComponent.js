"use client";

import { MetricCard } from "../Admin/UI/Metrics";
// import { RevenueChart } from "../DashboardUIComponents/ReveneueChart";
// import { TrackAnalytics } from "../DashboardUIComponents/TrackAnalytics";

import { Button } from "../DashboardUIComponents/UI/Button";


import {
  DollarSign,
  TrendingUp,
  Users,
  Music,
  ShieldCheck,
  Download,
  AlertTriangle,
} from "lucide-react";

const AdminDashboardUI= () => {
  // Mock platform-wide revenue data
  const revenueData = [
    { date: "Mon", streams: 1200, tips: 320, downloads: 210 },
    { date: "Tue", streams: 1350, tips: 410, downloads: 180 },
    { date: "Wed", streams: 1480, tips: 390, downloads: 260 },
    { date: "Thu", streams: 1300, tips: 520, downloads: 230 },
    { date: "Fri", streams: 1700, tips: 610, downloads: 340 },
    { date: "Sat", streams: 2100, tips: 840, downloads: 520 },
    { date: "Sun", streams: 2400, tips: 910, downloads: 480 },
  ];

  // Top-performing tracks platform-wide
  const tracks = [
    {
      id: "1",
      title: "Ubuntu Spirit – Sibusiso",
      streams: 154200,
      earnings: 1542,
      listenerScore: 91,
      verifiedOrganic: true,
      aiMood: "Uplifting",
      aiGenre: "Afro-soul",
    },
    {
      id: "2",
      title: "Motherland Rhythms – Zola Deep",
      streams: 128900,
      earnings: 1289,
      listenerScore: 94,
      verifiedOrganic: true,
      aiMood: "Energetic",
      aiGenre: "Afrobeat",
    },
    {
      id: "3",
      title: "Sunset Dreams – Luma",
      streams: 84500,
      earnings: 845,
      listenerScore: 76,
      verifiedOrganic: false,
      aiMood: "Mellow",
      aiGenre: "Amapiano",
    },
  ];

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

            {/* <div className="flex items-center gap-3">
              <Button variant="outline">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify Content
              </Button>
              <Button className="bg-gradient-to-r from-gold to-coral hover:opacity-90">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div> */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Platform Revenue"
            value="R1,248,430"
            change="+18.2% this week"
            changeType="positive"
            icon={DollarSign}
            variant="gold"
          />
          <MetricCard
            title="Total Streams"
            value="2.4M"
            change="+210k this week"
            changeType="positive"
            icon={Music}
            variant="emerald"
          />
          <MetricCard
            title="Active Artists"
            value="1,284"
            change="+34 new artists"
            changeType="positive"
            icon={Users}
            variant="default"
          />
          <MetricCard
            title="Flagged Tracks"
            value="12"
            change="Needs review"
            changeType="negative"
            icon={AlertTriangle}
            variant="coral"
          />
        </div>

        {/* Trust Banner */}
        <div className="mb-8 rounded-xl border border-emerald/20 bg-gradient-to-r from-emerald/10 via-gold/10 to-coral/10 p-6">
          <div className="flex gap-4">
            <div className="rounded-lg bg-emerald/20 p-3">
              <ShieldCheck className="h-6 w-6 text-emerald" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Platform Integrity Status: Healthy
              </h3>
              <p className="text-sm text-muted-foreground">
                98.7% of streams verified as organic. AI moderation and
                community reporting systems operating normally.
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        {/* <div className="mb-8">
          <RevenueChart data={revenueData} />
        </div> */}

        {/* Platform Track Analytics */}
        {/* <TrackAnalytics tracks={tracks} /> */}

        {/* Payout Oversight */}
        {/* <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              Recent Artist Payouts
            </h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { artist: "Sibusiso", amount: 2450.8, status: "Completed" },
              { artist: "Zola Deep", amount: 1890.5, status: "Completed" },
              { artist: "Luma", amount: 312.2, status: "Pending Review" },
            ].map((payout, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-4 transition hover:bg-muted"
              >
                <div>
                  <p className="font-medium">
                    R{payout.amount.toFixed(2)} – {payout.artist}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Artist payout
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payout.status === "Completed"
                      ? "bg-emerald/10 text-emerald"
                      : "bg-coral/10 text-coral"
                  }`}
                >
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default AdminDashboard;
