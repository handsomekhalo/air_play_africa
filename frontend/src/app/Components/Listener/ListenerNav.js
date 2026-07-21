'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCreditBalance } from '../../../utils/wallet_helper';

const ListenerNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [balance, setBalance] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await getCreditBalance();
        if (res.status === 'success') {
          setBalance(res.data.balance);
        }
      } catch (err) {
        console.error('Failed to load balance:', err);
      }
    };
    fetchBalance();
  }, [pathname]); // re-fetch when navigating back (e.g. after a tip)

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('user');
    router.replace('/listener/login');
  };

  const navItem = (label, href) => (
    <button
      onClick={() => { router.push(href); setMenuOpen(false); }}
      className="ln-link"
      style={{
        background: 'none',
        border: 'none',
        color: pathname === href ? '#fff' : '#888',
        fontWeight: pathname === href ? 700 : 500,
        fontSize: 14,
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        padding: '8px 0',
        textAlign: 'left',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .ln-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(10,10,10,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #1a1a1a;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'DM Sans', sans-serif;
        }

        .ln-logo {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.01em;
          cursor: pointer;
          background: none;
          border: none;
        }

        .ln-logo span { color: #FF6B35; }

        .ln-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ln-balance {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          background: rgba(244,183,64,0.1);
          border: 1px solid rgba(244,183,64,0.25);
          color: #F4B740;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ln-balance:hover {
          background: rgba(244,183,64,0.18);
        }

        .ln-desktop-links {
          display: flex;
          gap: 22px;
          align-items: center;
        }

        .ln-link:hover { color: #fff !important; }

        .ln-menu-btn {
          display: none;
          background: none;
          border: 1px solid #222;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .ln-mobile-menu {
          display: none;
          position: absolute;
          top: 64px;
          right: 24px;
          left: 24px;
          background: #141414;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 12px 16px;
          flex-direction: column;
          gap: 4px;
        }

        .ln-mobile-menu.open { display: flex; }

        .ln-logout {
          color: #FF6B6B !important;
        }

        @media (max-width: 640px) {
          .ln-desktop-links { display: none; }
          .ln-menu-btn { display: flex; align-items: center; justify-content: center; }
        }
      `}</style>

      <div className="ln-bar">
        <button className="ln-logo" onClick={() => router.push('/browse')}>
          AirPlay<span>Africa</span>
        </button>

        <div className="ln-right">
          <div className="ln-desktop-links">
            {navItem('Browse', '/browse')}
            {navItem('Charts', '/browse/charts')}

            {navItem('Profile', '/listener/profile')}
            <button
              onClick={handleLogout}
              className="ln-link ln-logout"
              style={{
                background: 'none', border: 'none', fontSize: 14,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                padding: '8px 0', fontWeight: 500,
              }}
            >
              Logout
            </button>
          </div>

          <button className="ln-balance" onClick={() => router.push('/listener/wallet')}>
            💰 R{balance !== null ? Number(balance).toFixed(2) : '—'}
          </button>

          <button className="ln-menu-btn" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`ln-mobile-menu ${menuOpen ? 'open' : ''}`}>
          {navItem('Browse', '/browse')}
          {navItem('Charts', '/browse/charts')}
          {navItem('Profile', '/listener/profile')}
          {navItem('Wallet', '/listener/wallet')}
          <button
            onClick={handleLogout}
            className="ln-link ln-logout"
            style={{
              background: 'none', border: 'none', fontSize: 14,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              padding: '8px 0', textAlign: 'left', fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default ListenerNav;