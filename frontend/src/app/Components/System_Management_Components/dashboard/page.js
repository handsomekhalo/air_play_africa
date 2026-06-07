'use client';

// import { useAuthGuard } from '@/utils/useAuthGuard';
  import React from 'react';

import DashboardPage from '../../DashboardComponents/page'; 
 import Navbar from './SideBarComponent/navheader';
  
  export default function Dashboard() {
  // useAuthGuard('/login', 'Admin');
  return (
    
    <div className="flex min-h-screen">
      
      {/* Sidebar on the left */}
      {/* <Sidebar /> */}

      {/* Dashboard content on the right */}
      <div className="flex-1 p-8">
        <Navbar />
        <DashboardPage />
      </div>

    </div>
  );
}

