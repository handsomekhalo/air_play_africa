


// // ─── Tip Modal ───────────────────────────────────────────────────

'use client';

import { useState, useEffect } from "react";
import { getCsrfToken } from "@/utils/csrf";
import backendApi from "../../../utils/backendApi";
// Reuse the same color helper — either import it if you extract it to utils,
// or duplicate it locally for now
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

export function TipModal({ track, onClose, onSuccess }) {
  const presetAmounts = [5, 10, 20, 50];
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const colors = nameToColor(track.artist_name);

  const handleSendTip = async () => {
    setSending(true);
    setError(null);
    try {
      const csrfToken = await getCsrfToken();
      const res = await backendApi.post(
        '/media_streaming_management/send_tip/',
        { track_id: track.id, credits_amount: selectedAmount },
        { headers: { "X-CSRFToken": csrfToken } }
      );

      if (res.data.status === 'success') {
        onSuccess(res.data);
      } else {
        setError(res.data.message || 'Tip failed.');
      }
    } catch (err) {
      console.error('Tip failed:', err);
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
          Send a tip to {track.artist_name}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {presetAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              style={{
                padding: '14px 0', borderRadius: 10, cursor: 'pointer',
                fontSize: 16, fontWeight: 700,
                border: selectedAmount === amount ? `1px solid ${colors[0]}` : '1px solid #2a2a2a',
                background: selectedAmount === amount
                  ? `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}22)`
                  : '#1a1a1a',
                color: selectedAmount === amount ? colors[0] : '#888',
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
          }}>
            Cancel
          </button>
          <button onClick={handleSendTip} disabled={sending} style={{
            flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            opacity: sending ? 0.7 : 1,
          }}>
            {sending ? 'Sending…' : `Tip R${selectedAmount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TipSuccessToast({ message, newBalance, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 300,
      background: '#0f1f17', border: '1px solid #1f4a35',
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <span style={{ fontSize: 18 }}>✅</span>
      <div>
        <p style={{ margin: '0 0 2px', color: '#4ade80', fontWeight: 700, fontSize: 13 }}>{message}</p>
        <p style={{ margin: 0, color: '#888', fontSize: 12 }}>New balance: R{newBalance}</p>
      </div>
    </div>
  );
}
// function TipModal({ track, onClose, onSuccess }) {
//   const presetAmounts = [5, 10, 20, 50];
//   const [selectedAmount, setSelectedAmount] = useState(10);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState(null);
//   const colors = nameToColor(track.artist_name);

//   const handleSendTip = async () => {
//     setSending(true);
//     setError(null);
//     try {
//       const csrfToken = await getCsrfToken();
//       const res = await backendApi.post(
//         '/media_streaming_management/send_tip/',
//         { track_id: track.id, credits_amount: selectedAmount },
//         { headers: { "X-CSRFToken": csrfToken } }
//       );

//       if (res.data.status === 'success') {
//         onSuccess(res.data);
//       } else {
//         setError(res.data.message || 'Tip failed.');
//       }
//     } catch (err) {
//       console.error('Tip failed:', err);
//       setError(err?.response?.data?.message || 'Tip failed. Please try again.');
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: 'fixed', inset: 0, zIndex: 200,
//         background: 'rgba(0,0,0,0.7)',
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         padding: 20,
//       }}
//     >
//       <div
//         onClick={e => e.stopPropagation()}
//         style={{
//           background: '#141414', border: '1px solid #222',
//           borderRadius: 16, padding: 28,
//           width: '100%', maxWidth: 360,
//           fontFamily: "'DM Sans', sans-serif",
//         }}
//       >
//         {/* Header */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
//           <TrackAvatar track={track} size={44} />
//           <div style={{ flex: 1, minWidth: 0 }}>
//             <p style={{
//               margin: '0 0 2px', color: '#fff', fontWeight: 700, fontSize: 14,
//               fontFamily: "'Syne', sans-serif",
//               whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
//             }}>{track.title}</p>
//             <p style={{ margin: 0, color: '#888', fontSize: 12 }}>{track.artist_name}</p>
//           </div>
//         </div>

//         <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 16px' }}>
//           Send a tip to support this artist
//         </p>

//         {/* Preset amounts */}
//         <div style={{
//           display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
//           marginBottom: 20,
//         }}>
//           {presetAmounts.map(amount => (
//             <button
//               key={amount}
//               onClick={() => setSelectedAmount(amount)}
//               style={{
//                 padding: '14px 0', borderRadius: 10, cursor: 'pointer',
//                 fontSize: 16, fontWeight: 700,
//                 fontFamily: "'Syne', sans-serif",
//                 border: selectedAmount === amount
//                   ? `1px solid ${colors[0]}`
//                   : '1px solid #2a2a2a',
//                 background: selectedAmount === amount
//                   ? `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}22)`
//                   : '#1a1a1a',
//                 color: selectedAmount === amount ? colors[0] : '#888',
//                 transition: 'all 0.15s ease',
//               }}
//             >
//               R{amount}
//             </button>
//           ))}
//         </div>

//         {error && (
//           <div style={{
//             padding: '10px 14px', borderRadius: 8, marginBottom: 16,
//             background: '#1a0a0a', border: '1px solid #3a1010',
//             color: '#ff6b6b', fontSize: 13,
//           }}>
//             ⚠️ {error}
//           </div>
//         )}

//         {/* Actions */}
//         <div style={{ display: 'flex', gap: 10 }}>
//           <button
//             onClick={onClose}
//             disabled={sending}
//             style={{
//               flex: 1, padding: '12px 0', borderRadius: 10,
//               border: '1px solid #2a2a2a', background: 'transparent',
//               color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer',
//               fontFamily: "'DM Sans', sans-serif",
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSendTip}
//             disabled={sending}
//             style={{
//               flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
//               background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
//               color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
//               fontFamily: "'DM Sans', sans-serif",
//               opacity: sending ? 0.7 : 1,
//             }}
//           >
//             {sending ? 'Sending…' : `Tip R${selectedAmount}`}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Tip Success Toast ───────────────────────────────────────────

// function TipSuccessToast({ message, newBalance, onClose }) {
//   useEffect(() => {
//     const timer = setTimeout(onClose, 3500);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   return (
//     <div style={{
//       position: 'fixed', top: 24, right: 24, zIndex: 300,
//       background: '#0f1f17', border: '1px solid #1f4a35',
//       borderRadius: 12, padding: '14px 18px',
//       display: 'flex', alignItems: 'center', gap: 10,
//       fontFamily: "'DM Sans', sans-serif",
//       animation: 'fadeUp 0.25s ease both',
//       boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
//     }}>
//       <span style={{ fontSize: 18 }}>✅</span>
//       <div>
//         <p style={{ margin: '0 0 2px', color: '#4ade80', fontWeight: 700, fontSize: 13 }}>
//           {message}
//         </p>
//         <p style={{ margin: 0, color: '#888', fontSize: 12 }}>
//           New balance: R{newBalance}
//         </p>
//       </div>
//     </div>
//   );
// }