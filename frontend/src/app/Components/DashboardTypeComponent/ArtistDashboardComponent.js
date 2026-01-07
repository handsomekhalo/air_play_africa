"use client";

import { useState } from "react";

import { MetricCard } from "../DashboardUIComponents/Metrics";
import { RevenueChart } from "../DashboardUIComponents/ReveneueChart";
import { TrackAnalytics } from "../DashboardUIComponents/TrackAnalytics";
import { Button } from "../DashboardUIComponents/UI/Button";
import UploadFileComponent from "../DashboardComponents/UploadFileComponent";
import UploadPage from "../DashboardComponents/uploadFile";

import {
  DollarSign,
  TrendingUp,
  Users,
  Music,
  Download,
  Upload,
  Wallet,
} from "lucide-react";

export default function ArtistDashboardPage() {
  const [showUpload, setShowUpload] = useState(false);

  // Mock data (replace later with API calls)
  const revenueData = [
    { date: "Mon", streams: 45, tips: 12, downloads: 8 },
    { date: "Tue", streams: 52, tips: 18, downloads: 5 },
    { date: "Wed", streams: 61, tips: 15, downloads: 12 },
    { date: "Thu", streams: 48, tips: 22, downloads: 9 },
    { date: "Fri", streams: 70, tips: 28, downloads: 15 },
    { date: "Sat", streams: 85, tips: 35, downloads: 20 },
    { date: "Sun", streams: 92, tips: 40, downloads: 18 },
  ];

  const tracks = [
    {
      id: "1",
      title: "Ubuntu Spirit",
      streams: 15420,
      earnings: 154.2,
      listenerScore: 87,
      verifiedOrganic: true,
      aiMood: "Uplifting",
      aiGenre: "Afro-soul",
    },
    {
      id: "2",
      title: "Motherland Rhythms",
      streams: 8932,
      earnings: 89.32,
      listenerScore: 92,
      verifiedOrganic: true,
      aiMood: "Energetic",
      aiGenre: "Afrobeat",
    },
    {
      id: "3",
      title: "Sunset Dreams",
      streams: 6124,
      earnings: 61.24,
      listenerScore: 78,
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
              <h1 className="text-2xl font-bold">Artist Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Transparent earnings. Fair discovery. Own your masters.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Track
              </Button>

              <Button className="bg-gradient-to-r from-gold to-coral hover:opacity-90">
                <Wallet className="h-4 w-4 mr-2" />
                Withdraw Funds
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload New Track</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <UploadPage onSuccess={() => setShowUpload(false)} />
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Earnings"
            value="R304.76"
            change="+12.5% from last week"
            changeType="positive"
            icon={DollarSign}
            variant="gold"
          />
          <MetricCard
            title="Stream Revenue"
            value="R154.20"
            change="From 15,420 streams"
            changeType="neutral"
            icon={Music}
            variant="emerald"
          />
          <MetricCard
            title="Tips Received"
            value="R110.56"
            change="+28 new tips"
            changeType="positive"
            icon={TrendingUp}
            variant="coral"
          />
          <MetricCard
            title="Total Listeners"
            value="8,432"
            change="+420 this week"
            changeType="positive"
            icon={Users}
            variant="default"
          />
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <RevenueChart data={revenueData} />
        </div>

        {/* Track Analytics */}
        <TrackAnalytics tracks={tracks} />

        {/* Payout History */}
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <Download className="h-5 w-5 text-gold" />
              Payout History
            </h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { date: "2024-01-15", amount: 245.8 },
              { date: "2024-01-08", amount: 189.5 },
              { date: "2024-01-01", amount: 312.2 },
            ].map((payout, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-4 hover:bg-muted"
              >
                <div>
                  <p className="font-medium">R{payout.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {payout.date}
                  </p>
                </div>
                <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}