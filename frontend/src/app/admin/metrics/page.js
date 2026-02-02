import RevenueChart from "@/components/admin/RevenueChart";
import TrackAnalytics from "@/components/admin/TrackAnalytics";

export default function AdminMetricsPage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Platform Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated performance data
        </p>
      </header>

      <RevenueChart />
      <TrackAnalytics />
    </div>
  );
}
