'use client';

import { useState } from "react";
import { sendMixTip } from "@/utils/mixes_api_helper";

// Same color helper used across TrackAvatar / TipModal — duplicated
// locally so this component has no dependency on the tracks tree.
function nameToColor(name = '') {
  const colors = [
    ['#FF6B35', '#FF8C42'],
    ['#00C896', '#00A878'],
    ['#6C63FF', '#8B5CF6'],
    ['#FF3CAC', '#FF6B9D'],
    ['#F7C59F', '#E8A87C'],
    ['#43C6AC', '#191654'],
    ['#FC5C7D', '#6A3093'],
    ['#11998E', '#38EF7D'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Mix tips have a R10 minimum (MINIMUM_MIX_TIP_AMOUNT), vs R1 for tracks —
// preset amounts reflect that.
export function MixTipModal({ mix, onClose, onSuccess }) {
  const presetAmounts = [10, 20, 50, 100];
  const [selectedAmount, setSelectedAmount] = useState(20);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const colors = nameToColor(mix.dj_name);

  const handleSendTip = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await sendMixTip({ mixId: mix.id, creditsAmount: selectedAmount });

      if (res.status === 'success') {
        onSuccess(res);
      } else {
        setError(res.message || 'Tip failed.');
      }
    } catch (err) {
      console.error('Mix tip failed:', err);
      setError(err?.response?.data?.message || 'Tip failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#141414', border: '1px solid #222',
          borderRadius: 16, padding: 28,
          width: '100%', maxWidth: 360,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 16px' }}>
          Send a tip to {mix.dj_name} for "{mix.title}"
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {presetAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              style={{
                padding: '14px 0', borderRadius: 10, cursor: 'pointer',
                fontSize: 16, fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                border: selectedAmount === amount ? `1px solid ${colors[0]}` : '1px solid #2a2a2a',
                background: selectedAmount === amount
                  ? `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}22)`
                  : '#1a1a1a',
                color: selectedAmount === amount ? colors[0] : '#888',
                transition: 'all 0.15s ease',
              }}
            >
              R{amount}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: '#1a0a0a', border: '1px solid #3a1010',
            color: '#ff6b6b', fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={sending} style={{
            flex: 1, padding: '12px 0', borderRadius: 10,
            border: '1px solid #2a2a2a', background: 'transparent',
            color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Cancel
          </button>
          <button onClick={handleSendTip} disabled={sending} style={{
            flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: sending ? 0.7 : 1,
          }}>
            {sending ? 'Sending…' : `Tip R${selectedAmount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export { nameToColor as mixNameToColor };