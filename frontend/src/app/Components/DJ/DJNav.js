
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../../AuthContext';

const DJNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: 'Dashboard', href: '/dj/dashboard' },
    { label: 'Upload Mix', href: '/dj/upload' },
    { label: 'My Mixes', href: '/dj/mixes' },
    { label: 'Analytics', href: '/dj/analytics' },
    { label: 'Browse', href: '/browse/mixes' },
  ];

  const navigate = (href) => {
    setMenuOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const navItem = (item) => (
    <button
      key={item.href}
      onClick={() => navigate(item.href)}
      className="djn-link"
      style={{
        color: pathname === item.href ? '#fff' : '#888',
        fontWeight: pathname === item.href ? 700 : 500,
      }}
    >
      {item.label}
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .djn-bar {
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

        .djn-logo {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          cursor: pointer;
          background: none;
          border: none;
        }

        .djn-logo span {
          color: #FF6B35;
        }

        .djn-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .djn-desktop-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .djn-link {
          background: none;
          border: none;
          font-size: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          padding: 8px 0;
          text-align: left;
        }

        .djn-link:hover {
          color: #fff !important;
        }

        .djn-logout {
          color: #FF6B6B !important;
        }

        .djn-menu-btn {
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

        .djn-mobile-menu {
          display: none;
          position: absolute;
          top: 64px;
          left: 24px;
          right: 24px;
          background: #141414;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 12px 16px;
          flex-direction: column;
          gap: 4px;
        }

        .djn-mobile-menu.open {
          display: flex;
        }

        @media (max-width: 900px) {
          .djn-desktop-links {
            display: none;
          }

          .djn-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      <nav className="djn-bar">
        <button
          className="djn-logo"
          onClick={() => navigate('/dj/dashboard')}
        >
          AirPlay<span>Africa</span>
        </button>

        <div className="djn-right">
          <div className="djn-desktop-links">
            {links.map(navItem)}

            <button
              onClick={handleLogout}
              className="djn-link djn-logout"
            >
              Logout
            </button>
          </div>

          <button
            className="djn-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`djn-mobile-menu ${menuOpen ? 'open' : ''}`}>
          {links.map(navItem)}

          <button
            onClick={handleLogout}
            className="djn-link djn-logout"
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default DJNav;
