"use client";

import {useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 

import { MetricCard } from "../Admin/UI/Metrics";
// import { RevenueChart } from "../Admin/UI/RevenueChart";
import { RevenueChart } from "../Admin/UI/RevenueChart";
import { TrackAnalytics } from "../Admin/UI/TrackAnalytics";
import { Button } from "../DashboardUIComponents/UI/Button";
import UploadFileComponent from "../Artists/UploadTrack/UploadFileComponent";
// import UploadPage from "../Artists/uploadFile";
import UploadPage from "../Artists/UploadTrack/uploadFile";
import ProfileModal from "../../Profile/profile_modall";
import {
  DollarSign,
  TrendingUp,
  Users,
  Music,
  Download,
  Upload,
  Wallet,
} from "lucide-react";
import { getArtistProfile  } from "../../../utils/artist";
import { getAllArtistEarnings, getMyTracks } from "../../../utils/artist"; 
import {trackAnalyticsData} from "../Admin/UI/TrackAnalytics"
import backendApi from "../../../utils/backendApi";
import WithdrawalModal from '../Artists/WithdrawalModal';



export default function ArtistDashboardPage() {
  const [showUpload, setShowUpload] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [profile, setProfile] = useState(null);
    

    const router = useRouter();

  const [earnings, setEarnings] = useState(null);   // { balance_credits, total_earned, total_withdrawn }
  const [tracks, setTracks]     = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);



  

// ── Load revenue timeseries ─────────────────────────────────────
useEffect(() => {
  const fetchRevenue = async () => {
    try {
      // const csrfToken = await getCsrfToken();
      const res = await backendApi.get(
        '/media_streaming_management/get_artist_revenue_timeseries/',
        // { headers: { "X-CSRFToken": csrfToken } }
      );
      if (res.data.status === 'success') {
        setRevenueData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load revenue timeseries:', err);
    } finally {
      setRevenueLoading(false);
    }
  };
  fetchRevenue();
}, []);

  // Mock data (replace later with API calls)
  // const revenueData = [
  //   { date: "Mon", streams: 45, tips: 12, downloads: 8 },
  //   { date: "Tue", streams: 52, tips: 18, downloads: 5 },
  //   { date: "Wed", streams: 61, tips: 15, downloads: 12 },
  //   { date: "Thu", streams: 48, tips: 22, downloads: 9 },
  //   { date: "Fri", streams: 70, tips: 28, downloads: 15 },
  //   { date: "Sat", streams: 85, tips: 35, downloads: 20 },
  //   { date: "Sun", streams: 92, tips: 40, downloads: 18 },
  // ];

  // const tracks = [
  //   {
  //     id: "1",
  //     title: "Ubuntu Spirit",
  //     streams: 15420,
  //     earnings: 154.2,
  //     listenerScore: 87,
  //     verifiedOrganic: true,
  //     aiMood: "Uplifting",
  //     aiGenre: "Afro-soul",
  //   },
  //   {
  //     id: "2",
  //     title: "Motherland Rhythms",
  //     streams: 8932,
  //     earnings: 89.32,
  //     listenerScore: 92,
  //     verifiedOrganic: true,
  //     aiMood: "Energetic",
  //     aiGenre: "Afrobeat",
  //   },
  //   {
  //     id: "3",
  //     title: "Sunset Dreams",
  //     streams: 6124,
  //     earnings: 61.24,
  //     listenerScore: 78,
  //     verifiedOrganic: false,
  //     aiMood: "Mellow",
  //     aiGenre: "Amapiano",
  //   },
  // ];

  // Add to ArtistDashboardComponent.js — replace mock data loading with:

  useEffect(() => {
  getArtistProfile()
    .then((res) => {
      // API wraps in { status, data: {...} }
      const profile = res.data;

      if (!profile?.id) {
        router.push('/artist-onboarding?step=1');
        return;
      }

      if (!profile?.is_onboarded) {
        router.push(`/artist-onboarding?step=${profile.onboarding_step || 1}`);
        return;
      }

      // Artist is fully onboarded — set profile
      setProfile(profile);
    })
    .catch((err) => {
      console.error('Failed to load artist profile:', err);
      router.push('/artist-onboarding?step=1');
    });
}, [router]);




  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        // const csrfToken = await getCsrfToken();
        const res = await backendApi.get(
          '/media_streaming_management/get_my_withdrawals/',
          // { headers: { "X-CSRFToken": csrfToken } }
        );
        if (res.data.status === 'success') {
          setWithdrawals(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load withdrawals:', err);
      }
    };
    fetchWithdrawals();
  }, []);

// ── Load earnings ─────────────────────────────────────────────
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        // const csrfToken = await getCsrfToken();
        const res = await backendApi.get(
          '/media_streaming_management/get_artist_earnings/',
          // { headers: { "X-CSRFToken": csrfToken } }
        );

        console.log('Earnings response:', res.data);
        if (res.data.status === 'success') {
          setEarnings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load earnings:', err);
      } finally {
        setEarningsLoading(false);
      }
    };
    fetchEarnings();
  }, []);


  // ── Load tracks ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        // const csrfToken = await getCsrfToken();
        const res = await backendApi.get(
          '/media_streaming_management/my_tracks/',
          // { headers: { "X-CSRFToken": csrfToken } }
        );
        if (res.data.status === 'success') {
          setTracks(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load tracks:', err);
      } finally {
        setTracksLoading(false);
      }
    };
    fetchTracks();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {/* <h1 className="text-2xl font-bold">Artist Dashboard</h1> */}
            <h1 className="text-2xl font-bold">
              Welcome, {profile?.user?.first_name || 'Artist'}
            </h1>
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


               {/* Update the Withdraw Funds button */}
              <Button
                className="bg-gradient-to-r from-gold to-coral hover:opacity-90"
                onClick={() => setShowWithdrawal(true)}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Withdraw Funds
              </Button>

               <button
          onClick={() => setShowProfile(true)}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Profile
        </button>


        {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

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

      {/* // Add modal render — place it alongside your existing upload modal */}
{showWithdrawal && (
  <WithdrawalModal
    onClose={() => setShowWithdrawal(false)}
    availableBalance={parseFloat(earnings?.balance_credits || 0)}
    onSuccess={(withdrawal) => {
      setShowWithdrawal(false);
      // Refresh earnings so balance updates immediately
      setEarnings(prev => ({
        ...prev,
        balance_credits: parseFloat(prev.balance_credits) - parseFloat(withdrawal.amount),
      }));
    }}
  />
)}

      <main className="container mx-auto px-6 py-8">
        {/* Metrics */}
    {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Earnings"
            value={earningsLoading ? '...' : `R${parseFloat(earnings?.total_earned || 0).toFixed(2)}`}
            change={`Balance: R${parseFloat(earnings?.balance_credits || 0).toFixed(2)}`}
            changeType="neutral"
            icon={DollarSign}
            variant="gold"
          />

          <MetricCard
        title="Stream Revenue"
        value="Beta"
        change="Activates when royalty pool is funded"
        changeType="neutral"
        icon={Music}
        variant="emerald"
      />

          
          {/* <MetricCard
            title="Available Balance"
            value={earningsLoading ? '...' : `R${parseFloat(earnings?.balance_credits || 0).toFixed(2)}`}
            change="Ready to withdraw"
            changeType="neutral"
            icon={Music}
            variant="emerald"
          /> */}
          <MetricCard
            title="Total Withdrawn"
            value={earningsLoading ? '...' : `R${parseFloat(earnings?.total_withdrawn || 0).toFixed(2)}`}
            change="Lifetime payouts"
            changeType="neutral"
            icon={TrendingUp}
            variant="coral"
          />
          <MetricCard
            title="Total Tracks"
            value={tracksLoading ? '...' : tracks.length}
            change={`${tracks.filter(t => t.status === 'ready').length} live`}
            changeType="positive"
            icon={Users}
            variant="default"
          />
        </div>

        {/* Revenue Chart */}
        {/* Revenue Chart */}
    <div className="mb-8">
        {revenueLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading revenue data…
          </div>
        ) : (
          <RevenueChart data={revenueData} />
        )}
      </div>
        {/* <div className="mb-8">
          <RevenueChart data={revenueData} />
        </div> */}

        {/* Track Analytics */}
        {/* <TrackAnalytics tracks={tracks} /> */}
        <TrackAnalytics />


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
            {withdrawals.length === 0 && (
              <p className="text-sm text-muted-foreground">No payouts yet.</p>
            )}
            {withdrawals.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-4 hover:bg-muted"
              >
                  <div>
                    <p className="font-medium">R{parseFloat(payout.amount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payout.requested_at).toLocaleDateString()} · {payout.bank_name}
                    </p>
                  </div>
                                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  payout.status === 'paid' ? 'bg-emerald/10 text-emerald' :
                  payout.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </div>
            ))}
          </div>

          {/* <div className="space-y-3">
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
          </div> */}
        </div>
      </main>
    </div>
  );
}