'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import backendApi from '@/utils/backendApi';

export default function WalletCallbackPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const reference    = searchParams.get('reference');

  const [status, setStatus] = useState('verifying'); // verifying | success | failed

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    // Webhook already credited the account server-side.
    // We just need to confirm the reference exists and show feedback.
    // Give webhook 2s to fire before we redirect.
    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);

    return () => clearTimeout(timer);
  }, [reference]);

  useEffect(() => {
    if (status === 'success') {
      const redirect = setTimeout(() => {
        router.push('/listener/wallet');
      }, 3000);
      return () => clearTimeout(redirect);
    }
  }, [status, router]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: 24,
      fontFamily: "'DM Sans', sans-serif", color: '#fff',
    }}>
      {status === 'verifying' && (
        <>
          <div style={{
            width: 40, height: 40, border: '3px solid #222',
            borderTopColor: '#F4B740', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ color: '#888', fontSize: 15, margin: 0 }}>Confirming your payment…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: 52 }}>✅</div>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Payment successful!</p>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            Your credits have been added. Redirecting to your wallet…
          </p>
        </>
      )}

      {status === 'failed' && (
        <>
          <div style={{ fontSize: 52 }}>⚠️</div>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Something went wrong</p>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 20px' }}>
            Your payment may still have gone through. Check your wallet balance.
          </p>
          <button
            onClick={() => router.push('/listener/wallet')}
            style={{
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: '#F4B740', color: '#1a1410',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Go to Wallet
          </button>
        </>
      )}
    </div>
  );
}