"use client"

import { useAuthGuard } from "@/utils/useAuthGuard";
import ArtistDashboardPage from "../DashboardTypeComponent/ArtistDashboardComponent";
// import AdminDashboard from "../DashboardTypeComponent/AdminDashboardComponent";
import Admin_Dashboard from "../../admin/dashboard/page";


export default function DashboardPage() {
  useAuthGuard('/login', 'Admin');

  const stats = {
    totalReconciliations: 12,
    averageAccuracy: 97,
    totalMinted: 25000,
    alerts: 2
  };

  return (
    <div >
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> */}
      <div className="">

        {/* <ArtistDashboardPage/> */}
        {/* <AdminDashboard/> */}
        <Admin_Dashboard/>


        {/* <StatCard
          title="Total Reconciliations"
          value={stats.totalReconciliations}
          subtitle="All time"
          icon={FileText}
          trend="+12%"
          trendUp={true}
        />

        <StatCard
          title="Average Accuracy"
          value={`${stats.averageAccuracy}%`}
          subtitle="Across all files"
          icon={TrendingUp}
          trend="+2.3%"
          trendUp={true}
        />

        <StatCard
          title="Total Minted"
          value={`$${stats.totalMinted.toLocaleString()}`}
          subtitle="PANZAR stablecoin"
          icon={Coins}
          trend="+8.5%"
          trendUp={true}
        />

        <StatCard
          title="Active Alerts"
          value={stats.alerts}
          subtitle="Require attention"
          icon={AlertTriangle}
          trend={stats.alerts > 0 ? "! High" : "Good"}
          trendUp={stats.alerts === 0}
        /> */}

      </div>
      
      {/* <div className="mt-5">
        <UploadFileButton />
      </div> */}
      
<div className="mt-5">
        {/* ✅ Render UploadPage instead of UploadFileButton */}
        {/* <UploadPage /> */}
      </div>


            
      <div className="mt-5 ">
        {/* <ReconciliationsTable /> */}
        {/* <ReconciliationFiles/> */}
      </div>

        <div className="mt-5 ">
        {/* <PanzarActivityFeed /> */}
      </div>


{/*  */}

    </div>
  );
}
