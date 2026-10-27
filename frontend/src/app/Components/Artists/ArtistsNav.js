
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../AuthContext";
import {
  LayoutDashboard,
  Upload,
  Music,
  Wallet,
  UserRound,
  LogOut,
} from "lucide-react";

export default function ArtistNav({ onUpload, onWithdraw, onProfile }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card px-6 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link
          href="/artist/dashboard"
          className="text-xl font-bold text-[#FF6B35]"
        >
          AirPlay Africa
        </Link>
        

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/artist/dashboard" className="flex items-center gap-2 hover:text-[#FF6B35]">
            <LayoutDashboard size={17} /> Dashboard
          </Link>

          <button onClick={onUpload} className="flex items-center gap-2 hover:text-[#FF6B35]">
            <Upload size={17} /> Upload
          </button>

          <a href="#artist-tracks" className="flex items-center gap-2 hover:text-[#FF6B35]">
            <Music size={17} /> My Tracks
          </a>

          <a href="#artist-earnings" className="flex items-center gap-2 hover:text-[#FF6B35]">
            <Wallet size={17} /> Earnings
          </a>

          <button onClick={onWithdraw} className="flex items-center gap-2 hover:text-[#FF6B35]">
            <Wallet size={17} /> Withdraw
          </button>

          <button onClick={onProfile} className="flex items-center gap-2 hover:text-[#FF6B35]">
            <UserRound size={17} /> Profile
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
