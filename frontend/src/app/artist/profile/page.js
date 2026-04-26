'use client';

import ArtistProfileComponent from "@/app/Components/Artists/ArtistProfileComponent";

export default function ArtistProfilePage() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 6px 0',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          Artist Profile
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0,
          fontFamily: "'DM Sans', sans-serif"
        }}>
          View and update your profile details
        </p>
      </div>

      <ArtistProfileComponent />
    </div>
  );
}