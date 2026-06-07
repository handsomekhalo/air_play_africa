'use client';

import TrackModerationComponent from '@/components/admin/TrackModerationComponent';


export default function Page() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          color: '#111827', margin: '0 0 4px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Track Moderation
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Review and approve or reject artist uploads
        </p>
      </div>
      <TrackModerationComponent />
    </div>
  );
}
