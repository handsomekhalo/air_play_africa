
"use client";

import { X, UserRound, MapPin, Wallet } from "lucide-react";

export default function ArtistProfileModal({ profile, onClose }) {
  if (!profile) return null;

  const fields = [
    ["First Name", profile.user?.first_name],
    ["Last Name", profile.user?.last_name],
    ["Email", profile.user?.email],
    ["Location", profile.location],
    ["Bio", profile.bio],
    ["Wallet Address", profile.wallet_address],
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      {/* <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"> */}
<div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-700 bg-[#171717] p-6 text-white shadow-2xl">        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserRound className="h-6 w-6 text-[#FF6B35]" />
            <h2 className="text-xl font-bold">Artist Profile</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {fields.map(([label, value]) => (
            <div key={label}>
              <p className="mb-1 text-xs text-muted-foreground">
                {label}
              </p>
              <p className="break-words text-sm font-medium">
                {value || "Not provided"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Member since{" "}
            {profile.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
