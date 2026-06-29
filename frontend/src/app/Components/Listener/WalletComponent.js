'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/utils/useAuthGuard';
// import { getCreditBalance, initiateTopup } from '@/utils/wallet_helper';
// import { getCreditBalance, initiateTopup } from '../../utils/wallet_helper';
import { getCreditBalance, initiateTopup } from '../../../utils/wallet_helper';


// ─── Preset top-up amounts ────────────────────────────────────────
const PRESET_AMOUNTS = [20, 50, 100, 200];

// ─── Component ─────────────────────────────────────────────────

const WalletComponent = () => {
  useAuthGuard('/listener/login', 'Listener');

  const [balance, setBalance]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount]     = useState('');
  const [topupLoading, setTopupLoading]     = useState(false);
  const [topupError, setTopupError]         = useState(null);

  // ── Load balance ─────────────────────────────────────────────
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await getCreditBalance();
        if (res.status === 'success') {
          setBalance(res.data.balance);
        } else {
          setError('Could not load your balance.');
        }
      } catch (err) {
        console.error('Failed to load balance:', err);
        setError('Could not connect to server.');
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

  // ── Top-up handler ──────────────────────────────────────────
  const handleTopup = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (!amount || amount <= 0) {
      setTopupError('Enter an amount greater than R0.');
      return;
    }

    setTopupLoading(true);
    setTopupError(null);

    try {
      const res = await initiateTopup(amount);
      if (res.status === 'success' && res.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = res.authorization_url;
      } else {
        setTopupError(res.message || 'Could not start payment.');
        setTopupLoading(false);
      }
    } catch (err) {
      console.error('Top-up failed:', err);
      setTopupError(err?.response?.data?.message || 'Could not start payment. Try again.');
      setTopupLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .wallet-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          padding: 40px 24px 60px;
        }

        .wallet-container {
          max-width: 560px;
          margin: 0 auto;
        }

        .wallet-eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #555;
          margin: 0 0 8px;
        }

        .wallet-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 28px;
          letter-spacing: -0.02em;
        }

        /* Balance card */
        .balance-card {
          background: linear-gradient(135deg, #1a1410 0%, #141414 60%);
          border: 1px solid #2a2218;
          border-radius: 18px;
          padding: 32px 28px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }

        .balance-card::before {
          content: '';
          position: absolute;
          top: -60%;
          right: -20%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(244,183,64,0.12) 0%, transparent 70%);
          animation: shimmer 6s ease-in-out infinite alternate;
        }

        @keyframes shimmer {
          from { transform: translate(0, 0) scale(1); opacity: 0.6; }
          to   { transform: translate(-30px, 30px) scale(1.15); opacity: 1; }
        }

        .balance-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a7a5c;
          margin: 0 0 10px;
          position: relative;
        }

        .balance-amount {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 800;
          color: #F4B740;
          margin: 0;
          line-height: 1;
          letter-spacing: -0.02em;
          position: relative;
        }

        .balance-amount .currency {
          font-size: 28px;
          font-weight: 700;
          opacity: 0.6;
          margin-right: 6px;
        }

        .balance-sub {
          font-size: 13px;
          color: #6b6354;
          margin: 10px 0 0;
          position: relative;
        }

        .balance-skeleton {
          width: 180px;
          height: 56px;
          background: linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%);
          background-size: 200% 100%;
          animation: skeleton-load 1.4s ease-in-out infinite;
          border-radius: 8px;
        }

        @keyframes skeleton-load {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Top-up section */
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 14px;
        }

        .amount-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .amount-pill {
          padding: 14px 8px;
          border-radius: 10px;
          border: 1px solid #222;
          background: #111;
          color: #aaa;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .amount-pill:hover {
          border-color: #444;
          color: #fff;
        }

        .amount-pill.active {
          background: rgba(244,183,64,0.1);
          border-color: #F4B740;
          color: #F4B740;
        }

        .custom-amount-wrap {
          position: relative;
          margin-bottom: 24px;
        }

        .custom-amount-prefix {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
          font-size: 15px;
          font-weight: 600;
          pointer-events: none;
        }

        .custom-amount-input {
          width: 100%;
          box-sizing: border-box;
          background: #111;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 14px 16px 14px 32px;
          color: #fff;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
        }

        .custom-amount-input::placeholder { color: #444; }
        .custom-amount-input:focus {
          outline: none;
          border-color: #F4B740;
        }

        .topup-btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: #F4B740;
          color: #1a1410;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .topup-btn:hover:not(:disabled) {
          background: #ffc94d;
        }

        .topup-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .topup-note {
          font-size: 12px;
          color: #555;
          text-align: center;
          margin: 14px 0 0;
        }

        .feedback {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .feedback-error {
          background: rgba(255,107,107,0.1);
          border: 1px solid rgba(255,107,107,0.3);
          color: #FF6B6B;
        }

        .info-strip {
          margin-top: 32px;
          padding: 16px 18px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          font-size: 13px;
          color: #888;
          line-height: 1.6;
        }

        .info-strip strong {
          color: #ccc;
        }

        @media (max-width: 480px) {
          .amount-grid { grid-template-columns: repeat(2, 1fr); }
          .balance-amount { font-size: 44px; }
        }
      `}</style>

      <div className="wallet-page">
        <div className="wallet-container">

          <p className="wallet-eyebrow">Your Wallet</p>
          <h1 className="wallet-title">Credits</h1>

          {/* Balance card */}
          <div className="balance-card">
            <p className="balance-label">Available balance</p>
            {loading ? (
              <div className="balance-skeleton" />
            ) : error ? (
              <p style={{ color: '#FF6B6B', fontSize: 14, margin: 0 }}>{error}</p>
            ) : (
              <p className="balance-amount">
                <span className="currency">R</span>
                {Number(balance).toFixed(2)}
              </p>
            )}
            <p className="balance-sub">1 credit = R1 — tip your favourite artists anytime</p>
          </div>

          {/* Top-up section */}
          <p className="section-title">Add credits</p>

          <div className="amount-grid">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                className={`amount-pill ${selectedAmount === amt && !customAmount ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount('');
                  setTopupError(null);
                }}
              >
                R{amt}
              </button>
            ))}
          </div>

          <div className="custom-amount-wrap">
            <span className="custom-amount-prefix">R</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setTopupError(null);
              }}
              className="custom-amount-input"
            />
          </div>

          <button
            className="topup-btn"
            onClick={handleTopup}
            disabled={topupLoading}
          >
            {topupLoading
              ? 'Redirecting to payment…'
              : `Add R${customAmount || selectedAmount} to wallet`}
          </button>

          {topupError && (
            <div className="feedback feedback-error">⚠️ {topupError}</div>
          )}

          <p className="topup-note">Secure payment via Paystack — cards and EFT accepted</p>

          {/* Info strip */}
          <div className="info-strip">
            <strong>How tipping works:</strong> credits go straight to the artist when you
            tip a track. AirPlay Africa takes an 18% platform fee — the rest supports
            the artist directly. Minimum tip is R1.
          </div>

        </div>
      </div>
    </>
  );
};

export default WalletComponent;